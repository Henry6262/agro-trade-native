import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@stores/auth.store';
import { useNotificationStore } from '@stores/notification.store';
import type { AppNotification } from '@stores/notification.store';
import {
  registerForPushNotifications,
  sendPushTokenToBackend,
} from '@services/notificationService';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);
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

    // Listen for incoming notifications while app is foregrounded — surface in the in-app bell
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      addNotification({
        title: title ?? 'New Notification',
        body: body ?? '',
        type: (data?.type as AppNotification['type']) ?? 'system',
        data: data as Record<string, unknown>,
      });
    });

    // Listen for notification taps — log for future navigation wiring
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;
      console.warn('[Notifications] User tapped notification:', {
        title: content.title,
        type: content.data?.type,
        data: content.data,
      });
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, addNotification]);

  return <>{children}</>;
};

export default NotificationProvider;
