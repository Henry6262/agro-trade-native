import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Users } from 'lucide-react-native';

import { SellerOfferCard } from '@shared/components/SellerOfferCard';
import type {
  SellerOffer,
  SellerOfferFilter,
  SellerProductSummary,
} from '@shared/types/seller-offers';

interface SellerOffersListViewProps {
  processedOffers: SellerOffer[];
  sellerProduct: SellerProductSummary | undefined;
  filterBy: SellerOfferFilter;
  isLoading: boolean;
  actionLoading: boolean;
  offerStats: {
    pending: number;
    avgPrice: number;
    bestPrice: number;
  };
  onChangeFilter: (filter: SellerOfferFilter) => void;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onNegotiate: (offerId: string) => void;
}

const FILTER_OPTIONS: { key: SellerOfferFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
];

export function SellerOffersListView({
  processedOffers,
  sellerProduct,
  filterBy,
  isLoading,
  actionLoading,
  offerStats,
  onChangeFilter,
  onAccept,
  onReject,
  onNegotiate,
}: SellerOffersListViewProps) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        <View className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 border border-green-500/20 mb-6">
          <View className="flex-row justify-between items-center">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-green-400">
                €{offerStats.bestPrice.toFixed(2)}
              </Text>
              <Text className="text-xs text-green-300">Best Price</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-yellow-400">{offerStats.pending}</Text>
              <Text className="text-xs text-yellow-300">Pending</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-500 text-xs mb-2">Filter offers</Text>
          <View className="flex-row gap-2">
            {FILTER_OPTIONS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => onChangeFilter(key)}
                className={`px-3 py-2 rounded-lg border ${
                  filterBy === key
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-gray-50/50 border-gray-200/50'
                }`}
              >
                <Text
                  className={`text-xs ${filterBy === key ? 'text-green-400' : 'text-gray-500'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#10B981" />
            <Text className="mt-4 text-gray-400">Loading offers...</Text>
          </View>
        ) : processedOffers.length === 0 ? (
          <View className="items-center py-12">
            <Users size={48} color="#6B7280" />
            <Text className="text-lg font-semibold text-gray-900 mt-4">
              No {filterBy !== 'all' ? filterBy : ''} Offers
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              {filterBy !== 'all'
                ? `No offers match the ${filterBy} filter criteria`
                : 'No buyers have made offers for this product yet'}
            </Text>
          </View>
        ) : (
          <View>
            {processedOffers.map((offer) => (
              <SellerOfferCard
                key={offer.id}
                offer={offer}
                sellerProduct={sellerProduct}
                onAccept={onAccept}
                onReject={onReject}
                onNegotiate={onNegotiate}
                isLoading={actionLoading}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
