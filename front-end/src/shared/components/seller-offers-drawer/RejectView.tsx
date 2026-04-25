import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';

import type { SellerOffer } from '@shared/types/seller-offers';

interface SellerOffersRejectViewProps {
  offer: SellerOffer;
  rejectReason: string;
  rejectMessage: string;
  onChangeRejectReason: (value: string) => void;
  onChangeRejectMessage: (value: string) => void;
}

const REJECT_REASONS = [
  'Price too low',
  'Quantity too small',
  'Delivery requirements not feasible',
  'Quality concerns',
  'Better offer available',
  'Insufficient buyer credentials',
  'Terms not acceptable',
  'Other reason',
];

export function SellerOffersRejectView({
  offer,
  rejectReason,
  rejectMessage,
  onChangeRejectReason,
  onChangeRejectMessage,
}: SellerOffersRejectViewProps) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-gray-900 font-bold text-lg mb-4">Rejecting offer from:</Text>
          <View className="bg-gradient-to-br from-red-500/20 to-orange-600/10 rounded-xl p-4 border border-red-500/40">
            <Text className="text-gray-900 font-semibold mb-2">{offer.buyer.name}</Text>
            <Text className="text-gray-600">
              €{offer.offeredPrice.toFixed(2)}/{offer.unit.toLowerCase()} •{' '}
              {offer.requestedQuantity} {offer.unit.toLowerCase()}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Reason for Rejection</Text>
          <View className="flex-row flex-wrap gap-2">
            {REJECT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => onChangeRejectReason(reason)}
                className={`px-4 py-2 rounded-lg border ${
                  rejectReason === reason
                    ? 'bg-red-500/30 border-red-500/50'
                    : 'bg-gray-50/50 border-gray-200/50'
                }`}
              >
                <Text className={`${rejectReason === reason ? 'text-red-400' : 'text-gray-600'}`}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Message to Buyer (Optional)</Text>
          <TextInput
            value={rejectMessage}
            onChangeText={onChangeRejectMessage}
            placeholder="Provide additional feedback or suggestions..."
            placeholderTextColor="#6B7280"
            className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-gray-200/50 rounded-xl p-4 text-gray-900 min-h-24"
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>
    </ScrollView>
  );
}
