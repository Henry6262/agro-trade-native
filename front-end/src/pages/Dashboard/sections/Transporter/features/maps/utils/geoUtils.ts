/**
 * Geographic utility functions for route calculations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Apply road factor (1.3x for road distance vs straight line)
  return Math.round(distance * 1.3 * 10) / 10;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate estimated duration based on distance and traffic
 * @returns Duration in minutes
 */
export const calculateDuration = (
  distanceKm: number,
  includeTraffic: boolean = false,
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
): number => {
  const baseSpeed = 50; // km/h average speed
  let speed = baseSpeed;

  if (includeTraffic) {
    switch (timeOfDay) {
      case 'morning':
        speed = 35; // Morning rush hour
        break;
      case 'afternoon':
        speed = 40;
        break;
      case 'evening':
        speed = 38; // Evening rush hour
        break;
      case 'night':
        speed = 55; // Less traffic at night
        break;
      default:
        speed = 45;
    }
  }

  const durationHours = distanceKm / speed;
  const durationMinutes = Math.round(durationHours * 60);

  // Add buffer for loading/unloading
  return durationMinutes + 15;
};

/**
 * Generate a mock encoded polyline
 * In production, this would use Google's polyline encoding
 */
export const generateMockPolyline = (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): string => {
  // This is a simplified mock - real implementation would use Google's encoding
  const points = 10;
  const latDiff = (endLat - startLat) / points;
  const lonDiff = (endLon - startLon) / points;

  let polyline = '';
  for (let i = 0; i <= points; i++) {
    const lat = startLat + latDiff * i;
    const lon = startLon + lonDiff * i;
    // Simple encoding for mock
    polyline += `${Math.round(lat * 1e5)}${Math.round(lon * 1e5)}`;
    if (i < points) polyline += '~';
  }

  // Add some variation to make it look more realistic
  return polyline.replace(/~/g, Math.random() > 0.5 ? '~' : '@');
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (lat: number, lon: number): boolean => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
