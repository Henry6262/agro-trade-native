import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Navigation } from 'lucide-react-native';
import type { TransporterJobsRefreshButtonProps } from '../types';

export const TransporterJobsRefreshButton: React.FC<TransporterJobsRefreshButtonProps> = ({
  refreshing,
  onRefresh,
}) => (
  <TouchableOpacity
    onPress={onRefresh}
    disabled={refreshing}
    className="flex-row items-center justify-center bg-white/50 border border-gray-200 rounded-lg p-3"
  >
    <Navigation size={18} color={refreshing ? '#6B7280' : '#60A5FA'} />
    <Text className={`ml-2 ${refreshing ? 'text-gray-500' : 'text-blue-400'}`}>
      {refreshing ? 'Refreshing...' : 'Refresh Jobs'}
    </Text>
  </TouchableOpacity>
);
