import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import type { SellerTimelineEvent } from '../types';
import { timeAgo, formatDate } from '@shared/utils';

interface SellerTimelineProps {
  events: SellerTimelineEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const SellerTimeline: React.FC<SellerTimelineProps> = ({ events, isLoading, onRefresh }) => (
  <View className="space-y-3">
    <View className="flex-row items-center justify-between">
      <Text className="text-gray-900 font-semibold text-lg">Operations Timeline</Text>
      <TouchableOpacity onPress={onRefresh} disabled={isLoading}>
        <Text className="text-primary-400 text-sm">{isLoading ? 'Refreshing...' : 'Refresh'}</Text>
      </TouchableOpacity>
    </View>
    <View className="bg-white rounded-2xl p-4 space-y-4">
      {isLoading && (
        <View className="items-center py-4">
          <ActivityIndicator size="small" color="#FB923C" />
          <Text className="text-gray-500 text-sm mt-2">Loading latest trade activity...</Text>
        </View>
      )}
      {!isLoading && events.length === 0 && (
        <Text className="text-gray-500 text-sm">
          No recent updates yet. Negotiations, transports, and inspections will appear here.
        </Text>
      )}
      {!isLoading &&
        events.map((event) => (
          <View key={event.id} className="flex-row items-start space-x-3">
            <View className="w-2 h-2 rounded-full bg-orange-400 mt-2" />
            <View className="flex-1 border-b border-gray-100 pb-3">
              <Text className="text-gray-900 font-semibold">{event.title}</Text>
              <Text className="text-gray-500 text-xs mt-1">{formatDate(event.timestamp)}</Text>
              <Text className="text-gray-600 text-sm mt-2">
                {event.description ?? event.status}
              </Text>
              <Text className="text-primary-300 text-xs mt-1">{timeAgo(event.timestamp)}</Text>
            </View>
          </View>
        ))}
    </View>
  </View>
);
