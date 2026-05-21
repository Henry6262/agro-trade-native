import { Fleet } from '../types';

// Mock fleet data for different transporters
const mockFleets: Record<string, Fleet> = {
  'transporter-001': {
    transporterId: 'transporter-001',
    trucks: [
      {
        id: 'truck-001',
        registrationNumber: 'QTR-1234',
        capacity: 40,
        currentLocation: {
          coordinates: { latitude: 25.2654, longitude: 51.52 },
          address: {
            city: 'Doha',
            state: 'Ad Dawhah',
            country: 'Qatar',
          },
          type: 'truck_location',
        },
        status: 'available',
        lastUpdated: new Date(),
      },
      {
        id: 'truck-002',
        registrationNumber: 'QTR-5678',
        capacity: 40,
        currentLocation: {
          coordinates: { latitude: 25.2754, longitude: 51.515 },
          address: {
            city: 'Doha',
            state: 'Ad Dawhah',
            country: 'Qatar',
          },
          type: 'truck_location',
        },
        status: 'available',
        assignedDriver: 'driver-002',
        lastUpdated: new Date(),
      },
      {
        id: 'truck-003',
        registrationNumber: 'QTR-9012',
        capacity: 40,
        currentLocation: {
          coordinates: { latitude: 25.2554, longitude: 51.525 },
          address: {
            city: 'Doha',
            state: 'Ad Dawhah',
            country: 'Qatar',
          },
          type: 'truck_location',
        },
        status: 'in_transit',
        assignedDriver: 'driver-003',
        lastUpdated: new Date(),
      },
      {
        id: 'truck-004',
        registrationNumber: 'QTR-3456',
        capacity: 50,
        currentLocation: {
          coordinates: { latitude: 25.2854, longitude: 51.51 },
          address: {
            city: 'Doha',
            state: 'Ad Dawhah',
            country: 'Qatar',
          },
          type: 'truck_location',
        },
        status: 'available',
        lastUpdated: new Date(),
      },
    ],
    totalCapacity: 170,
    availableCapacity: 130,
    stats: {
      totalTrucks: 4,
      availableTrucks: 3,
      inTransitTrucks: 1,
      maintenanceTrucks: 0,
    },
  },
  'transporter-empty': {
    transporterId: 'transporter-empty',
    trucks: [],
    totalCapacity: 0,
    availableCapacity: 0,
    stats: {
      totalTrucks: 0,
      availableTrucks: 0,
      inTransitTrucks: 0,
      maintenanceTrucks: 0,
    },
  },
};

/**
 * Fetch available fleet data for a transporter
 * Mock implementation for testing and development
 */
export const fetchAvailableFleet = async (transporterId: string): Promise<Fleet> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const fleet = mockFleets[transporterId];

  if (!fleet) {
    throw new Error('Transporter not found');
  }

  // Create a deep copy with fresh Date objects
  const fleetCopy: Fleet = {
    ...fleet,
    trucks: fleet.trucks.map((truck) => ({
      ...truck,
      currentLocation: { ...truck.currentLocation },
      lastUpdated: new Date(),
    })),
  };

  return fleetCopy;
};
