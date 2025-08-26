// Google Maps Configuration
// This file centralizes all map-related configuration

import { Platform } from 'react-native';

// Your Google Maps Platform API Key
// This key has 31 APIs enabled including Maps, Places, Geocoding, etc.
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Optional: Use different keys for different platforms to track usage
export const getPlatformApiKey = () => {
  return Platform.select({
    ios: GOOGLE_MAPS_API_KEY,
    android: GOOGLE_MAPS_API_KEY,
    web: GOOGLE_MAPS_API_KEY,
    default: GOOGLE_MAPS_API_KEY,
  });
};

// Map default settings
export const MAP_DEFAULTS = {
  // Default center (Bulgaria)
  center: {
    lat: 42.7339,
    lng: 25.4858,
  },
  zoom: 7,
  country: 'BG', // Bulgaria country code for search restrictions
};

// Google Maps styling (optional - makes map look better)
export const MAP_STYLES = [
  {
    featureType: 'poi.business',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
];

// Places Autocomplete configuration
export const PLACES_CONFIG = {
  // Restrict search to Bulgaria by default
  componentRestrictions: { country: 'bg' },
  
  // Types of places to search for
  types: ['establishment', 'geocode'],
  
  // Fields to return (affects billing)
  fields: [
    'address_components',
    'formatted_address',
    'geometry',
    'name',
    'place_id',
  ],
  
  // Language
  language: 'en',
};

// Geocoding configuration
export const GEOCODING_CONFIG = {
  // Result type preferences for reverse geocoding
  resultTypes: ['street_address', 'route', 'locality'],
  
  // Language for results
  language: 'en',
  
  // Region bias (Bulgaria)
  region: 'bg',
};