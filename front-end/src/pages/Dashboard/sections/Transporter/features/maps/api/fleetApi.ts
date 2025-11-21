import { transportService } from '../../../../../../../services/transportService';
import { Fleet, Truck, Location } from '../types';

/**
 * Parse location from string format (e.g., "lat,lng" or address string)
 * Falls back to default location if parsing fails
 */
const parseLocation = (location: string): Location => {
  // Default location (Qatar)
  const defaultLocation: Location = {
    coordinates: { latitude: 25.2854, longitude: 51.531 },
    address: { city: 'Unknown', state: 'Unknown', country: 'Qatar' },
    type: 'truck_location',
  };

  if (!location) return defaultLocation;

  // Try to parse "lat,lng" format
  const coords = location.split(',').map((s) => parseFloat(s.trim()));
  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    return {
      coordinates: { latitude: coords[0], longitude: coords[1] },
      address: { city: 'Unknown', state: 'Unknown', country: 'Qatar' },
      type: 'truck_location',
    };
  }

  // If it's a text address, use default coordinates but keep the address
  return {
    ...defaultLocation,
    address: {
      city: location,
      state: 'Unknown',
      country: 'Qatar',
    },
  };
};

/**
 * Map backend truck status to frontend status
 */
const mapTruckStatus = (
  status: 'available' | 'assigned' | 'maintenance'
): 'available' | 'assigned' | 'in_transit' | 'maintenance' => {
  // Backend only has 'available' | 'assigned' | 'maintenance'
  // Map 'assigned' to 'assigned' (could be in_transit in reality)
  return status;
};

/**
 * Fetch available fleet data for the current transporter
 */
export const fetchAvailableFleet = async (transporterId?: string): Promise<Fleet> => {
  try {
    const response = await transportService.getMyFleet();

    // Map backend response to Fleet type
    const trucks: Truck[] = response.trucks.map((truck) => ({
      id: truck.id,
      registrationNumber: truck.licensePlate,
      capacity: truck.capacityTons,
      currentLocation: parseLocation(truck.location),
      status: mapTruckStatus(truck.status),
      assignedDriver: truck.driver || undefined,
      lastUpdated: new Date(),
      specifications: {
        model: truck.model,
      },
    }));

    // Calculate stats
    const totalCapacity = trucks.reduce((sum, truck) => sum + truck.capacity, 0);
    const availableTrucks = trucks.filter((t) => t.status === 'available').length;
    const inTransitTrucks = trucks.filter((t) => t.status === 'in_transit').length;
    const maintenanceTrucks = trucks.filter((t) => t.status === 'maintenance').length;
    const assignedTrucks = trucks.filter((t) => t.status === 'assigned').length;

    // Available capacity = capacity of available trucks
    const availableCapacity = trucks
      .filter((t) => t.status === 'available')
      .reduce((sum, truck) => sum + truck.capacity, 0);

    const fleet: Fleet = {
      transporterId: transporterId || 'current',
      trucks,
      totalCapacity,
      availableCapacity,
      stats: {
        totalTrucks: trucks.length,
        availableTrucks,
        inTransitTrucks: inTransitTrucks + assignedTrucks, // Count assigned as in transit for now
        maintenanceTrucks,
      },
    };

    return fleet;
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    throw error;
  }
};
