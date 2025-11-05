/**
 * Location Display Utilities
 *
 * Handles both legacy flat string format and new nested object format
 * for backward compatibility with existing data.
 */

export interface LocationData {
  city: string;
  region: string;
}

export interface Address {
  id?: string;
  street?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  city?: string | {
    id: string;
    name: string;
    region?: {
      id: string;
      name: string;
      country: string;
    };
  };
  region?: string;
}

/**
 * Formats location data for display, handling both legacy and new formats
 *
 * Legacy format: { city: "Montana", region: "North-Western" }
 * New format: { city: { name: "Montana", region: { name: "North-Western" } } }
 *
 * @param address - Address object that may contain city/region data
 * @returns Formatted location with city and region
 */
export const formatLocation = (address?: Address | null): LocationData => {
  if (!address) {
    return { city: 'Unknown', region: 'Unknown' };
  }

  // Extract city - handle both flat string and nested object
  const city = typeof address.city === 'string'
    ? address.city
    : address.city?.name || 'Unknown';

  // Extract region - check flat string first, then nested object
  const region = address.region ||
    (typeof address.city === 'object' ? address.city?.region?.name : null) ||
    'Unknown';

  return { city, region };
};

/**
 * Formats location as a single display string
 *
 * @param address - Address object
 * @param separator - Separator between city and region (default: " • ")
 * @returns Formatted string like "Montana • North-Western"
 */
export const formatLocationString = (
  address?: Address | null,
  separator: string = ' • '
): string => {
  const { city, region } = formatLocation(address);
  return `${city}${separator}${region}`;
};

/**
 * Gets full address display with street, city, region, country
 *
 * @param address - Address object
 * @returns Full formatted address
 */
export const formatFullAddress = (address?: Address | null): string => {
  if (!address) return 'Unknown location';

  const { city, region } = formatLocation(address);
  const parts = [
    address.street,
    city !== 'Unknown' ? city : null,
    region !== 'Unknown' ? region : null,
    address.country
  ].filter(Boolean);

  return parts.join(', ') || 'Unknown location';
};

/**
 * Checks if an address has valid coordinates
 *
 * @param address - Address object
 * @returns true if latitude and longitude are present
 */
export const hasCoordinates = (address?: Address | null): boolean => {
  return !!(address?.latitude && address?.longitude);
};

/**
 * Gets coordinates from address
 *
 * @param address - Address object
 * @returns Coordinates or null
 */
export const getCoordinates = (
  address?: Address | null
): { lat: number; lng: number } | null => {
  if (!hasCoordinates(address)) return null;
  return {
    lat: address!.latitude!,
    lng: address!.longitude!
  };
};
