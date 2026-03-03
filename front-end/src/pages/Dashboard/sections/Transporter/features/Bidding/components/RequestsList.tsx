import React from 'react';
import { View, Text } from 'react-native';
import { Package } from 'lucide-react-native';
import type { TransporterBiddingRequestView, TransportRequest } from '../types';
import { TransporterBiddingRequestCard } from './RequestCard';

interface TransporterBiddingRequestsListProps {
  requests: TransporterBiddingRequestView[];
  isLoading: boolean;
  isRefreshing: boolean;
  bidAmount: string;
  selectedRequestId: string | null;
  isVerified: boolean;
  isSubmitting: boolean;
  onSelect: (request: TransportRequest) => void;
  onBidAmountChange: (value: string) => void;
  onSubmit: (requestId: string) => void;
  onCancelSelection: () => void;
  onViewRoute: (request: TransportRequest) => void;
}

export const TransporterBiddingRequestsList: React.FC<TransporterBiddingRequestsListProps> = ({
  requests,
  isLoading,
  isRefreshing,
  bidAmount,
  selectedRequestId,
  isVerified,
  isSubmitting,
  onSelect,
  onBidAmountChange,
  onSubmit,
  onCancelSelection,
  onViewRoute,
}) => {
  if (isLoading && !isRefreshing) {
    return (
      <View className="bg-white/50 border border-gray-200 rounded-lg p-8 items-center">
        <Package size={48} color="#6B7280" />
        <Text className="text-gray-400 text-center mt-2">Loading transport requests...</Text>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View className="bg-white/50 border border-gray-200 rounded-lg p-8">
        <Package size={48} color="#6B7280" style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text className="text-gray-400 text-center">No open requests right now</Text>
        <Text className="text-gray-500 text-center text-sm mt-2">
          Pull to refresh or check back later for new opportunities
        </Text>
      </View>
    );
  }

  return (
    <View>
      {requests.map((request) => (
        <TransporterBiddingRequestCard
          key={request.id}
          request={request}
          isSelected={selectedRequestId === request.id}
          bidAmount={bidAmount}
          isVerified={isVerified}
          isSubmitting={isSubmitting}
          onSelect={onSelect}
          onBidAmountChange={onBidAmountChange}
          onSubmit={onSubmit}
          onCancelSelection={onCancelSelection}
          onViewRoute={onViewRoute}
        />
      ))}
    </View>
  );
};
