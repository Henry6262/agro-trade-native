import React from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { Info } from 'lucide-react-native';

import type { SellerOffer } from '@shared/types/seller-offers';

interface SellerOffersAcceptViewProps {
  offer: SellerOffer;
  acceptNotes: string;
  onChangeAcceptNotes: (value: string) => void;
}

export function SellerOffersAcceptView({
  offer,
  acceptNotes,
  onChangeAcceptNotes,
}: SellerOffersAcceptViewProps) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-gray-900 font-bold text-lg mb-4">
            You&apos;re accepting this offer:
          </Text>
          <View className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 rounded-xl p-4 border border-green-500/40">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Buyer</Text>
              <Text className="text-gray-900 font-semibold">{offer.buyer.name}</Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Price</Text>
              <Text className="text-green-400 font-bold">
                €{offer.offeredPrice.toFixed(2)}/{offer.unit.toLowerCase()}
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Quantity</Text>
              <Text className="text-gray-900 font-semibold">
                {offer.requestedQuantity} {offer.unit.toLowerCase()}
              </Text>
            </View>
            <View className="h-px bg-green-400/30 my-3" />
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Total Value</Text>
              <Text className="text-green-400 font-black text-xl">
                €{(offer.offeredPrice * offer.requestedQuantity).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Additional Notes (Optional)</Text>
          <TextInput
            value={acceptNotes}
            onChangeText={onChangeAcceptNotes}
            placeholder="Any special requirements or delivery instructions..."
            placeholderTextColor="#6B7280"
            className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-gray-200/50 rounded-xl p-4 text-gray-900 min-h-24"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/40">
          <View className="flex-row items-start">
            <Info size={20} color="#60A5FA" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-300 font-semibold mb-1">Important</Text>
              <Text className="text-blue-200 text-sm">
                By accepting this offer, you agree to the buyer&apos;s terms and conditions. This
                action is binding and cannot be undone.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
