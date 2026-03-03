import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';
import type { TransportOffersRequest } from '../types';

interface OffersListProps {
  requests: TransportOffersRequest[];
  hasBidOnRequest: (id: string) => boolean;
  submittingBid: string | null;
  onSubmitBid: (id: string) => void;
  onViewRoute: (request: TransportOffersRequest) => void;
}

export const OffersList: React.FC<OffersListProps> = ({
  requests,
  hasBidOnRequest,
  submittingBid,
  onSubmitBid,
  onViewRoute,
}) => {
  if (!requests.length) {
    return (
      <View className="bg-gray-50 rounded-lg p-8 items-center">
        <Text className="text-gray-900 font-semibold text-lg mt-4">No transport requests</Text>
        <Text className="text-gray-500 text-center mt-2">
          When new requests appear, you can bid on them to secure transport jobs.
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      {requests.map((request) => (
        <View key={request.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-gray-900">
                {request.tradeOperation?.buyListing?.product?.name}
              </Text>
              <Text className="text-gray-500 text-sm">
                {request.tradeOperation?.buyListing?.buyer?.name}
              </Text>
            </View>
            <Badge className="bg-orange-500 text-gray-900 px-2 py-1 rounded">
              {request.urgencyLevel || 'STANDARD'}
            </Badge>
          </View>

          <View className="flex-row gap-4">
            <Text className="text-gray-900 font-medium">{request.totalWeight} tons</Text>
            <Text className="text-gray-500 text-sm">
              Budget: €{request.maxBudget?.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Button variant="secondary" onPress={() => onViewRoute(request)} className="flex-1">
              View Route
            </Button>
            <Button onPress={() => onSubmitBid(request.id)} disabled={hasBidOnRequest(request.id)}>
              {submittingBid === request.id ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : hasBidOnRequest(request.id) ? (
                'Bid Submitted'
              ) : (
                'Submit Bid'
              )}
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
};
