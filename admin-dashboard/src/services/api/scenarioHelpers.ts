import { scenarioContext } from '../scenarioContext';
import { adminService } from './adminService';
import { buyerService } from './buyerService';
import { sellerService } from './sellerService';
import { transporterService } from './transporterService';
import { inspectorService } from './inspectorService';

export const scenarioHelpers = {
  createSaleListing: async (data: any) => {
    console.log('[API] Creating sale listing with data:', data);

    // Resolve farmer ID from context
    const farmer = scenarioContext.getUser('FARMER', data.farmerIndex || 0);
    if (!farmer) {
      throw new Error(`Farmer ${data.farmerIndex || 0} not found in context. Ensure farmer is created first.`);
    }

    // Call real API
    const result = await adminService.createFarmerSaleListing(farmer.id, {
      productCategory: data.productCategory,
      quantity: data.quantity,
      pricePerUnit: data.pricePerUnit,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    // Store in context
    scenarioContext.addEntity('saleListings', result);

    console.log('[API] Sale listing created:', result);
    return result;
  },

  createBuyListing: async (data: any) => {
    console.log('[API] Creating buy listing with data:', data);

    // Resolve buyer ID from context
    const buyer = scenarioContext.getUser('BUYER', data.buyerIndex || 0);
    if (!buyer) {
      throw new Error(`Buyer ${data.buyerIndex || 0} not found in context. Ensure buyer is created first.`);
    }

    // Get or use product ID
    const productId = scenarioContext.getProductId(data.productCategory || data.productId);

    // Call real API
    const result = await buyerService.createListing(buyer.id, {
      productId: productId,
      quantity: data.quantity,
      unit: data.unit || 'tons',
      maxPricePerUnit: data.maxPricePerUnit,
      neededBy: data.neededBy,
      description: data.description,
    });

    // Store in context
    scenarioContext.addEntity('buyListings', result);

    console.log('[API] Buy listing created:', result);
    return result;
  },

  createTradeOperation: async (data: any) => {
    console.log('[API] Creating trade operation with data:', data);

    // Resolve buy listing ID from context
    const buyListing = scenarioContext.getEntity('buyListings', data.buyListingIndex || 0);
    if (!buyListing) {
      throw new Error(`Buy listing ${data.buyListingIndex || 0} not found in context. Ensure buy listing is created first.`);
    }

    // Call real API
    const result = await adminService.createTradeOperation({
      buyListingId: buyListing.id,
      adminMargin: data.adminMargin || 0.1,
      buyerCommission: data.buyerCommission || 0.015,
      sellerCommission: data.sellerCommission || 0.025,
    });

    // Store in context
    scenarioContext.addEntity('tradeOperations', result);

    console.log('[API] Trade operation created:', result);
    return result;
  },

  initiateNegotiation: async (data: any) => {
    console.log('[API] Initiating negotiation with data:', data);

    // Resolve trade operation ID from context
    const tradeOperation = scenarioContext.getEntity('tradeOperations', data.tradeOperationIndex || 0);
    if (!tradeOperation) {
      throw new Error(`Trade operation ${data.tradeOperationIndex || 0} not found in context.`);
    }

    // Build offers array from data
    const offers = [];

    // Handle single offer
    if (data.farmerIndex !== undefined && data.saleListingIndex !== undefined) {
      const farmer = scenarioContext.getUser('FARMER', data.farmerIndex);
      const saleListing = scenarioContext.getEntity('saleListings', data.saleListingIndex);

      if (!farmer) throw new Error(`Farmer ${data.farmerIndex} not found`);
      if (!saleListing) throw new Error(`Sale listing ${data.saleListingIndex} not found`);

      offers.push({
        farmerId: farmer.id,
        saleListingId: saleListing.id,
        requestedQuantity: data.requestedQuantity,
        offeredPrice: data.offeredPrice,
      });
    }

    // Handle multiple offers if provided
    if (data.offers && Array.isArray(data.offers)) {
      for (const offer of data.offers) {
        const farmer = scenarioContext.getUser('FARMER', offer.farmerIndex);
        const saleListing = scenarioContext.getEntity('saleListings', offer.saleListingIndex);

        if (!farmer) throw new Error(`Farmer ${offer.farmerIndex} not found`);
        if (!saleListing) throw new Error(`Sale listing ${offer.saleListingIndex} not found`);

        offers.push({
          farmerId: farmer.id,
          saleListingId: saleListing.id,
          requestedQuantity: offer.requestedQuantity,
          offeredPrice: offer.offeredPrice,
        });
      }
    }

    if (offers.length === 0) {
      throw new Error('No valid offers to send');
    }

    // Call real API
    const result = await adminService.sendOffers({
      tradeOperationId: tradeOperation.id,
      offers: offers,
    });

    // Store negotiations in context (assuming result contains array of negotiations)
    if (result.negotiations) {
      result.negotiations.forEach((negotiation: any) => {
        scenarioContext.addEntity('negotiations', negotiation);
      });
    } else if (result.negotiation) {
      scenarioContext.addEntity('negotiations', result.negotiation);
    }

    console.log('[API] Negotiation initiated:', result);
    return result;
  },

  respondToNegotiation: async (data: any) => {
    console.log('[API] Responding to negotiation with data:', data);

    // Resolve negotiation ID from context
    const negotiation = scenarioContext.getEntity('negotiations', data.negotiationIndex || 0);
    if (!negotiation) {
      throw new Error(`Negotiation ${data.negotiationIndex || 0} not found in context.`);
    }

    // Resolve seller ID from context
    const seller = scenarioContext.getUser('FARMER', data.farmerIndex || 0);
    if (!seller) {
      throw new Error(`Farmer/Seller ${data.farmerIndex || 0} not found in context.`);
    }

    let result;

    // Determine response type
    if (data.response === 'accept' || data.accept === true) {
      // Accept offer
      result = await sellerService.acceptOffer(seller.id, negotiation.id);
    } else if (data.response === 'counter' || data.counterPrice !== undefined) {
      // Counter offer
      result = await sellerService.counterOffer(
        seller.id,
        negotiation.id,
        data.counterPrice,
        data.counterQuantity
      );
    } else if (data.response === 'reject' || data.reject === true) {
      // Reject offer
      result = await sellerService.rejectOffer(
        seller.id,
        negotiation.id,
        data.reason
      );
    } else {
      throw new Error('Invalid negotiation response. Must specify accept, counter, or reject.');
    }

    console.log('[API] Negotiation response sent:', result);
    return result;
  },

  requestInspection: async (data: any) => {
    console.log('[API] Requesting inspection with data:', data);

    // Resolve trade operation ID from context
    const tradeOperation = scenarioContext.getEntity('tradeOperations', data.tradeOperationIndex || 0);
    if (!tradeOperation) {
      throw new Error(`Trade operation ${data.tradeOperationIndex || 0} not found in context.`);
    }

    // Resolve inspector ID from context
    const inspector = scenarioContext.getUser('INSPECTOR', data.inspectorIndex || 0);
    if (!inspector) {
      throw new Error(`Inspector ${data.inspectorIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await adminService.assignInspector(
      tradeOperation.id,
      inspector.id
    );

    // Store inspection in context
    scenarioContext.addEntity('inspections', result);

    console.log('[API] Inspection requested:', result);
    return result;
  },

  submitInspection: async (data: any) => {
    console.log('[API] Submitting inspection with data:', data);

    // Resolve inspection ID from context
    const inspection = scenarioContext.getEntity('inspections', data.inspectionIndex || 0);
    if (!inspection) {
      throw new Error(`Inspection ${data.inspectionIndex || 0} not found in context.`);
    }

    // Resolve inspector ID from context
    const inspector = scenarioContext.getUser('INSPECTOR', data.inspectorIndex || 0);
    if (!inspector) {
      throw new Error(`Inspector ${data.inspectorIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await inspectorService.submitResults(inspector.id, {
      inspectionId: inspection.id,
      qualityScore: data.qualityScore || 85,
      result: data.result || 'PASSED',
      notes: data.notes,
    });

    console.log('[API] Inspection submitted:', result);
    return result;
  },

  createTransportRequest: async (data: any) => {
    console.log('[API] Creating transport request with data:', data);

    // Resolve trade operation ID from context
    const tradeOperation = scenarioContext.getEntity('tradeOperations', data.tradeOperationIndex || 0);
    if (!tradeOperation) {
      throw new Error(`Trade operation ${data.tradeOperationIndex || 0} not found in context.`);
    }

    // If direct transport assignment is requested
    if (data.transporterIndex !== undefined) {
      const transporter = scenarioContext.getUser('TRANSPORTER', data.transporterIndex);
      if (!transporter) {
        throw new Error(`Transporter ${data.transporterIndex} not found in context.`);
      }

      // Call createTransport directly
      const result = await adminService.createTransport({
        tradeOperationId: tradeOperation.id,
        transporterId: transporter.id,
        pickupLat: data.pickupLat || 0,
        pickupLng: data.pickupLng || 0,
        deliveryLat: data.deliveryLat || 0,
        deliveryLng: data.deliveryLng || 0,
        bidAmount: data.bidAmount || 500,
        estimatedDuration: data.estimatedDuration || 24,
      });

      scenarioContext.addEntity('transportJobs', result);
      console.log('[API] Transport created directly:', result);
      return result;
    }

    // Otherwise create transport request for bidding
    const result = await adminService.createTransportRequest({
      tradeOperationId: tradeOperation.id,
      pickupLat: data.pickupLat || 0,
      pickupLng: data.pickupLng || 0,
      deliveryLat: data.deliveryLat || 0,
      deliveryLng: data.deliveryLng || 0,
      distanceKm: data.distanceKm,
    });

    // Store transport request in context
    scenarioContext.addEntity('transportRequests', result);

    console.log('[API] Transport request created:', result);
    return result;
  },

  submitTransportBid: async (data: any) => {
    console.log('[API] Submitting transport bid with data:', data);

    // Resolve transport request ID from context
    const transportRequest = scenarioContext.getEntity('transportRequests', data.transportRequestIndex || 0);
    if (!transportRequest) {
      throw new Error(`Transport request ${data.transportRequestIndex || 0} not found in context.`);
    }

    // Resolve transporter ID from context
    const transporter = scenarioContext.getUser('TRANSPORTER', data.transporterIndex || 0);
    if (!transporter) {
      throw new Error(`Transporter ${data.transporterIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await transporterService.submitBid(transporter.id, {
      transportRequestId: transportRequest.id,
      bidAmount: data.bidAmount,
      estimatedDuration: data.estimatedDuration || 24,
      vehicleType: data.vehicleType,
      vehicleCapacity: data.vehicleCapacity,
    });

    // Store bid in context
    scenarioContext.addEntity('transportBids', result);

    console.log('[API] Transport bid submitted:', result);
    return result;
  },

  acceptTransportBid: async (data: any) => {
    console.log('[API] Accepting transport bid with data:', data);

    // Resolve transport request ID from context
    const transportRequest = scenarioContext.getEntity('transportRequests', data.transportRequestIndex || 0);
    if (!transportRequest) {
      throw new Error(`Transport request ${data.transportRequestIndex || 0} not found in context.`);
    }

    // Resolve transport bid ID from context
    const transportBid = scenarioContext.getEntity('transportBids', data.bidIndex || 0);
    if (!transportBid) {
      throw new Error(`Transport bid ${data.bidIndex || 0} not found in context.`);
    }

    // Call real API
    const result = await adminService.selectTransportBid({
      transportRequestId: transportRequest.id,
      bidId: transportBid.id,
    });

    // Store transport job in context
    scenarioContext.addEntity('transportJobs', result);

    console.log('[API] Transport bid accepted:', result);
    return result;
  },

  cleanupTestData: async () => {
    // Also reset the context when cleaning up test data
    scenarioContext.reset();
    return adminService.cleanupTestData();
  },
};
