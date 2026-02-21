import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useProductStore } from '@stores/product.store';
import { BuyerRequestCreationFlow } from '@pages/Dashboard/sections/Buyer/features/RequestCreation/BuyerRequestCreationFlow';
import { UnifiedOffersDrawer } from '@shared/components/UnifiedOffersDrawer';
import { useBuyerRequests } from './hooks';
import { RequestsList } from './components';

export default function BuyerRequestsTab() {
  const {
    requests,
    isLoading,
    isRefreshing,
    error,
    showRequestCreation,
    selectedRequestOffers,
    showOffersDrawer,
    openRequestCreation,
    closeRequestCreation,
    openOffersDrawer,
    closeOffersDrawer,
    refresh,
  } = useBuyerRequests();

  const fetchProductMetadata = useProductStore((state) => state.fetchAllData);

  useEffect(() => {
    fetchProductMetadata().catch((err) => console.error('Failed to load product metadata', err));
  }, [fetchProductMetadata]);

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-gray-400 mt-4">Loading buyer requests...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-black"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#60A5FA" />
        }
      >
        <View className="p-6 space-y-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-white">Buyer Requests</Text>
              <Text className="text-neutral-400">
                Submit purchase needs and review incoming offers
              </Text>
            </View>
            <TouchableOpacity
              onPress={openRequestCreation}
              className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Plus size={16} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">New Request</Text>
            </TouchableOpacity>
          </View>

          {error && <Text className="text-red-400 text-sm">{error}</Text>}

          <RequestsList requests={requests} onOpenOffers={openOffersDrawer} />
        </View>
      </ScrollView>

      {showRequestCreation && (
        <BuyerRequestCreationFlow
          visible={showRequestCreation}
          onClose={closeRequestCreation}
          onSuccess={refresh}
        />
      )}

      <UnifiedOffersDrawer
        visible={showOffersDrawer}
        onClose={closeOffersDrawer}
        offers={selectedRequestOffers?.rawData?.offers ?? []}
        productName={selectedRequestOffers?.product ?? ''}
        requestId={selectedRequestOffers?.id ?? ''}
        buyerRequest={selectedRequestOffers?.rawData}
      />
    </>
  );
}
