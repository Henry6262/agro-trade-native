import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { productService } from '@services/productService';
import { apiClient } from '@services/api';

// Type for product with specifications from backend
export interface ProductSpecification {
  id: string;
  code: string;
  name: string;
  unit: string;
  dataType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'ENUM';
  importance: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  displayOrder: number;
  minValue?: number;
  maxValue?: number;
}

export interface ProductWithSpecs {
  id: string;
  category: string;
  name: string;
  displayName: string;
  description?: string;
  image?: string;
  harvestSeason?: string;
  storageRecommendations?: string;
  priceRangeMin?: string;
  priceRangeMax?: string;
  defaultUnit: string;
  specifications: ProductSpecification[];
}

export interface Region {
  id: string;
  name: string;
  country: string;
  isActive: boolean;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  regionId: string;
}

export interface SpecificationType {
  id: string;
  code: string;
  name: string;
  unit?: string;
  dataType: string;
  minValue?: number;
  maxValue?: number;
}

interface ProductStore {
  // Data
  products: ProductWithSpecs[];
  regions: Region[];
  specificationTypes: SpecificationType[];

  // Loading states
  isLoadingProducts: boolean;
  isLoadingRegions: boolean;
  isLoadingSpecs: boolean;

  // Error states
  productsError: string | null;
  regionsError: string | null;
  specsError: string | null;

  // Timestamp for cache invalidation
  lastFetchedAt: Date | null;

  // Actions
  fetchProductsWithSpecs: () => Promise<void>;
  fetchRegions: () => Promise<void>;
  fetchSpecificationTypes: () => Promise<void>;
  fetchAllData: () => Promise<void>;

  // Getters
  getProductById: (id: string) => ProductWithSpecs | undefined;
  getProductByCategory: (category: string) => ProductWithSpecs | undefined;
  getProductSpecifications: (productId: string) => ProductSpecification[];
  getCitiesByRegion: (regionId: string) => City[];
  getSpecificationByCode: (code: string) => SpecificationType | undefined;

  // Cache management
  clearCache: () => void;
  isCacheValid: () => boolean;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useProductStore = create<ProductStore>()(
  immer((set, get) => ({
    // Initial state
    products: [],
    regions: [],
    specificationTypes: [],
    isLoadingProducts: false,
    isLoadingRegions: false,
    isLoadingSpecs: false,
    productsError: null,
    regionsError: null,
    specsError: null,
    lastFetchedAt: null,

    // Fetch products with specifications
    fetchProductsWithSpecs: async () => {
      const state = get();

      // Check cache validity - also check if products have specifications
      const hasSpecifications =
        state.products.length > 0 && state.products[0]?.specifications !== undefined;
      if (state.isCacheValid() && hasSpecifications) {
        console.log('Using cached products data with specifications');
        return;
      }

      console.log('Fetching fresh products data - cache invalid or missing specifications');

      set((draft) => {
        draft.isLoadingProducts = true;
        draft.productsError = null;
      });

      try {
        const response = await productService.getProductMetadata();
        console.log('Fetched products with specifications:', response);
        console.log('First product specs:', response[0]?.specifications);

        set((draft) => {
          draft.products = response as ProductWithSpecs[];
          draft.isLoadingProducts = false;
          draft.lastFetchedAt = new Date();
        });
      } catch (error: any) {
        console.error('Failed to fetch products:', error);
        set((draft) => {
          draft.productsError = error?.message || 'Failed to fetch products';
          draft.isLoadingProducts = false;
        });
      }
    },

    // Fetch regions with cities
    fetchRegions: async () => {
      const state = get();

      // Check cache validity
      if (state.isCacheValid() && state.regions.length > 0) {
        console.log('Using cached regions data');
        return;
      }

      set((draft) => {
        draft.isLoadingRegions = true;
        draft.regionsError = null;
      });

      try {
        const response = await apiClient.get<any>('/products/regions');
        console.log('Fetched regions:', response);

        set((draft) => {
          draft.regions = response.data || [];
          draft.isLoadingRegions = false;
        });
      } catch (error: any) {
        console.error('Failed to fetch regions:', error);
        set((draft) => {
          draft.regionsError = error?.message || 'Failed to fetch regions';
          draft.isLoadingRegions = false;
        });
      }
    },

    // Fetch specification types
    fetchSpecificationTypes: async () => {
      const state = get();

      // Check cache validity
      if (state.isCacheValid() && state.specificationTypes.length > 0) {
        console.log('Using cached specification types');
        return;
      }

      set((draft) => {
        draft.isLoadingSpecs = true;
        draft.specsError = null;
      });

      try {
        const response = await apiClient.get<any>('/products/specifications');
        console.log('Fetched specification types:', response);

        set((draft) => {
          draft.specificationTypes = response.data || [];
          draft.isLoadingSpecs = false;
        });
      } catch (error: any) {
        console.error('Failed to fetch specification types:', error);
        set((draft) => {
          draft.specsError = error?.message || 'Failed to fetch specification types';
          draft.isLoadingSpecs = false;
        });
      }
    },

    // Fetch all data at once
    fetchAllData: async () => {
      const state = get();

      // Check cache validity
      if (
        state.isCacheValid() &&
        state.products.length > 0 &&
        state.regions.length > 0 &&
        state.specificationTypes.length > 0
      ) {
        console.log('Using cached data for all resources');
        return;
      }

      console.log('Fetching all product data...');

      // Fetch all data in parallel, but don't let one failure stop the others
      // Use the methods directly from the state to avoid creating new references
      const results = await Promise.allSettled([
        state.fetchProductsWithSpecs(),
        state.fetchRegions(),
        state.fetchSpecificationTypes(),
      ]);

      // Log results
      results.forEach((result, index) => {
        const dataType = ['products', 'regions', 'specifications'][index];
        if (result.status === 'rejected') {
          console.error(`Failed to fetch ${dataType}:`, result.reason);
        } else {
          console.log(`Successfully fetched ${dataType}`);
        }
      });

      // Check if at least products were fetched successfully
      const productsLoaded = results[0].status === 'fulfilled';
      if (!productsLoaded) {
        throw new Error('Failed to load products data');
      }

      console.log('Product data fetch completed');
    },

    // Getters
    getProductById: (id: string) => {
      return get().products.find((p) => p.id === id);
    },

    getProductByCategory: (category: string) => {
      return get().products.find(
        (p) => p.category === category || p.name === category.toLowerCase().replace(/-/g, '_')
      );
    },

    getProductSpecifications: (productId: string) => {
      const product = get().products.find((p) => p.id === productId);
      return product?.specifications || [];
    },

    getCitiesByRegion: (regionId: string) => {
      const region = get().regions.find((r) => r.id === regionId);
      return region?.cities || [];
    },

    getSpecificationByCode: (code: string) => {
      return get().specificationTypes.find((s) => s.code === code);
    },

    // Cache management
    clearCache: () => {
      set((draft) => {
        draft.products = [];
        draft.regions = [];
        draft.specificationTypes = [];
        draft.lastFetchedAt = null;
        draft.productsError = null;
        draft.regionsError = null;
        draft.specsError = null;
      });
    },

    isCacheValid: () => {
      const state = get();
      if (!state.lastFetchedAt) return false;

      const now = new Date().getTime();
      const lastFetch = state.lastFetchedAt.getTime();
      return now - lastFetch < CACHE_DURATION;
    },
  }))
);

// Helper function to prefetch all data
export const prefetchProductData = async () => {
  const store = useProductStore.getState();
  await store.fetchAllData();
};
