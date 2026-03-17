import { create } from "zustand";
import { apiClient } from "@/app/lib/api";
import type { SellerListing, TradeOperation, PaginatedResponse } from "@/app/types";

interface MarketplaceState {
  // Listings
  listings: SellerListing[];
  myListings: SellerListing[];

  // Trade operations
  buyerTrades: TradeOperation[];
  sellerTrades: TradeOperation[];

  // Filters
  searchQuery: string;
  selectedCategory: string | null;

  // UI
  isLoading: boolean;
  error: string | null;

  // Pagination
  page: number;
  hasMore: boolean;

  // Actions
  fetchListings: () => Promise<void>;
  fetchMyListings: () => Promise<void>;
  fetchBuyerTrades: () => Promise<void>;
  fetchSellerTrades: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useMarketplaceStore = create<MarketplaceState>()((set, get) => ({
  listings: [],
  myListings: [],
  buyerTrades: [],
  sellerTrades: [],
  searchQuery: "",
  selectedCategory: null,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,

  fetchListings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { searchQuery, selectedCategory } = get();
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await apiClient.get<PaginatedResponse<SellerListing>>(
        `/seller/listings?${params}`
      );
      const payload = res as unknown as PaginatedResponse<SellerListing>;
      set({
        listings: payload.data ?? (payload as unknown as SellerListing[]),
        hasMore: payload.meta?.hasMore ?? false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load listings";
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyListings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get<SellerListing[]>("/seller/listings/my");
      set({ myListings: Array.isArray(res) ? res : [] });
    } catch (err) {
      if ((err as { response?: { status: number } }).response?.status !== 404) {
        const msg = err instanceof Error ? err.message : "Failed to load listings";
        set({ error: msg });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBuyerTrades: async () => {
    set({ isLoading: true, error: null });
    try {
      // The buyer endpoint returns accepted trade offers.
      // We normalise the response into TradeOperation shape for the UI.
      const res = await apiClient.get<TradeOperation[]>("/buyer/trades");
      set({ buyerTrades: Array.isArray(res) ? res : [] });
    } catch (err) {
      if ((err as { response?: { status: number } }).response?.status !== 404) {
        const msg = err instanceof Error ? err.message : "Failed to load orders";
        set({ error: msg });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSellerTrades: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.get<TradeOperation[]>("/seller/trades");
      set({ sellerTrades: Array.isArray(res) ? res : [] });
    } catch (err) {
      if ((err as { response?: { status: number } }).response?.status !== 404) {
        const msg = err instanceof Error ? err.message : "Failed to load trades";
        set({ error: msg });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      listings: [],
      myListings: [],
      buyerTrades: [],
      sellerTrades: [],
      searchQuery: "",
      selectedCategory: null,
      isLoading: false,
      error: null,
      page: 1,
      hasMore: true,
    }),
}));
