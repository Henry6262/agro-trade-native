import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@stores/auth.store';
import { socketService } from '@services/socketService';
import { useNotificationStore } from '@stores/notification.store';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect();

      const invalidateOffers = () => {
        queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
      };

      const handleNewOffer = (data?: any) => {
        invalidateOffers();
        useNotificationStore.getState().addNotification({
          title: 'New Offer Received',
          body: data?.message || 'A buyer made an offer on your product.',
          type: 'offer',
          data,
        });
      };

      const handleOfferUpdated = (data?: any) => {
        invalidateOffers();
        useNotificationStore.getState().addNotification({
          title: 'Offer Updated',
          body: data?.message || 'An offer has been updated.',
          type: 'offer',
          data,
        });
      };

      const handleOfferExpired = (data?: any) => {
        invalidateOffers();
        useNotificationStore.getState().addNotification({
          title: 'Offer Expired',
          body: data?.message || 'An offer has expired.',
          type: 'offer',
          data,
        });
      };

      socketService.on('offer:new', handleNewOffer);
      socketService.on('offer:updated', handleOfferUpdated);
      socketService.on('offer:expired', handleOfferExpired);
      socketService.on('trade:updated', invalidateOffers);

      return () => {
        socketService.off('offer:new', handleNewOffer);
        socketService.off('offer:updated', handleOfferUpdated);
        socketService.off('offer:expired', handleOfferExpired);
        socketService.off('trade:updated', invalidateOffers);
        socketService.disconnect();
      };
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, token, queryClient]);

  // Reconnect when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (isAuthenticated && token) {
          socketService.updateAuth();
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated, token]);

  return <>{children}</>;
};

export default SocketProvider;
