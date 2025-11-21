import { MapOffer } from '../types';

// Mock offer data for different scenarios
const mockOffers: Record<string, MapOffer> = {
  // Support both IO-prefixed IDs (from TransporterTransfersTab) and T-prefixed IDs (from BiddingTab)
  T001: {
    id: 'T001',
    quantity: 25,
    pickup: {
      coordinates: { latitude: 25.2744, longitude: 51.5111 },
      address: {
        street: 'Farm Road 45',
        city: 'Iowa',
        state: 'IA',
        country: 'USA',
      },
      name: 'Iowa Farm Co.',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2854, longitude: 51.531 },
      address: {
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
      },
      name: 'Chicago Grain Terminal',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 3200,
    productType: 'grains',
  },
  T002: {
    id: 'T002',
    quantity: 40,
    pickup: {
      coordinates: { latitude: 25.3144, longitude: 51.4911 },
      address: {
        street: 'Harvest Road',
        city: 'Nebraska',
        state: 'NE',
        country: 'USA',
      },
      name: 'Nebraska Harvest',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2654, longitude: 51.541 },
      address: {
        city: 'Kansas',
        state: 'KS',
        country: 'USA',
      },
      name: 'Kansas Processing',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 4800,
    productType: 'grains',
  },
  T003: {
    id: 'T003',
    quantity: 15,
    pickup: {
      coordinates: { latitude: 25.1844, longitude: 51.5011 },
      address: {
        street: 'Organic Way',
        city: 'Illinois',
        state: 'IL',
        country: 'USA',
      },
      name: 'Illinois Organic',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.3254, longitude: 51.521 },
      address: {
        city: 'Milwaukee',
        state: 'WI',
        country: 'USA',
      },
      name: 'Milwaukee Port',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 36 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 2400,
    productType: 'vegetables',
  },
  IO001: {
    id: 'IO001',
    quantity: 30,
    pickup: {
      coordinates: { latitude: 25.2744, longitude: 51.5111 },
      address: {
        street: 'Farm Road 45',
        city: 'Iowa',
        state: 'IA',
        country: 'USA',
      },
      name: 'Iowa Premium Farms',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2854, longitude: 51.531 },
      address: {
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
      },
      name: 'Chicago Grain Terminal',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 3800,
    productType: 'grains',
  },
  IO002: {
    id: 'IO002',
    quantity: 22,
    pickup: {
      coordinates: { latitude: 25.3144, longitude: 51.4911 },
      address: {
        street: 'Organic Way',
        city: 'Nebraska',
        state: 'NE',
        country: 'USA',
      },
      name: 'Nebraska Organic Co.',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2654, longitude: 51.541 },
      address: {
        city: 'Kansas',
        state: 'KS',
        country: 'USA',
      },
      name: 'Kansas Processing Hub',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 2950,
    productType: 'vegetables',
  },
  'offer-001': {
    id: 'offer-001',
    quantity: 120,
    pickup: {
      coordinates: { latitude: 25.2744, longitude: 51.5111 },
      address: {
        street: 'Farm Road 45',
        city: 'Al Khor',
        state: 'Al Khor',
        country: 'Qatar',
      },
      name: 'Green Valley Farm',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2854, longitude: 51.531 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      name: 'Central Market',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    status: 'pending',
    estimatedValue: 50000,
    productType: 'vegetables',
  },
  'offer-002': {
    id: 'offer-002',
    quantity: 80,
    pickup: {
      coordinates: { latitude: 25.3144, longitude: 51.4911 },
      address: {
        street: 'Industrial Area',
        city: 'Al Rayyan',
        state: 'Al Rayyan',
        country: 'Qatar',
      },
      name: 'Desert Rose Farm',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2654, longitude: 51.541 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      name: 'West Bay Market',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
    status: 'pending',
    estimatedValue: 35000,
    productType: 'fruits',
  },
  'offer-003': {
    id: 'offer-003',
    quantity: 200,
    pickup: {
      coordinates: { latitude: 25.1844, longitude: 51.5011 },
      address: {
        city: 'Al Wakrah',
        state: 'Al Wakrah',
        country: 'Qatar',
      },
      name: 'Coastal Grains Co.',
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.3254, longitude: 51.521 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      name: 'North Distribution Center',
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 96 * 60 * 60 * 1000), // 96 hours from now
    status: 'pending',
    estimatedValue: 75000,
    productType: 'grains',
  },
  'offer-small': {
    id: 'offer-small',
    quantity: 30,
    pickup: {
      coordinates: { latitude: 25.2544, longitude: 51.5211 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2754, longitude: 51.511 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 12000,
    productType: 'dairy',
  },
  'offer-medium': {
    id: 'offer-medium',
    quantity: 120,
    pickup: {
      coordinates: { latitude: 25.2644, longitude: 51.5111 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2854, longitude: 51.521 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 36 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 48000,
    productType: 'vegetables',
  },
  'offer-large': {
    id: 'offer-large',
    quantity: 200,
    pickup: {
      coordinates: { latitude: 25.2744, longitude: 51.5011 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.2954, longitude: 51.531 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 60 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 85000,
    productType: 'grains',
  },
  'offer-pending': {
    id: 'offer-pending',
    quantity: 60,
    pickup: {
      coordinates: { latitude: 25.2844, longitude: 51.5111 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.3054, longitude: 51.521 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'pending',
    estimatedValue: 25000,
    productType: 'meat',
  },
  'offer-accepted': {
    id: 'offer-accepted',
    quantity: 80,
    pickup: {
      coordinates: { latitude: 25.2944, longitude: 51.5011 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.3154, longitude: 51.531 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
    status: 'accepted',
    estimatedValue: 32000,
    productType: 'fruits',
  },
  'offer-transit': {
    id: 'offer-transit',
    quantity: 100,
    pickup: {
      coordinates: { latitude: 25.3044, longitude: 51.4911 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'pickup',
    },
    delivery: {
      coordinates: { latitude: 25.3254, longitude: 51.541 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      type: 'delivery',
    },
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000),
    status: 'in_transit',
    estimatedValue: 42000,
    productType: 'vegetables',
  },
};

/**
 * Get map data for a single offer
 * Mock implementation for testing and development
 */
export const getOfferMapData = async (offerId: string): Promise<MapOffer> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  const offer = mockOffers[offerId];

  if (!offer) {
    throw new Error('Offer not found');
  }

  // Create a deep copy with proper Date object
  const offerCopy: MapOffer = {
    ...offer,
    pickup: { ...offer.pickup },
    delivery: { ...offer.delivery },
    deadline: new Date(offer.deadline),
  };

  return offerCopy;
};

/**
 * Get map data for multiple offers
 * Mock implementation for testing and development
 */
export const getMultipleOffersMapData = async (offerIds: string[]): Promise<MapOffer[]> => {
  // Fetch offers in parallel for efficiency
  const offerPromises = offerIds.map((id) => getOfferMapData(id));
  return Promise.all(offerPromises);
};
