// Business Data Extractor Service
// Intelligently extracts and formats relevant business context from scenario steps

import type { ScenarioStep } from '../types/scenario';

export interface BusinessContext {
  primary: {
    icon: string;
    title: string;
    subtitle: string;
    role?: string;
  };
  details: {
    label: string;
    value: string | number;
    icon?: string;
    type: 'currency' | 'quantity' | 'location' | 'quality' | 'status' | 'text';
  }[];
  relationships?: {
    from: string;
    to: string;
    type: string;
  }[];
  status?: {
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  };
}

export class BusinessDataExtractor {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private static formatQuantity(quantity: number, unit: string = 'tons'): string {
    return `${quantity.toLocaleString()} ${unit}`;
  }

  private static formatLocation(location: any): string {
    if (!location) return 'Location not specified';
    if (location.address) return location.address;
    if (location.city && location.country) return `${location.city}, ${location.country}`;
    if (location.latitude && location.longitude) {
      return `📍 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    return 'Location provided';
  }

  static extractContext(step: ScenarioStep, result?: any): BusinessContext {
    const { action, data, actor } = step;

    switch (action) {
      case 'createTestUser':
        return this.extractUserContext(data, result);

      case 'createSaleListing':
      case 'createSellListing':
      case 'createFarmerSaleListing':
        return this.extractSaleListingContext(data, result);

      case 'createBuyListing':
        return this.extractBuyListingContext(data, result);

      case 'createTradeOperation':
        return this.extractTradeOperationContext(data, result);

      case 'sendNegotiation':
      case 'buyerInitiateNegotiation':
      case 'sendOffers':
        return this.extractNegotiationContext(data, result, 'sent');

      case 'sellerAcceptOffer':
      case 'acceptNegotiation':
      case 'acceptOffer':
        return this.extractNegotiationContext(data, result, 'accepted');

      case 'requestInspection':
      case 'assignInspector':
        return this.extractInspectionRequestContext(data, result);

      case 'submitInspection':
      case 'submitResults':
        return this.extractInspectionResultContext(data, result);

      case 'createTransportRequest':
      case 'createTransport':
        return this.extractTransportRequestContext(data, result);

      case 'transporterSubmitBid':
        return this.extractTransportBidContext(data, result);

      case 'adminSelectBid':
      case 'completeDelivery':
        return this.extractTransportStatusContext(data, result);

      case 'completeTrade':
        return this.extractTradeCompletionContext(data, result);

      default:
        return this.extractGenericContext(step, result);
    }
  }

  private static extractUserContext(data: any, result?: any): BusinessContext {
    const user = result || data;
    const roleIcons: Record<string, string> = {
      FARMER: '👨‍🌾',
      SELLER: '👨‍🌾',
      BUYER: '🏢',
      TRANSPORTER: '🚚',
      INSPECTOR: '🔍',
      ADMIN: '⚙️',
    };

    const context: BusinessContext = {
      primary: {
        icon: roleIcons[user.role] || '👤',
        title: user.companyName || user.name || 'New User',
        subtitle: `${user.role} Account`,
        role: user.role,
      },
      details: [],
    };

    // Add relevant user details
    if (user.email) {
      context.details.push({
        label: 'Email',
        value: user.email,
        type: 'text',
      });
    }

    if (user.location) {
      context.details.push({
        label: 'Location',
        value: this.formatLocation(user.location),
        icon: '📍',
        type: 'location',
      });
    }

    if (user.verified !== undefined) {
      context.status = {
        type: user.verified ? 'success' : 'warning',
        message: user.verified ? 'Verified Account' : 'Pending Verification',
      };
    }

    return context;
  }

  private static extractSaleListingContext(data: any, result?: any): BusinessContext {
    const listing = result || data;

    return {
      primary: {
        icon: '📦',
        title: `${listing.productType || listing.productCategory || 'Product'} for Sale`,
        subtitle: 'New Sale Listing',
      },
      details: [
        {
          label: 'Quantity Available',
          value: this.formatQuantity(listing.quantity, listing.unit),
          icon: '📊',
          type: 'quantity',
        },
        {
          label: 'Price per Ton',
          value: this.formatCurrency(listing.pricePerTon || listing.pricePerUnit),
          icon: '💰',
          type: 'currency',
        },
        {
          label: 'Total Value',
          value: this.formatCurrency((listing.pricePerTon || listing.pricePerUnit) * listing.quantity),
          icon: '💵',
          type: 'currency',
        },
        {
          label: 'Pickup Location',
          value: this.formatLocation(listing.location || { latitude: listing.latitude, longitude: listing.longitude }),
          icon: '📍',
          type: 'location',
        },
      ],
      status: {
        type: 'info',
        message: 'Available for Purchase',
      },
    };
  }

  private static extractBuyListingContext(data: any, result?: any): BusinessContext {
    const listing = result || data;

    return {
      primary: {
        icon: '🛒',
        title: `Buying ${listing.productType || listing.productCategory || 'Product'}`,
        subtitle: 'Purchase Request',
      },
      details: [
        {
          label: 'Quantity Needed',
          value: this.formatQuantity(listing.quantity, listing.unit),
          icon: '📊',
          type: 'quantity',
        },
        {
          label: 'Max Price per Ton',
          value: this.formatCurrency(listing.maxPricePerTon || listing.maxPricePerUnit),
          icon: '💰',
          type: 'currency',
        },
        {
          label: 'Max Budget',
          value: this.formatCurrency((listing.maxPricePerTon || listing.maxPricePerUnit) * listing.quantity),
          icon: '💵',
          type: 'currency',
        },
        {
          label: 'Delivery Location',
          value: this.formatLocation(listing.deliveryLocation || listing.location),
          icon: '📍',
          type: 'location',
        },
      ],
      status: {
        type: 'info',
        message: 'Seeking Suppliers',
      },
    };
  }

  private static extractTradeOperationContext(data: any, result?: any): BusinessContext {
    const operation = result || data;

    return {
      primary: {
        icon: '⚡',
        title: 'Trade Operation Created',
        subtitle: 'Coordinating Supply Chain',
      },
      details: [
        {
          label: 'Admin Margin',
          value: `${operation.adminMargin || 10}%`,
          icon: '📈',
          type: 'text',
        },
        {
          label: 'Buyer Commission',
          value: `${operation.buyerCommission || 1.5}%`,
          icon: '🏢',
          type: 'text',
        },
        {
          label: 'Seller Commission',
          value: `${operation.sellerCommission || 2.5}%`,
          icon: '👨‍🌾',
          type: 'text',
        },
      ],
      status: {
        type: 'success',
        message: 'Operation Active - Ready for Negotiations',
      },
    };
  }

  private static extractNegotiationContext(data: any, result: any = {}, type: 'sent' | 'accepted'): BusinessContext {
    const negotiation = result || data;

    const icon = type === 'sent' ? '📤' : '✅';
    const title = type === 'sent' ? 'Offer Sent' : 'Offer Accepted';
    const statusType = type === 'sent' ? 'info' : 'success';
    const statusMessage = type === 'sent' ? 'Awaiting Response' : 'Deal Confirmed';

    const details: any[] = [
      {
        label: 'Quantity',
        value: this.formatQuantity(negotiation.requestedQuantity || negotiation.quantity, 'tons'),
        icon: '📦',
        type: 'quantity',
      },
      {
        label: 'Offered Price',
        value: this.formatCurrency(negotiation.offeredPrice || negotiation.pricePerTon),
        icon: '💰',
        type: 'currency',
      },
      {
        label: 'Total Value',
        value: this.formatCurrency((negotiation.offeredPrice || negotiation.pricePerTon) * (negotiation.requestedQuantity || negotiation.quantity)),
        icon: '💵',
        type: 'currency',
      },
    ];

    if (negotiation.expiresAt) {
      details.push({
        label: 'Expires',
        value: '48 hours',
        icon: '⏰',
        type: 'text',
      });
    }

    return {
      primary: {
        icon,
        title,
        subtitle: 'Price Negotiation',
      },
      details,
      status: {
        type: statusType,
        message: statusMessage,
      },
    };
  }

  private static extractInspectionRequestContext(data: any, result?: any): BusinessContext {
    return {
      primary: {
        icon: '🔬',
        title: 'Quality Inspection Requested',
        subtitle: 'Verification Process',
      },
      details: [
        {
          label: 'Inspection Type',
          value: 'Pre-shipment Quality Check',
          icon: '📋',
          type: 'text',
        },
        {
          label: 'Priority',
          value: data.priority || 'MEDIUM',
          icon: '🎯',
          type: 'text',
        },
        {
          label: 'Inspector',
          value: result?.inspectorName || 'Assigning Inspector...',
          icon: '🔍',
          type: 'text',
        },
      ],
      status: {
        type: 'info',
        message: 'Inspection Scheduled',
      },
    };
  }

  private static extractInspectionResultContext(data: any, result?: any): BusinessContext {
    const inspection = result || data;
    const passed = inspection.passed || inspection.result === 'PASSED';

    return {
      primary: {
        icon: passed ? '✅' : '❌',
        title: `Inspection ${passed ? 'Passed' : 'Failed'}`,
        subtitle: 'Quality Verification Complete',
      },
      details: [
        {
          label: 'Quality Score',
          value: `${inspection.qualityScore}/100`,
          icon: '⭐',
          type: 'quality',
        },
        {
          label: 'Moisture Content',
          value: `${inspection.moistureContent || 12}%`,
          icon: '💧',
          type: 'text',
        },
        {
          label: 'Protein Level',
          value: `${inspection.proteinLevel || 14}%`,
          icon: '🌾',
          type: 'text',
        },
        {
          label: 'Inspector Notes',
          value: inspection.notes || 'Standard quality verified',
          icon: '📝',
          type: 'text',
        },
      ],
      status: {
        type: passed ? 'success' : 'error',
        message: passed ? 'Approved for Shipment' : 'Quality Issues Detected',
      },
    };
  }

  private static extractTransportRequestContext(data: any, result?: any): BusinessContext {
    const transport = result || data;

    return {
      primary: {
        icon: '🚛',
        title: 'Transport Job Created',
        subtitle: 'Logistics Coordination',
      },
      details: [
        {
          label: 'Distance',
          value: `${transport.distanceKm || 50} km`,
          icon: '📏',
          type: 'text',
        },
        {
          label: 'Estimated Duration',
          value: `${transport.estimatedDuration || transport.estimatedHours || 2} hours`,
          icon: '⏱️',
          type: 'text',
        },
        {
          label: 'Budget',
          value: this.formatCurrency(transport.bidAmount || transport.budget || 750),
          icon: '💰',
          type: 'currency',
        },
        {
          label: 'Pickup',
          value: this.formatLocation({ latitude: transport.pickupLat, longitude: transport.pickupLng }),
          icon: '📍',
          type: 'location',
        },
        {
          label: 'Delivery',
          value: this.formatLocation({ latitude: transport.deliveryLat, longitude: transport.deliveryLng }),
          icon: '🎯',
          type: 'location',
        },
      ],
      status: {
        type: 'info',
        message: 'Accepting Bids from Transporters',
      },
    };
  }

  private static extractTransportBidContext(data: any, result: any = {}): BusinessContext {
    const bid = result || data;

    return {
      primary: {
        icon: '💼',
        title: 'Transport Bid Submitted',
        subtitle: 'Logistics Proposal',
      },
      details: [
        {
          label: 'Bid Amount',
          value: this.formatCurrency(bid.bidAmount),
          icon: '💰',
          type: 'currency',
        },
        {
          label: 'Estimated Time',
          value: `${bid.estimatedHours || 2} hours`,
          icon: '⏱️',
          type: 'text',
        },
        {
          label: 'Fleet Size',
          value: `${bid.fleetSize || 3} vehicles`,
          icon: '🚚',
          type: 'text',
        },
        {
          label: 'Insurance',
          value: 'Full Coverage',
          icon: '🛡️',
          type: 'text',
        },
      ],
      status: {
        type: 'info',
        message: 'Bid Under Review',
      },
    };
  }

  private static extractTransportStatusContext(data: any, result?: any): BusinessContext {
    const isDelivery = data.action === 'completeDelivery';

    return {
      primary: {
        icon: isDelivery ? '✅' : '🚚',
        title: isDelivery ? 'Delivery Completed' : 'Transporter Assigned',
        subtitle: isDelivery ? 'Goods Delivered' : 'In Transit',
      },
      details: [
        {
          label: 'Status',
          value: isDelivery ? 'Delivered' : 'In Transit',
          icon: '📊',
          type: 'status',
        },
        {
          label: 'Tracking',
          value: 'Real-time GPS Active',
          icon: '📡',
          type: 'text',
        },
        {
          label: 'ETA',
          value: isDelivery ? 'Completed' : '2 hours remaining',
          icon: '⏰',
          type: 'text',
        },
      ],
      status: {
        type: 'success',
        message: isDelivery ? 'Trade Successfully Completed' : 'Shipment En Route',
      },
    };
  }

  private static extractTradeCompletionContext(data: any, result?: any): BusinessContext {
    return {
      primary: {
        icon: '🎉',
        title: 'Trade Operation Complete',
        subtitle: 'All Parties Paid',
      },
      details: [
        {
          label: 'Total Volume',
          value: this.formatQuantity(100, 'tons'),
          icon: '📦',
          type: 'quantity',
        },
        {
          label: 'Total Value',
          value: this.formatCurrency(18000),
          icon: '💰',
          type: 'currency',
        },
        {
          label: 'Farmers Paid',
          value: '3 suppliers',
          icon: '👨‍🌾',
          type: 'text',
        },
        {
          label: 'Duration',
          value: '48 hours end-to-end',
          icon: '⏱️',
          type: 'text',
        },
      ],
      status: {
        type: 'success',
        message: 'Trade Cycle Successfully Completed',
      },
    };
  }

  private static extractGenericContext(step: ScenarioStep, result?: any): BusinessContext {
    return {
      primary: {
        icon: '⚙️',
        title: step.action.replace(/([A-Z])/g, ' $1').trim(),
        subtitle: step.actor,
      },
      details: [
        {
          label: 'Action',
          value: step.action,
          type: 'text',
        },
        {
          label: 'Status',
          value: step.status || 'pending',
          type: 'status',
        },
      ],
    };
  }
}