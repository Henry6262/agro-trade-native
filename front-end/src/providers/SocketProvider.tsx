import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@stores/auth.store';
import { socketService } from '@services/socketService';
import { useNotificationStore } from '@stores/notification.store';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications(token: string, apiUrl: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    if (!projectId) return;
    const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    await fetch(`${apiUrl}/notifications/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pushToken: expoPushToken.data }),
    });
  } catch (err) {
    console.warn('Push registration failed:', err);
  }
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect();

      // Register for push notifications
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL ??
        'https://agro-trade-native-production.up.railway.app/api';
      registerForPushNotifications(token, API_URL).catch(console.warn);

      // Invalidate all trade-related queries for both roles
      const invalidateTradeData = () => {
        queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
        queryClient.invalidateQueries({ queryKey: ['seller-trades'] });
        queryClient.invalidateQueries({ queryKey: ['buyer', 'listings'] });
        queryClient.invalidateQueries({ queryKey: ['buyer', 'offers'] });
        queryClient.invalidateQueries({ queryKey: ['buyer', 'trades'] });
        queryClient.invalidateQueries({ queryKey: ['trade-operations'] });
        queryClient.invalidateQueries({ queryKey: ['negotiations'] });
      };

      const handleNewOffer = (data?: any) => {
        invalidateTradeData();
        useNotificationStore.getState().addNotification({
          title: 'New Offer Received',
          body: data?.tradeSeller?.saleListing?.product?.name 
            ? `New offer for your ${data.tradeSeller.saleListing.product.name}`
            : 'A buyer made an offer on your product.',
          type: 'offer',
          data,
        });
      };

      const handleOfferUpdated = (data?: any) => {
        invalidateTradeData();
        useNotificationStore.getState().addNotification({
          title: 'Offer Updated',
          body: 'An offer has been updated.',
          type: 'offer',
          data,
        });
      };

      const handleOfferCountered = (data?: any) => {
        invalidateTradeData();
        useNotificationStore.getState().addNotification({
          title: 'New Counter Offer',
          body: `Counter offer received: ${data?.counterOffer?.price} ${data?.tradeOperation?.currency || ''}`,
          type: 'offer',
          data,
        });
      };

      const handleOfferAccepted = (data?: any) => {
        invalidateTradeData();
        useNotificationStore.getState().addNotification({
          title: 'Offer Accepted! 🎉',
          body: `Negotiation closed at ${data?.finalPrice} per unit.`,
          type: 'offer',
          data,
        });
      };

      const handleOfferRejected = (data?: any) => {
        invalidateTradeData();
        useNotificationStore.getState().addNotification({
          title: 'Offer Rejected',
          body: 'The negotiation has been closed without agreement.',
          type: 'offer',
          data,
        });
      };

      const handleOfferExpired = (data?: any) => {
        invalidateTradeData();
        useNotificationStore.getState().addNotification({
          title: 'Offer Expired',
          body: 'An offer has expired.',
          type: 'offer',
          data,
        });
      };

      socketService.on('offer:new', handleNewOffer);
      socketService.on('offer:updated', handleOfferUpdated);
      socketService.on('offer:countered', handleOfferCountered);
      socketService.on('offer:accepted', handleOfferAccepted);
      socketService.on('offer:rejected', handleOfferRejected);
      socketService.on('offer:expired', handleOfferExpired);
      socketService.on('trade:updated', invalidateTradeData);

      return () => {
        socketService.off('offer:new', handleNewOffer);
        socketService.off('offer:updated', handleOfferUpdated);
        socketService.off('offer:countered', handleOfferCountered);
        socketService.off('offer:accepted', handleOfferAccepted);
        socketService.off('offer:rejected', handleOfferRejected);
        socketService.off('offer:expired', handleOfferExpired);
        socketService.off('trade:updated', invalidateTradeData);
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
