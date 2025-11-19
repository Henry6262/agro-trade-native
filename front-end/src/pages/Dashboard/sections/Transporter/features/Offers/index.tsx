import React from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { MapDrawer } from '../maps/components/MapDrawer';
import { useTransporterOffers } from './hooks';
import { OffersSummaryGrid, OffersList } from './components';
import type { BaseComponentProps } from '@shared/types';

interface TransporterIncomingOffersTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterIncomingOffersTab: React.FC<TransporterIncomingOffersTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const {
    requests,
    summary,
    selectedMapOffer,
    setSelectedMapOffer,
    isLoading,
    isRefreshing,
    submittingBid,
    refresh,
    hasBidOnRequest,
    submitBid,
    viewRoute,
  } = useTransporterOffers();

  return (
    <View className="flex-1 bg-black">
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text className="text-white mt-4">Loading transport requests...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
        >
          <View className="p-4 space-y-4">
            <TouchableOpacity
              onPress={refresh}
              disabled={isRefreshing}
              className="flex-row items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg p-3"
            >
              <RefreshCw size={18} color={isRefreshing ? '#6B7280' : '#60A5FA'} />
              <Text className={`ml-2 ${isRefreshing ? 'text-gray-500' : 'text-blue-400'}`}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Requests'}
              </Text>
            </TouchableOpacity>
            <OffersSummaryGrid summary={summary} />
            <OffersList
              requests={requests}
              hasBidOnRequest={hasBidOnRequest}
              submittingBid={submittingBid}
              onSubmitBid={(id) => submitBid(id, 3500)}
              onViewRoute={viewRoute}
            />
          </View>
        </ScrollView>
      )}

      <MapDrawer
        isOpen={Boolean(selectedMapOffer)}
        offer={selectedMapOffer}
        onClose={() => setSelectedMapOffer(null)}
      />
    </View>
  );
};

export default TransporterIncomingOffersTab;
