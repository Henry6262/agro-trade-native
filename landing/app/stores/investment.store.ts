"use client";

import { create } from "zustand";
import { apiClient } from "@/app/lib/api";
import type {
  InvestmentAsset,
  InvestmentPosition,
  UserInvestmentPreference,
} from "@/app/types";

interface ExecuteSwapInput {
  assetSymbol: string;
  amountUsdc: number;
  tradeOperationId?: string;
}

interface InvestmentState {
  assets: InvestmentAsset[];
  positions: InvestmentPosition[];
  preference: UserInvestmentPreference | null;
  isLoadingAssets: boolean;
  isLoadingPortfolio: boolean;
  isLoadingPreference: boolean;
  isSavingPreference: boolean;
  isSwapping: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  fetchPortfolio: (userId: string) => Promise<void>;
  fetchPreference: () => Promise<void>;
  updatePreference: (patch: Partial<UserInvestmentPreference>) => Promise<void>;
  executeSwap: (input: ExecuteSwapInput) => Promise<InvestmentPosition | null>;
  clearError: () => void;
}

export const useInvestmentStore = create<InvestmentState>()((set, get) => ({
  assets: [],
  positions: [],
  preference: null,
  isLoadingAssets: false,
  isLoadingPortfolio: false,
  isLoadingPreference: false,
  isSavingPreference: false,
  isSwapping: false,
  error: null,

  async fetchAssets() {
    set({ isLoadingAssets: true, error: null });
    try {
      const assets = await apiClient.get<InvestmentAsset[]>("/investments/assets");
      set({ assets: Array.isArray(assets) ? assets : [] });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load investment assets",
      });
    } finally {
      set({ isLoadingAssets: false });
    }
  },

  async fetchPortfolio(userId) {
    set({ isLoadingPortfolio: true, error: null });
    try {
      const positions = await apiClient.get<InvestmentPosition[]>(
        `/investments/portfolio/${userId}`,
      );
      set({ positions: Array.isArray(positions) ? positions : [] });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load portfolio",
      });
    } finally {
      set({ isLoadingPortfolio: false });
    }
  },

  async fetchPreference() {
    set({ isLoadingPreference: true, error: null });
    try {
      const preference = await apiClient.get<UserInvestmentPreference>(
        "/investments/preferences",
      );
      set({ preference });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load investment preference",
      });
    } finally {
      set({ isLoadingPreference: false });
    }
  },

  async updatePreference(patch) {
    set({ isSavingPreference: true, error: null });
    try {
      const nextPreference = await apiClient.patch<UserInvestmentPreference>(
        "/investments/preferences",
        patch,
      );
      set({ preference: nextPreference });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update preference",
      });
      throw error;
    } finally {
      set({ isSavingPreference: false });
    }
  },

  async executeSwap(input) {
    if (get().isSwapping) return null;

    set({ isSwapping: true, error: null });
    try {
      const position = await apiClient.post<InvestmentPosition>("/investments/swap", input);
      set((state) => ({ positions: [position, ...state.positions] }));
      return position;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Swap failed",
      });
      throw error;
    } finally {
      set({ isSwapping: false });
    }
  },

  clearError() {
    if (get().error) {
      set({ error: null });
    }
  },
}));
