import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  sellerOfferService,
  CounterOfferRequest,
  AcceptOfferRequest,
  RejectOfferRequest,
} from '@services/sellerOfferService';
import sellerService, {
  SellerOfferStats,
  SellerOffersPayload,
  SellerOfferSummary,
} from '@services/sellerService';
import { useAuthStore } from '@stores/auth.store';
import { UserRole } from '../types';

const buildAcceptOfferRequest = (acceptanceNote?: string): AcceptOfferRequest | undefined => {
  if (!acceptanceNote) {
    return undefined;
  }

  return { acceptanceNote };
};

const buildRejectOfferRequest = (reason?: string): RejectOfferRequest | undefined => {
  if (!reason) {
    return undefined;
  }

  return { reason };
};

const buildCounterOfferRequest = (
  counterPrice: number,
  quantity?: number,
  message?: string
): CounterOfferRequest => ({
  counterPrice,
  ...(quantity != null ? { quantity } : {}),
  ...(message ? { message } : {}),
});

export const useSellerOffers = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  // Query to fetch seller offers
  const {
    data: offersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SellerOffersPayload>({
    queryKey: ['seller-offers', user?.id],
    queryFn: () => sellerService.getMyOffers(),
    enabled: isAuthenticated && user?.role === UserRole.FARMER,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mutation to accept an offer
  const acceptOfferMutation = useMutation({
    mutationFn: ({
      negotiationId,
      request,
    }: {
      negotiationId: string;
      request?: AcceptOfferRequest | undefined;
    }) => sellerOfferService.acceptOffer(negotiationId, request),
    onSuccess: () => {
      // Invalidate and refetch offers to get updated data
      queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
    },
    onError: (error) => {
      console.error('Failed to accept offer:', error);
    },
  });

  // Mutation to reject an offer
  const rejectOfferMutation = useMutation({
    mutationFn: ({
      negotiationId,
      request,
    }: {
      negotiationId: string;
      request?: RejectOfferRequest | undefined;
    }) => sellerOfferService.rejectOffer(negotiationId, request),
    onSuccess: () => {
      // Invalidate and refetch offers to get updated data
      queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
    },
    onError: (error) => {
      console.error('Failed to reject offer:', error);
    },
  });

  // Mutation to make a counter offer
  const counterOfferMutation = useMutation({
    mutationFn: ({
      negotiationId,
      request,
    }: {
      negotiationId: string;
      request: CounterOfferRequest;
    }) => sellerOfferService.counterOffer(negotiationId, request),
    onSuccess: () => {
      // Invalidate and refetch offers to get updated data
      queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
    },
    onError: (error) => {
      console.error('Failed to make counter offer:', error);
    },
  });

  // Helper functions
  const acceptOffer = (negotiationId: string, acceptanceNote?: string) => {
    acceptOfferMutation.mutate({
      negotiationId,
      request: buildAcceptOfferRequest(acceptanceNote),
    });
  };

  const rejectOffer = (negotiationId: string, reason?: string) => {
    rejectOfferMutation.mutate({
      negotiationId,
      request: buildRejectOfferRequest(reason),
    });
  };

  const makeCounterOffer = (
    negotiationId: string,
    counterPrice: number,
    quantity?: number,
    message?: string
  ) => {
    counterOfferMutation.mutate({
      negotiationId,
      request: buildCounterOfferRequest(counterPrice, quantity, message),
    });
  };

  const refreshOffers = () => {
    refetch();
  };

  // Extract offers and stats from response
  const offers: SellerOfferSummary[] = offersData?.data?.offers ?? [];
  const stats: SellerOfferStats = offersData?.data?.stats ?? {
    totalOffers: 0,
    pendingOffers: 0,
    acceptedThisMonth: 0,
    averageOfferValue: 0,
    topRequestedProduct: 'N/A',
    conversionRate: 0,
  };

  // Derived data
  const pendingOffers = offers.filter((offer) => offer.status === 'pending');
  const expiringSoonOffers = offers.filter((offer) => offer.isExpiringSoon);
  const hasExpiringSoonOffers = expiringSoonOffers.length > 0;

  return {
    // Data
    offers,
    stats,
    pendingOffers,
    expiringSoonOffers,
    hasExpiringSoonOffers,

    // Query state
    isLoading,
    isError,
    error,

    // Actions
    acceptOffer,
    rejectOffer,
    makeCounterOffer,
    refreshOffers,

    // Mutation states
    isAccepting: acceptOfferMutation.isPending,
    isRejecting: rejectOfferMutation.isPending,
    isCountering: counterOfferMutation.isPending,

    // Mutation errors
    acceptError: acceptOfferMutation.error,
    rejectError: rejectOfferMutation.error,
    counterError: counterOfferMutation.error,

    // Success states
    acceptSuccess: acceptOfferMutation.isSuccess,
    rejectSuccess: rejectOfferMutation.isSuccess,
    counterSuccess: counterOfferMutation.isSuccess,
  };
};

export default useSellerOffers;
