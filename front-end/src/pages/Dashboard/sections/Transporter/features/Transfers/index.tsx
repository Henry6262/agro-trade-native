import React from 'react';
import { ScrollView, View, ActivityIndicator, Text } from 'react-native';
import type { BaseComponentProps } from '@shared/types';
import { MapDrawer } from '../maps/components/MapDrawer';
import { useTransporterTransfers } from './hooks';
import { TransfersStatsGrid, TransfersList, TransfersRefreshButton } from './components';

interface TransporterTransfersTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterTransfersTab: React.FC<TransporterTransfersTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const { jobs, summary, isLoading, isRefreshing, selectedOffer, refresh, openMap, closeMap } =
    useTransporterTransfers();

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#34D399" />
        <Text className="text-gray-400 mt-4">Loading transfers...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        <View className="p-4 space-y-4">
          <TransfersRefreshButton refreshing={isRefreshing} onRefresh={refresh} />
          <TransfersStatsGrid summary={summary} />
          <TransfersList jobs={jobs} onViewRoute={openMap} />
        </View>
      </ScrollView>
      <MapDrawer isOpen={Boolean(selectedOffer)} offer={selectedOffer} onClose={closeMap} />
    </View>
  );
};

export default TransporterTransfersTab;
