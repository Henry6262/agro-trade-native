import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { useAuthStore } from '@stores/auth.store';
import { useOnboardingStore } from '@stores/onboarding.store';

const PENDING_LISTING_KEY = 'pendingBuyerListing';
const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

export interface PendingBuyerListing {
  productId: string;
  specifications: any;
  location: any;
  timestamp: number;
}

export class PendingListingService {
  static async savePendingListing(listing: PendingBuyerListing) {
    try {
      const data = JSON.stringify(listing);
      if (Platform.OS === 'web') {
        localStorage.setItem(PENDING_LISTING_KEY, data);
      } else {
        await AsyncStorage.setItem(PENDING_LISTING_KEY, data);
      }
      console.log('Saved pending buyer listing');
    } catch (error) {
      console.error('Failed to save pending listing:', error);
    }
  }

  static async getPendingListing(): Promise<PendingBuyerListing | null> {
    try {
      let data: string | null = null;
      
      if (Platform.OS === 'web') {
        data = localStorage.getItem(PENDING_LISTING_KEY);
      } else {
        data = await AsyncStorage.getItem(PENDING_LISTING_KEY);
      }
      
      if (!data) return null;
      
      const listing = JSON.parse(data) as PendingBuyerListing;
      
      // Check if listing is expired
      if (Date.now() - listing.timestamp > EXPIRY_TIME) {
        await this.clearPendingListing();
        return null;
      }
      
      return listing;
    } catch (error) {
      console.error('Failed to get pending listing:', error);
      return null;
    }
  }

  static async clearPendingListing() {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(PENDING_LISTING_KEY);
      } else {
        await AsyncStorage.removeItem(PENDING_LISTING_KEY);
      }
      console.log('Cleared pending buyer listing');
    } catch (error) {
      console.error('Failed to clear pending listing:', error);
    }
  }

  static async processPendingListing(): Promise<boolean> {
    try {
      const authState = useAuthStore.getState();
      
      // Only process if user is authenticated
      if (!authState.isAuthenticated) {
        console.log('User not authenticated, skipping pending listing processing');
        return false;
      }
      
      const pending = await this.getPendingListing();
      if (!pending) {
        console.log('No pending listing found');
        return false;
      }
      
      console.log('Processing pending buyer listing:', pending);
      
      // Create the buyer listing
      const buyerSpec = pending.specifications;
      const location = pending.location;
      
      // Parse delivery deadline if provided
      let neededBy = null;
      if (buyerSpec.deliveryDeadline) {
        const parts = buyerSpec.deliveryDeadline.split('/');
        if (parts.length === 3) {
          const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          neededBy = date.toISOString();
        }
      }
      
      const buyListingData = {
        productId: pending.productId,
        quantity: parseFloat(buyerSpec.quantity || '0'),
        unit: 'TON' as const,
        maxPricePerUnit: parseFloat(buyerSpec.pricePerKilo || buyerSpec.maxPrice || '0'),
        neededBy,
        deliveryLocation: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          city: location?.city,
          region: location?.region,
          country: location?.country,
          address: location?.address,
        },
        specifications: buyerSpec.specifications || {},
        notes: buyerSpec.notes,
        status: 'ACTIVE',
      };
      
      console.log('Submitting pending buy listing:', buyListingData);
      
      // Skip onboarding for authenticated users
      const currentUser = authState.user;
      if (!currentUser || (!currentUser.onboardingComplete && !currentUser.hasProfile)) {
        try {
          await apiClient.post('/onboarding/buyer', {
            requirements: [{
              category: pending.productId,
              estimatedQuantity: buyListingData.quantity,
              unit: buyListingData.unit,
              preferredLocation: location?.city,
            }]
          });
        } catch (error) {
          console.warn('Onboarding failed, continuing anyway:', error);
        }
      }
      
      // Create the listing
      const response = await apiClient.post('/buyer/listings', buyListingData);
      console.log('Pending buyer listing created successfully:', response.data);
      
      // Clear the pending listing
      await this.clearPendingListing();
      
      return true;
    } catch (error) {
      console.error('Failed to process pending listing:', error);
      return false;
    }
  }
}

export default PendingListingService;