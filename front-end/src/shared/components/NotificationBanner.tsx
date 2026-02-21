import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { useNotificationStore, AppNotification } from '@stores/notification.store';

const AUTO_HIDE_MS = 4000;

export const NotificationBanner: React.FC = () => {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const [visible, setVisible] = useState<AppNotification | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const lastSeenId = useRef<string | null>(null);

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (!latest || latest.read || latest.id === lastSeenId.current) return;

    lastSeenId.current = latest.id;
    setVisible(latest);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => dismiss(latest.id), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notifications]);

  const dismiss = (id: string) => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(null);
      markAsRead(id);
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }] }}
      className="absolute top-12 left-4 right-4 z-50 bg-neutral-800 rounded-xl p-4 border border-green-500/30 shadow-lg"
    >
      <View className="flex-row items-start">
        <View className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center mr-3">
          <Bell size={16} color="#10B981" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-sm">{visible.title}</Text>
          <Text className="text-neutral-400 text-xs mt-1" numberOfLines={2}>
            {visible.body}
          </Text>
        </View>
        <TouchableOpacity onPress={() => dismiss(visible.id)} className="p-1 -m-1">
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default NotificationBanner;
