import { useUserData } from '@contexts/UserDataContext';
import { useAuthStore } from '@stores/auth.store';

/**
 * Hook to access seller products data
 */
export const useSellerProducts = () => {
  const { user } = useAuthStore();
  const {
    sellerProducts,
    isLoadingProducts,
    productsError,
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useUserData();

  // Only return data if user is a seller/farmer
  const isSeller = user?.role?.toLowerCase() === 'farmer' || user?.role?.toLowerCase() === 'seller';

  if (!isSeller) {
    return {
      products: [],
      isLoading: false,
      error: 'User is not a seller',
      refresh: async () => {},
      create: async () => {
        throw new Error('User is not a seller');
      },
      update: async () => {
        throw new Error('User is not a seller');
      },
      delete: async () => {
        throw new Error('User is not a seller');
      },
    };
  }

  return {
    products: sellerProducts,
    isLoading: isLoadingProducts,
    error: productsError,
    refresh: refreshProducts,
    create: createProduct,
    update: updateProduct,
    delete: deleteProduct,
  };
};

/**
 * Hook to access seller offers data
 */
export const useSellerOffers = () => {
  const { user } = useAuthStore();
  const {
    sellerOffers,
    isLoadingOffers,
    offersError,
    refreshOffers,
    acceptOffer,
    rejectOffer,
    negotiateOffer,
  } = useUserData();

  const isSeller = user?.role?.toLowerCase() === 'farmer' || user?.role?.toLowerCase() === 'seller';

  if (!isSeller) {
    return {
      offers: [],
      isLoading: false,
      error: 'User is not a seller',
      refresh: async () => {},
      accept: async () => {
        throw new Error('User is not a seller');
      },
      reject: async () => {
        throw new Error('User is not a seller');
      },
      negotiate: async () => {
        throw new Error('User is not a seller');
      },
    };
  }

  return {
    offers: sellerOffers,
    isLoading: isLoadingOffers,
    error: offersError,
    refresh: refreshOffers,
    accept: acceptOffer,
    reject: rejectOffer,
    negotiate: negotiateOffer,
  };
};

/**
 * Hook to access seller trades data
 */
export const useSellerTrades = () => {
  const { user } = useAuthStore();
  const { sellerTrades, isLoadingTrades, tradesError, refreshTrades } = useUserData();

  const isSeller = user?.role?.toLowerCase() === 'farmer' || user?.role?.toLowerCase() === 'seller';

  if (!isSeller) {
    return {
      trades: [],
      isLoading: false,
      error: 'User is not a seller',
      refresh: async () => {},
    };
  }

  return {
    trades: sellerTrades,
    isLoading: isLoadingTrades,
    error: tradesError,
    refresh: refreshTrades,
  };
};

/**
 * Hook to access seller statistics
 */
export const useSellerStats = () => {
  const { user } = useAuthStore();
  const { sellerStats, isLoadingStats, statsError, refreshStats } = useUserData();

  const isSeller = user?.role?.toLowerCase() === 'farmer' || user?.role?.toLowerCase() === 'seller';

  if (!isSeller) {
    return {
      stats: null,
      isLoading: false,
      error: 'User is not a seller',
      refresh: async () => {},
    };
  }

  return {
    stats: sellerStats,
    isLoading: isLoadingStats,
    error: statsError,
    refresh: refreshStats,
  };
};
