import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommodityPrice, CommoditySymbol } from '../services/marketDataService';
import { NewsArticle } from '../services/newsService';
// Imported at module level — Zustand stores are singletons so circular refs
// resolve at call-time, not at module-evaluation time.
import { useNotificationStore } from './notification.store';

export interface PriceAlert {
  id: string;
  symbol: CommoditySymbol;
  condition: 'above' | 'below';
  threshold: number;
  triggered: boolean;
  createdAt: string;
}

const PRICE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const NEWS_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface MarketState {
  alerts: PriceAlert[];
  isLoadingNews: boolean;
  isLoadingPrices: boolean;
  lastNewsFetch: number;
  lastPriceFetch: number;
  news: NewsArticle[];
  prices: CommodityPrice[];
}

interface MarketActions {
  addAlert: (alert: Pick<PriceAlert, 'symbol' | 'condition' | 'threshold'>) => void;
  checkAlerts: () => void;
  fetchNews: () => Promise<void>;
  fetchPrices: () => Promise<void>;
  removeAlert: (id: string) => void;
}

const initialState: MarketState = {
  alerts: [],
  isLoadingNews: false,
  isLoadingPrices: false,
  lastNewsFetch: 0,
  lastPriceFetch: 0,
  news: [],
  prices: [],
};

export const useMarketStore = create<MarketState & MarketActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addAlert: (alert) => {
        const newAlert: PriceAlert = {
          ...alert,
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          triggered: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ alerts: [...state.alerts, newAlert] }));
      },

      removeAlert: (id) => {
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
      },

      checkAlerts: () => {
        const { alerts, prices } = get();
        let changed = false;

        const updated = alerts.map((alert) => {
          if (alert.triggered) return alert;

          const price = prices.find((p) => p.symbol === alert.symbol);
          if (!price) return alert;

          const isTriggered =
            (alert.condition === 'above' && price.price > alert.threshold) ||
            (alert.condition === 'below' && price.price < alert.threshold);

          if (isTriggered) {
            changed = true;
            // Fire in-app notification via notification store.
            useNotificationStore.getState().addNotification({
              title: 'Price Alert',
              body: `${alert.symbol} is ${alert.condition} $${alert.threshold.toFixed(2)} (now $${price.price.toFixed(2)})`,
              type: 'system',
            });
            return { ...alert, triggered: true };
          }

          return alert;
        });

        if (changed) set({ alerts: updated });
      },

      fetchPrices: async () => {
        const { lastPriceFetch, isLoadingPrices } = get();
        if (isLoadingPrices) return;
        if (Date.now() - lastPriceFetch < PRICE_TTL_MS) return;

        set({ isLoadingPrices: true });
        try {
          const { marketDataService } = await import('../services/marketDataService');
          await marketDataService.getPrices((price) => {
            // Progressive update — add each commodity as it arrives
            set((state) => ({
              prices: [...state.prices.filter((p) => p.symbol !== price.symbol), price],
              lastPriceFetch: Date.now(),
            }));
            get().checkAlerts();
          });
        } catch (error) {
          console.warn('[marketStore] fetchPrices failed:', error);
        } finally {
          set({ isLoadingPrices: false });
        }
      },

      fetchNews: async () => {
        const { lastNewsFetch, isLoadingNews } = get();
        if (isLoadingNews) return;
        if (Date.now() - lastNewsFetch < NEWS_TTL_MS) return;

        set({ isLoadingNews: true });
        try {
          const { newsService } = await import('../services/newsService');
          const news = await newsService.getAgriNews();
          set({ news, lastNewsFetch: Date.now() });
        } catch (error) {
          console.warn('[marketStore] fetchNews failed:', error);
        } finally {
          set({ isLoadingNews: false });
        }
      },
    }),
    {
      name: 'market-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        alerts: state.alerts,
        // Don't persist prices/news — always refetch on mount
      }),
    }
  )
);
