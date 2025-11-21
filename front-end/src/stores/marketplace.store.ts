import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Product, ProductCategory } from '../shared/types';

interface MarketplaceState {
  // Products
  products: Product[];
  featuredProducts: Product[];
  categories: ProductCategory[];

  // Search and filtering
  searchQuery: string;
  selectedCategory: string | null;
  filters: {
    priceRange: [number, number];
    isOrganic: boolean | null;
    location: string | null;
    rating: number | null;
  };

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Actions
  setProducts: (products: Product[]) => void;
  addProducts: (products: Product[]) => void;
  setFeaturedProducts: (products: Product[]) => void;
  setCategories: (categories: ProductCategory[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  updateFilters: (filters: Partial<MarketplaceState['filters']>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  updatePagination: (pagination: Partial<MarketplaceState['pagination']>) => void;
  resetPagination: () => void;
}

const initialFilters = {
  priceRange: [0, 1000] as [number, number],
  isOrganic: null,
  location: null,
  rating: null,
};

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: true,
};

export const useMarketplaceStore = create<MarketplaceState>()(
  immer((set, get) => ({
    // Initial state
    products: [],
    featuredProducts: [],
    categories: [],
    searchQuery: '',
    selectedCategory: null,
    filters: initialFilters,
    isLoading: false,
    isRefreshing: false,
    error: null,
    pagination: initialPagination,

    // Actions
    setProducts: (products: Product[]) => {
      set((state) => {
        state.products = products;
      });
    },

    addProducts: (products: Product[]) => {
      set((state) => {
        state.products.push(...products);
      });
    },

    setFeaturedProducts: (products: Product[]) => {
      set((state) => {
        state.featuredProducts = products;
      });
    },

    setCategories: (categories: ProductCategory[]) => {
      set((state) => {
        state.categories = categories;
      });
    },

    setSearchQuery: (query: string) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    setSelectedCategory: (categoryId: string | null) => {
      set((state) => {
        state.selectedCategory = categoryId;
      });
    },

    updateFilters: (newFilters: Partial<MarketplaceState['filters']>) => {
      set((state) => {
        state.filters = { ...state.filters, ...newFilters };
      });
    },

    clearFilters: () => {
      set((state) => {
        state.filters = initialFilters;
        state.selectedCategory = null;
        state.searchQuery = '';
      });
    },

    setLoading: (isLoading: boolean) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    setRefreshing: (isRefreshing: boolean) => {
      set((state) => {
        state.isRefreshing = isRefreshing;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    updatePagination: (newPagination: Partial<MarketplaceState['pagination']>) => {
      set((state) => {
        state.pagination = { ...state.pagination, ...newPagination };
      });
    },

    resetPagination: () => {
      set((state) => {
        state.pagination = initialPagination;
      });
    },
  }))
);
