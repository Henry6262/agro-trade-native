import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@stores/auth.store';
import {
  registerForPushNotifications,
  sendPushTokenToBackend,
} from '@services/notificationService';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register for push notifications and send token to backend
    registerForPushNotifications().then((pushToken) => {
      if (pushToken) {
        sendPushTokenToBackend(pushToken);
      }
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Notification received while foregrounded
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Navigation could be handled here via a navigation ref
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  return <>{children}</>;
};

export default NotificationProvider;
