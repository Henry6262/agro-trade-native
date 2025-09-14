import { RouteData, Location } from '../types';
import {
  calculateDistance,
  calculateDuration,
  generateMockPolyline,
  validateCoordinates,
} from '../utils/geoUtils';

interface RouteOptions {
  includeTraffic?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  includeAlternatives?: boolean;
}

interface TruckInfo {
  id: string;
  label: string;
  location: Location;
}

// Route colors for different trucks
const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899'];
const colorMap = new Map<string, string>();
let colorIndex = 0;

/**
 * Get a consistent color for a truck
 */
const getColorForTruck = (truckId: string): string => {
  if (!colorMap.has(truckId)) {
    colorMap.set(truckId, ROUTE_COLORS[colorIndex % ROUTE_COLORS.length]);
    colorIndex++;
  }
  return colorMap.get(truckId)!;
};

/**
 * Calculate a route from truck location through pickup to delivery
 * Mock implementation for testing and development
 */
export const calculateRoute = async (
  truckId: string,
  truckLabel: string,
  truckLocation: Location,
  pickupLocation: Location,
  deliveryLocation: Location,
  options?: RouteOptions
): Promise<RouteData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Validate coordinates
  const truckCoords = truckLocation.coordinates;
  const pickupCoords = pickupLocation.coordinates;
  const deliveryCoords = deliveryLocation.coordinates;
  
  if (!validateCoordinates(truckCoords.latitude, truckCoords.longitude) ||
      !validateCoordinates(pickupCoords.latitude, pickupCoords.longitude) ||
      !validateCoordinates(deliveryCoords.latitude, deliveryCoords.longitude)) {
    throw new Error('Invalid coordinates');
  }
  
  // Calculate distances 
  const distanceToPickup = calculateDistance(
    truckCoords.latitude,
    truckCoords.longitude,
    pickupCoords.latitude,
    pickupCoords.longitude
  );
  
  const distanceToDelivery = 
    pickupCoords.latitude === deliveryCoords.latitude && 
    pickupCoords.longitude === deliveryCoords.longitude
      ? 0
      : calculateDistance(
          pickupCoords.latitude,
          pickupCoords.longitude,
          deliveryCoords.latitude,
          deliveryCoords.longitude
        );
  
  // Calculate durations
  const durationToPickup = calculateDuration(
    distanceToPickup,
    options?.includeTraffic,
    options?.timeOfDay
  );
  
  const durationToDelivery = distanceToDelivery === 0 
    ? 0 
    : calculateDuration(
        distanceToDelivery,
        options?.includeTraffic,
        options?.timeOfDay
      );
  
  // Generate polyline
  const polyline = generateMockPolyline(
    truckCoords.latitude,
    truckCoords.longitude,
    deliveryCoords.latitude,
    deliveryCoords.longitude
  );
  
  // Create base route
  const route: RouteData = {
    truckId,
    truckLabel,
    polyline,
    waypoints: [truckLocation, pickupLocation, deliveryLocation],
    distance: {
      total: distanceToPickup + distanceToDelivery,
      toPickup: distanceToPickup,
      toDelivery: distanceToDelivery,
    },
    duration: {
      total: durationToPickup + durationToDelivery,
      toPickup: durationToPickup,
      toDelivery: durationToDelivery,
    },
    color: getColorForTruck(truckId),
  };
  
  // Add alternatives if requested
  if (options?.includeAlternatives) {
    const altPolyline = generateMockPolyline(
      truckCoords.latitude + 0.001,
      truckCoords.longitude + 0.001,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    );
    
    route.alternativeRoutes = [
      {
        truckId,
        truckLabel,
        polyline: altPolyline,
        waypoints: [truckLocation, pickupLocation, deliveryLocation],
        distance: {
          total: (distanceToPickup + distanceToDelivery) * 1.1,
          toPickup: distanceToPickup * 1.1,
          toDelivery: distanceToDelivery * 1.1,
        },
        duration: {
          total: (durationToPickup + durationToDelivery) * 0.9,
          toPickup: durationToPickup * 0.9,
          toDelivery: durationToDelivery * 0.9,
        },
        color: route.color,
      },
    ];
  }
  
  return route;
};

/**
 * Calculate multiple routes for multiple trucks
 * Mock implementation for testing and development
 */
export const calculateMultipleRoutes = async (
  trucks: TruckInfo[],
  pickupLocation: Location,
  deliveryLocation: Location,
  options?: RouteOptions
): Promise<RouteData[]> => {
  // Calculate routes in parallel for efficiency
  const routePromises = trucks.map(truck =>
    calculateRoute(
      truck.id,
      truck.label,
      truck.location,
      pickupLocation,
      deliveryLocation,
      options
    )
  );
  
  return Promise.all(routePromises);
};