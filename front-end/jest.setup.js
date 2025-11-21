// Test setup for React Native Testing Library
// We'll add mocks as needed when tests require them

// Global test utilities
global.mockFleetData = {
  transporterId: 'transporter-001',
  trucks: [
    {
      id: 'truck-001',
      registrationNumber: 'QTR-1234',
      capacity: 40,
      currentLocation: {
        coordinates: { latitude: 25.2654, longitude: 51.52 },
        address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
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
        address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
        type: 'truck_location',
      },
      status: 'available',
      lastUpdated: new Date(),
    },
    {
      id: 'truck-003',
      registrationNumber: 'QTR-9012',
      capacity: 40,
      currentLocation: {
        coordinates: { latitude: 25.2554, longitude: 51.525 },
        address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
        type: 'truck_location',
      },
      status: 'available',
      lastUpdated: new Date(),
    },
  ],
  totalCapacity: 120,
  availableCapacity: 120,
  stats: {
    totalTrucks: 3,
    availableTrucks: 3,
    inTransitTrucks: 0,
    maintenanceTrucks: 0,
  },
};
