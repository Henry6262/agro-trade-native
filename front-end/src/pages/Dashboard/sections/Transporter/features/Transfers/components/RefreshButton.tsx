import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { RefreshCw } from 'lucide-react-native';

interface TransfersRefreshButtonProps {
  refreshing: boolean;
  onRefresh: () => Promise<void> | void;
}

export const TransfersRefreshButton: React.FC<TransfersRefreshButtonProps> = ({
  refreshing,
  onRefresh,
}) => (
  <TouchableOpacity
    onPress={onRefresh}
    disabled={refreshing}
    className="flex-row items-center justify-center bg-white/50 border border-gray-200 rounded-lg p-3"
  >
    <RefreshCw size={18} color={refreshing ? '#6B7280' : '#60A5FA'} />
    <Text className={`ml-2 ${refreshing ? 'text-gray-500' : 'text-blue-400'}`}>
      {refreshing ? 'Refreshing...' : 'Refresh Transfers'}
    </Text>
  </TouchableOpacity>
);
