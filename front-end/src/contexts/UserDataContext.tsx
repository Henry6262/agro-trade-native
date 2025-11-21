import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@stores/auth.store';
import { apiClient } from '@services/api';

// Types for different user data
export interface SellerProduct {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  currency: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  qualityTags: string[];
  certifications: string[];
  description?: string;
  images?: string[];
  status: 'active' | 'inactive' | 'sold_out';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
  inquiries: number;
}

export interface SellerOffer {
  id: string;
  productId: string;
  product: string;
  buyerId: string;
  buyerName: string;
  buyerLocation: string;
  quantity: number;
  offeredPricePerUnit: number;
  totalValue: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'negotiating';
  qualityRequirements: string[];
  deliveryDeadline: string;
  responseDeadline: string;
  adminNote?: string;
  estimatedProfit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SellerTrade {
  id: string;
  productId: string;
  product: string;
  buyerId: string;
  buyerName: string;
  buyerLocation: string;
  transporterId?: string;
  transporterName?: string;
  quantity: number;
  agreedPricePerUnit: number;
  totalValue: number;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  currentStage: number;
  pickupDate?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerStats {
  totalProducts: number;
  activeListings: number;
  totalOffers: number;
  pendingOffers: number;
  totalTrades: number;
  completedTrades: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}

// Context value type
interface UserDataContextValue {
  // Seller data
  sellerProducts: SellerProduct[];
  sellerOffers: SellerOffer[];
  sellerTrades: SellerTrade[];
  sellerStats: SellerStats | null;

  // Loading states
  isLoadingProducts: boolean;
  isLoadingOffers: boolean;
  isLoadingTrades: boolean;
  isLoadingStats: boolean;

  // Error states
  productsError: string | null;
  offersError: string | null;
  tradesError: string | null;
  statsError: string | null;

  // Actions
  refreshProducts: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshTrades: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Product actions
  createProduct: (product: Partial<SellerProduct>) => Promise<SellerProduct>;
  updateProduct: (id: string, updates: Partial<SellerProduct>) => Promise<SellerProduct>;
  deleteProduct: (id: string) => Promise<void>;

  // Offer actions
  acceptOffer: (offerId: string) => Promise<void>;
  rejectOffer: (offerId: string) => Promise<void>;
  negotiateOffer: (offerId: string, counterPrice: number) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
};

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Seller data states
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [sellerOffers, setSellerOffers] = useState<SellerOffer[]>([]);
  const [sellerTrades, setSellerTrades] = useState<SellerTrade[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);

  // Loading states
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Error states
  const [productsError, setProductsError] = useState<string | null>(null);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch seller products
  const fetchSellerProducts = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoadingProducts(true);
    setProductsError(null);

    try {
      const response = await apiClient.get<SellerProduct[]>('/seller/products');
      // Set the actual data from the backend
      setSellerProducts(response.data || []);
      setProductsError(null); // Clear any previous errors
    } catch (error: unknown) {
      console.error('Error fetching seller products:', error);
      setProductsError(getErrorMessage(error, 'Failed to fetch products'));
      // Don't use mock data - let the UI show the actual state (empty or error)
    } finally {
      setIsLoadingProducts(false);
    }
  }, [isAuthenticated, user]);

  // Fetch seller offers
  const fetchSellerOffers = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoadingOffers(true);
    setOffersError(null);

    try {
      const response = await apiClient.get<SellerOffer[]>('/seller/offers');
      setSellerOffers(response.data || []);
      setOffersError(null);
    } catch (error: unknown) {
      console.error('Error fetching seller offers:', error);
      setOffersError(getErrorMessage(error, 'Failed to fetch offers'));
    } finally {
      setIsLoadingOffers(false);
    }
  }, [isAuthenticated, user]);

  // Fetch seller trades
  const fetchSellerTrades = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoadingTrades(true);
    setTradesError(null);

    try {
      const response = await apiClient.get<SellerTrade[]>('/seller/trades');
      setSellerTrades(response.data || []);
      setTradesError(null);
    } catch (error: unknown) {
      console.error('Error fetching seller trades:', error);
      setTradesError(getErrorMessage(error, 'Failed to fetch trades'));
    } finally {
      setIsLoadingTrades(false);
    }
  }, [isAuthenticated, user]);

  // Fetch seller stats
  const fetchSellerStats = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const response = await apiClient.get<SellerStats>('/seller/stats');
      setSellerStats(response.data);
      setStatsError(null);
    } catch (error: unknown) {
      console.error('Error fetching seller stats:', error);
      setStatsError(getErrorMessage(error, 'Failed to fetch stats'));
    } finally {
      setIsLoadingStats(false);
    }
  }, [isAuthenticated, user]);

  // Product actions
  const createProduct = useCallback(
    async (product: Partial<SellerProduct>): Promise<SellerProduct> => {
      try {
        const response = await apiClient.post<SellerProduct>('/seller/products', product);
        const newProduct = response.data;
        setSellerProducts((prev) => [...prev, newProduct]);
        return newProduct;
      } catch (error: unknown) {
        console.error('Error creating product:', error);
        throw error;
      }
    },
    []
  );

  const updateProduct = useCallback(
    async (id: string, updates: Partial<SellerProduct>): Promise<SellerProduct> => {
      try {
        const response = await apiClient.patch<SellerProduct>(`/seller/products/${id}`, updates);
        const updatedProduct = response.data;
        setSellerProducts((prev) => prev.map((p) => (p.id === id ? updatedProduct : p)));
        return updatedProduct;
      } catch (error: unknown) {
        console.error('Error updating product:', error);
        throw error;
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/seller/products/${id}`);
      setSellerProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }, []);

  // Offer actions
  const acceptOffer = useCallback(async (offerId: string): Promise<void> => {
    try {
      await apiClient.post(`/seller/offers/${offerId}/accept`);
      setSellerOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: 'accepted' as const } : o))
      );
    } catch (error: unknown) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  }, []);

  const rejectOffer = useCallback(async (offerId: string): Promise<void> => {
    try {
      await apiClient.post(`/seller/offers/${offerId}/reject`);
      setSellerOffers((prev) =>
        prev.map((o) => (o.id === offerId ? { ...o, status: 'rejected' as const } : o))
      );
    } catch (error: unknown) {
      console.error('Error rejecting offer:', error);
      throw error;
    }
  }, []);

  const negotiateOffer = useCallback(
    async (offerId: string, counterPrice: number): Promise<void> => {
      try {
        await apiClient.post(`/seller/offers/${offerId}/negotiate`, { counterPrice });
        setSellerOffers((prev) =>
          prev.map((o) => (o.id === offerId ? { ...o, status: 'negotiating' as const } : o))
        );
      } catch (error: unknown) {
        console.error('Error negotiating offer:', error);
        throw error;
      }
    },
    []
  );

  // Refresh functions
  const refreshProducts = useCallback(() => fetchSellerProducts(), [fetchSellerProducts]);
  const refreshOffers = useCallback(() => fetchSellerOffers(), [fetchSellerOffers]);
  const refreshTrades = useCallback(() => fetchSellerTrades(), [fetchSellerTrades]);
  const refreshStats = useCallback(() => fetchSellerStats(), [fetchSellerStats]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchSellerProducts(),
      fetchSellerOffers(),
      fetchSellerTrades(),
      fetchSellerStats(),
    ]);
  }, [fetchSellerProducts, fetchSellerOffers, fetchSellerTrades, fetchSellerStats]);

  // Initial data fetch based on user role
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();

      // Map FARMER to seller
      if (userRole === 'farmer' || userRole === 'seller') {
        // Fetch seller-specific data
        fetchSellerProducts();
        fetchSellerOffers();
        fetchSellerTrades();
        fetchSellerStats();
      }
      // Add other role checks here (buyer, transporter, admin)
    }
  }, [
    isAuthenticated,
    user,
    fetchSellerProducts,
    fetchSellerOffers,
    fetchSellerTrades,
    fetchSellerStats,
  ]);

  const value: UserDataContextValue = {
    // Seller data
    sellerProducts,
    sellerOffers,
    sellerTrades,
    sellerStats,

    // Loading states
    isLoadingProducts,
    isLoadingOffers,
    isLoadingTrades,
    isLoadingStats,

    // Error states
    productsError,
    offersError,
    tradesError,
    statsError,

    // Actions
    refreshProducts,
    refreshOffers,
    refreshTrades,
    refreshStats,
    refreshAll,

    // Product actions
    createProduct,
    updateProduct,
    deleteProduct,

    // Offer actions
    acceptOffer,
    rejectOffer,
    negotiateOffer,
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};
