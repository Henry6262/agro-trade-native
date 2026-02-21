import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Badge } from '@shared/components/Badge';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

import {
  OfferStatsGrid,
  OffersEmptyState,
  SellerOfferCard,
  SellerAcceptOfferModal,
  SellerRejectOfferModal,
  SellerCounterOfferModal,
} from './components';
import { useSellerOffersFeature } from './hooks';
import type { SellerOffer } from './types';
import SellerTimelineFeature from '../Timeline';

export default function SellerOffersFeature() {
  const {
    offers,
    stats,
    statsCards,
    isLoading,
    isError,
    error,
    refreshOffers,
    acceptOffer,
    rejectOffer,
    makeCounterOffer,
    isAccepting,
    isRejecting,
    isCountering,
    acceptSuccess,
    rejectSuccess,
    counterSuccess,
  } = useSellerOffersFeature();

  const [selectedOffer, setSelectedOffer] = useState<SellerOffer | null>(null);
  const [activeModal, setActiveModal] = useState<'accept' | 'reject' | 'counter' | null>(null);

  useEffect(() => {
    if (acceptSuccess) {
      Alert.alert('Success', 'Offer accepted successfully!');
    }
    if (rejectSuccess) {
      Alert.alert('Offer Rejected', 'The offer has been rejected.');
    }
    if (counterSuccess) {
      Alert.alert('Counter Offer Sent', 'Your counter offer has been sent to the buyer.');
    }
  }, [acceptSuccess, rejectSuccess, counterSuccess]);

  const openModal = (type: 'accept' | 'reject' | 'counter', offer: SellerOffer) => {
    setSelectedOffer(offer);
    setActiveModal(type);
  };

  const closeModal = () => {
    setSelectedOffer(null);
    setActiveModal(null);
  };

  const handleAcceptConfirm = (negotiationId: string, acceptanceNote?: string) => {
    acceptOffer(negotiationId, acceptanceNote);
    closeModal();
  };

  const handleRejectConfirm = (negotiationId: string, reason?: string) => {
    rejectOffer(negotiationId, reason);
    closeModal();
  };

  const handleCounterConfirm = (
    negotiationId: string,
    counterPrice: number,
    quantity?: number,
    message?: string
  ) => {
    makeCounterOffer(negotiationId, counterPrice, quantity, message);
    closeModal();
  };

  const isProcessing = isAccepting || isRejecting || isCountering;

  if (isLoading && offers.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FB923C" />
        <Text className="text-white mt-4">Loading your offers...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <AlertCircle color="#EF4444" size={48} />
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          Failed to load offers
        </Text>
        <Text className="text-neutral-400 text-center mt-2">
          {error?.message || 'Please try again later'}
        </Text>
        <Badge className="bg-orange-500 text-white px-6 py-3 rounded-lg mt-4 flex-row items-center">
          <RefreshCw color="#FFFFFF" size={16} />
          <Text className="text-white font-semibold ml-2" onPress={refreshOffers}>
            Retry
          </Text>
        </Badge>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshOffers}
            tintColor="#FB923C"
            colors={['#FB923C']}
          />
        }
      >
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white">Incoming Offers</Text>
            <Text className="text-neutral-400">Review and respond to buyer requests</Text>
          </View>

          <OfferStatsGrid cards={statsCards} />

          <View className="mt-6">
            <SellerTimelineFeature />
          </View>

          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold text-white">Active Offers</Text>
              <TouchableOpacity onPress={refreshOffers} className="flex-row items-center">
                <Badge className="bg-orange-500 text-white px-3 py-1 rounded flex-row items-center">
                  <RefreshCw color="#FFFFFF" size={12} />
                  <Text className="text-white text-sm ml-1">{stats.pendingOffers} Pending</Text>
                </Badge>
              </TouchableOpacity>
            </View>

            {offers.length === 0 ? (
              <OffersEmptyState />
            ) : (
              offers.map((offer) => (
                <SellerOfferCard
                  key={offer.id}
                  offer={offer as SellerOffer}
                  onAccept={(o: any) => openModal('accept', o)}
                  onReject={(o: any) => openModal('reject', o)}
                  onCounter={(o: any) => openModal('counter', o)}
                  isProcessing={isProcessing}
                />
              ))
            )}
          </View>
        </View>
        <View className="h-20" />
      </ScrollView>

      <SellerAcceptOfferModal
        visible={activeModal === 'accept'}
        onClose={closeModal}
        offer={selectedOffer}
        onConfirm={handleAcceptConfirm}
        isLoading={isAccepting}
      />

      <SellerRejectOfferModal
        visible={activeModal === 'reject'}
        onClose={closeModal}
        offer={selectedOffer}
        onConfirm={handleRejectConfirm}
        isLoading={isRejecting}
      />

      <SellerCounterOfferModal
        visible={activeModal === 'counter'}
        onClose={closeModal}
        offer={selectedOffer}
        onConfirm={handleCounterConfirm}
        isLoading={isCountering}
      />
    </View>
  );
}
