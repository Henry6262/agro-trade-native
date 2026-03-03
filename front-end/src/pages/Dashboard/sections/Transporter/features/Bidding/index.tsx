import React, { useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl, Alert } from 'react-native';
import { Package } from 'lucide-react-native';
import type { BaseComponentProps } from '@shared/types';
import { MapDrawer } from '../maps/components/MapDrawer';
import {
  TransporterBiddingRequestsList,
  TransporterBiddingSummaryGrid,
  TransporterVerificationBanner,
} from './components';
import { useTransporterBidding } from './hooks';

interface TransporterBiddingTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterBiddingTab: React.FC<TransporterBiddingTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const {
    summary,
    requestViews,
    isLoading,
    isRefreshing,
    isSubmitting,
    selectedRequestId,
    bidAmount,
    isVerified,
    mapOffer,
    isMapDrawerOpen,
    refresh,
    selectRequest,
    cancelSelection,
    setBidAmount,
    submitBid,
    viewRoute,
    closeMapDrawer,
  } = useTransporterBidding();

  const handleSubmitBid = useCallback(
    async (requestId: string) => {
      const result = await submitBid(requestId);
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.success
          ? 'Bid submitted successfully'
          : (result.errorMessage ?? 'Failed to submit bid')
      );
    },
    [submitBid]
  );

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      >
        <View className="p-4 space-y-4">
          <TransporterBiddingSummaryGrid summary={summary} />
          <TransporterVerificationBanner isVerified={isVerified} />

          <View className="mt-4">
            <View className="flex-row items-center mb-3">
              <Package size={20} color="#34D399" />
              <Text className="text-lg font-semibold text-green-400 ml-2">
                LIVE TRANSPORT AUCTIONS
              </Text>
            </View>

            <TransporterBiddingRequestsList
              requests={requestViews}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              bidAmount={bidAmount}
              selectedRequestId={selectedRequestId}
              isVerified={isVerified}
              isSubmitting={isSubmitting}
              onSelect={selectRequest}
              onBidAmountChange={setBidAmount}
              onSubmit={handleSubmitBid}
              onCancelSelection={cancelSelection}
              onViewRoute={viewRoute}
            />
          </View>
        </View>
      </ScrollView>

      <MapDrawer isOpen={isMapDrawerOpen} offer={mapOffer} onClose={closeMapDrawer} />
    </>
  );
};
