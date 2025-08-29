import { apiClient } from './api';
import { Platform } from 'react-native';

export interface LocationData {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface PricingData {
  productId: string;
  productName: string;
  minPrice: number;
  maxPrice: number;
  avgPrice?: number;
  currency: string;
  confidence?: number;
}

export interface CitySearchResult {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  latitude: number;
  longitude: number;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  currencyCode: string;
}

class LocationService {
  /**
   * Get user's current location using browser geolocation
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            let errorMessage = 'Failed to get location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        // For React Native, we would use expo-location or react-native-geolocation
        reject(new Error('Native location not implemented yet'));
      }
    });
  }

  /**
   * Reverse geocode coordinates to get location details
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    const response = await apiClient.post('/location/reverse-geocode', {
      latitude,
      longitude,
    });
    return response.data;
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<LocationData> {
    const response = await apiClient.post('/location/geocode', {
      address,
    });
    return response.data;
  }

  /**
   * Update user's saved location
   */
  async updateUserLocation(
    latitude: number,
    longitude: number,
    detectionMethod: 'auto' | 'manual' | 'ip-based' = 'manual',
    accuracy?: number
  ) {
    const response = await apiClient.post('/location/update', {
      latitude,
      longitude,
      detectionMethod,
      accuracy,
    });
    return response.data;
  }

  /**
   * Get pricing for a specific location
   */
  async getPricingForLocation(
    latitude: number,
    longitude: number,
    productIds?: string[]
  ): Promise<PricingData[]> {
    const response = await apiClient.post('/location/pricing', {
      latitude,
      longitude,
      productIds,
    });
    return response.data;
  }

  /**
   * Get user's saved pricing based on their location
   */
  async getUserPricing(): Promise<{
    location?: { latitude: number; longitude: number; cityId?: string };
    pricing: PricingData[];
    error?: string;
  }> {
    const response = await apiClient.get('/location/user-pricing');
    return response.data;
  }

  /**
   * Search for cities by name
   */
  async searchCities(query: string, countryCode?: string): Promise<CitySearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (countryCode) {
      params.append('country', countryCode);
    }
    
    const response = await apiClient.get(`/location/cities/search?${params.toString()}`);
    return response.data;
  }

  /**
   * Get list of supported countries
   */
  async getSupportedCountries(): Promise<Country[]> {
    const response = await apiClient.get('/location/countries');
    return response.data;
  }

  /**
   * Detect and save user's location
   */
  async detectAndSaveLocation(): Promise<{
    location: LocationData;
    pricing?: PricingData[];
  }> {
    try {
      // Get current coordinates
      const coords = await this.getCurrentLocation();
      
      // Reverse geocode to get location details
      const location = await this.reverseGeocode(coords.latitude, coords.longitude);
      
      // Save to user profile
      await this.updateUserLocation(
        coords.latitude,
        coords.longitude,
        'auto'
      );
      
      // Get pricing for this location
      const pricing = await this.getPricingForLocation(coords.latitude, coords.longitude);
      
      return { location, pricing };
    } catch (error) {
      console.error('Failed to detect location:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();