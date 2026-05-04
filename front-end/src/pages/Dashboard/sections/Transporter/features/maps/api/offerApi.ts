import { transportService } from '../../../../../../../services/transportService';
import type { TransportRequest } from '../../../../../../../services/transportService';
import { MapOffer, Location } from '../types';

/**
 * Parse address string into structured address object
 * Expected format: "street, city, state, country" or variations
 */
const parseAddress = (
  addressString?: string
): { street?: string | undefined; city: string; state: string; country: string } => {
  if (!addressString) {
    return { city: 'Unknown', state: 'Unknown', country: 'Unknown' };
  }

  // Split by comma and trim whitespace
  const parts = addressString.split(',').map((p) => p.trim());

  if (parts.length >= 3) {
    return {
      street: parts[0],
      city: parts[1] || 'Unknown',
      state: parts[2] || 'Unknown',
      country: parts[3] || 'Unknown',
    };
  } else if (parts.length === 2) {
    return {
      city: parts[0] || 'Unknown',
      state: parts[1] || 'Unknown',
      country: 'Unknown',
    };
  } else if (parts.length === 1) {
    return {
      city: parts[0] || 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
    };
  }

  return { city: addressString, state: 'Unknown', country: 'Unknown' };
};

/**
 * Map TransportRequest status to MapOffer status
 */
const mapOfferStatus = (
  requestStatus: string
): 'pending' | 'accepted' | 'in_transit' | 'delivered' => {
  switch (requestStatus?.toLowerCase()) {
    case 'open':
    case 'pending':
      return 'pending';
    case 'accepted':
    case 'assigned':
      return 'accepted';
    case 'in_transit':
    case 'in_progress':
      return 'in_transit';
    case 'delivered':
    case 'completed':
      return 'delivered';
    default:
      return 'pending';
  }
};

/**
 * Convert TransportRequest to MapOffer
 * Handles pickup points array - uses first pickup point for map visualization
 */
const mapTransportRequestToMapOffer = (request: TransportRequest): MapOffer => {
  // Use first pickup point (transport requests can have multiple pickups)
  const firstPickup = request.pickupPoints?.[0];

  const pickup: Location = {
    coordinates: {
      latitude: firstPickup?.lat || 25.2854,
      longitude: firstPickup?.lng || 51.531,
    },
    address: parseAddress(firstPickup?.address),
    name: firstPickup?.sellerName || 'Pickup Location',
    type: 'pickup',
  };

  const delivery: Location = {
    coordinates: {
      latitude: request.deliveryPoint?.lat || 25.2854,
      longitude: request.deliveryPoint?.lng || 51.531,
    },
    address: parseAddress(request.deliveryPoint?.address),
    name: 'Delivery Location',
    type: 'delivery',
  };

  // Extract product type from trade operation if available
  const productType =
    request.tradeOperation?.buyListing?.product?.category ||
    request.tradeOperation?.buyListing?.product?.name ||
    'Unknown';

  const mapOffer: MapOffer = {
    id: request.id,
    quantity: request.totalWeight || 0,
    pickup,
    delivery,
    deadline: new Date(request.biddingDeadline),
    status: mapOfferStatus(request.status),
    estimatedValue: request.lowestBid || request.maxBudget || 0,
    productType,
  };

  return mapOffer;
};

/**
 * Get map data for a single offer by ID
 * Fetches from live backend API
 */
export const getOfferMapData = async (offerId: string): Promise<MapOffer> => {
  try {
    const request = await transportService.getRequestById(offerId);
    return mapTransportRequestToMapOffer(request);
  } catch (error) {
    console.error('Error fetching offer map data:', error);
    throw error;
  }
};

/**
 * Get map data for multiple offers
 * Fetches available transport requests from live backend API
 */
export const getMultipleOffersMapData = async (offerIds?: string[]): Promise<MapOffer[]> => {
  try {
    // If specific IDs provided, fetch them individually
    if (offerIds && offerIds.length > 0) {
      const offerPromises = offerIds.map((id) => getOfferMapData(id));
      return Promise.all(offerPromises);
    }

    // Otherwise, fetch all available requests
    const requests = await transportService.getAvailableRequests();
    return requests.map(mapTransportRequestToMapOffer);
  } catch (error) {
    console.error('Error fetching multiple offers map data:', error);
    throw error;
  }
};
