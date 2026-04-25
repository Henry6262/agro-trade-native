import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import {
  Target,
  Building2,
  DollarSign,
  Package,
  Truck,
  ArrowUpDown,
  Calculator,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react-native';

import type {
  SellerNegotiationType,
  SellerOffer,
  SellerProductSummary,
} from '@shared/types/seller-offers';

interface SellerOffersNegotiationViewProps {
  offer: SellerOffer;
  sellerProduct: SellerProductSummary | undefined;
  counterPrice: string;
  counterQuantity: string;
  deliveryDays: string;
  deliveryTerms: string;
  message: string;
  validDays: string;
  negotiationType: SellerNegotiationType;
  priceDifference: {
    difference: number;
    percentageChange: number;
    isIncrease: boolean;
  };
  quantityDifference: {
    difference: number;
    percentageChange: number;
    isIncrease: boolean;
  };
  profitMargin: {
    margin: number;
    marginPercentage: number;
    isProfitable: boolean;
  };
  totalValue: number;
  onChangeCounterPrice: (value: string) => void;
  onChangeCounterQuantity: (value: string) => void;
  onChangeDeliveryDays: (value: string) => void;
  onChangeDeliveryTerms: (value: string) => void;
  onChangeMessage: (value: string) => void;
  onChangeValidDays: (value: string) => void;
  onChangeNegotiationType: (value: SellerNegotiationType) => void;
}

const NEGOTIATION_OPTIONS: {
  key: SellerNegotiationType;
  label: string;
  icon: typeof DollarSign;
}[] = [
  { key: 'price', label: 'Price Only', icon: DollarSign },
  { key: 'quantity', label: 'Quantity', icon: Package },
  { key: 'terms', label: 'Delivery Terms', icon: Truck },
  { key: 'combined', label: 'Multiple Terms', icon: ArrowUpDown },
];

export function SellerOffersNegotiationView({
  offer,
  sellerProduct,
  counterPrice,
  counterQuantity,
  deliveryDays,
  deliveryTerms,
  message,
  validDays,
  negotiationType,
  priceDifference,
  quantityDifference,
  profitMargin,
  totalValue,
  onChangeCounterPrice,
  onChangeCounterQuantity,
  onChangeDeliveryDays,
  onChangeDeliveryTerms,
  onChangeMessage,
  onChangeValidDays,
  onChangeNegotiationType,
}: SellerOffersNegotiationViewProps) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-indigo-600/20 rounded-xl items-center justify-center mr-3 border border-blue-400/30">
              <Target size={20} color="#3B82F6" />
            </View>
            <Text className="text-blue-400 font-bold text-xl">Buyer&apos;s Offer</Text>
          </View>
          <View className="rounded-2xl p-6 border border-blue-500/40 bg-gradient-to-br from-blue-500/20 to-indigo-600/10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-blue-200 font-medium text-base">Offered Price</Text>
              <View className="flex-row items-center">
                <Text className="text-blue-300 font-black text-2xl">
                  €{offer.offeredPrice.toFixed(2)}
                </Text>
                <Text className="text-blue-400/70 ml-2 text-sm">/{offer.unit.toLowerCase()}</Text>
              </View>
            </View>
            <View className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent mb-4" />
            <View className="flex-row justify-between items-center">
              <Text className="text-blue-200 font-medium text-base">Requested Quantity</Text>
              <Text className="text-gray-900 font-bold text-lg">
                {offer.requestedQuantity} {offer.unit.toLowerCase()}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-emerald-600/20 rounded-xl items-center justify-center mr-3 border border-green-400/30">
              <Building2 size={20} color="#10B981" />
            </View>
            <Text className="text-green-400 font-bold text-xl">Your Product</Text>
          </View>
          <View className="rounded-2xl p-6 border border-green-500/40 bg-gradient-to-br from-green-500/20 to-emerald-600/10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-green-200 font-medium text-base">Available Stock</Text>
              <Text className="text-gray-900 font-bold text-lg">
                {sellerProduct?.quantity || 0} {offer.unit.toLowerCase()}
              </Text>
            </View>
            <View className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent mb-4" />
            <View className="flex-row justify-between items-center">
              <Text className="text-green-200 font-medium text-base">Market Range</Text>
              <View className="flex-row items-center">
                <Text className="text-green-300 font-black text-lg">
                  €{sellerProduct?.priceRangeMin || 0}-{sellerProduct?.priceRangeMax || 0}
                </Text>
                <Text className="text-green-400/70 ml-2 text-sm">/{offer.unit.toLowerCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">
            What would you like to negotiate?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {NEGOTIATION_OPTIONS.map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                onPress={() => onChangeNegotiationType(key)}
                className={`flex-row items-center px-4 py-3 rounded-xl border ${
                  negotiationType === key
                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/10 border-yellow-500/50'
                    : 'bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 border-gray-200/50'
                }`}
              >
                <Icon size={16} color={negotiationType === key ? '#F59E0B' : '#9CA3AF'} />
                <Text
                  className={`ml-2 font-medium ${
                    negotiationType === key ? 'text-yellow-400' : 'text-gray-600'
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-gradient-to-br from-yellow-500/30 to-orange-600/20 rounded-xl items-center justify-center mr-3 border border-yellow-400/30">
              <Calculator size={20} color="#F59E0B" />
            </View>
            <Text className="text-yellow-400 font-bold text-xl">Your Counter Offer</Text>
          </View>

          <View className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/20 to-orange-600/10 p-6">
            {negotiationType === 'price' || negotiationType === 'combined' ? (
              <View className="mb-6">
                <Text className="text-yellow-300 font-semibold mb-3">Counter Price</Text>
                <View className="bg-white/20 rounded-xl p-4 border border-yellow-400/20">
                  <View className="flex-row items-center justify-center">
                    <Text className="text-yellow-300 text-2xl font-black">€</Text>
                    <TextInput
                      value={counterPrice}
                      onChangeText={onChangeCounterPrice}
                      placeholder="0.00"
                      placeholderTextColor="#A16207"
                      className="text-gray-900 text-2xl font-black ml-3 flex-1 text-center"
                      keyboardType="decimal-pad"
                    />
                    <Text className="text-yellow-400/80 text-lg font-medium">
                      /{offer.unit.toLowerCase()}
                    </Text>
                  </View>
                </View>

                {priceDifference.difference !== 0 ? (
                  <View className="mt-4 bg-white/30 rounded-xl p-4 border border-yellow-400/20">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        {priceDifference.isIncrease ? (
                          <TrendingUpIcon size={16} color="#10B981" />
                        ) : (
                          <TrendingDown size={16} color="#EF4444" />
                        )}
                        <Text
                          className={`ml-2 text-sm font-bold ${
                            priceDifference.isIncrease ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {priceDifference.isIncrease ? '+' : ''}€
                          {Math.abs(priceDifference.difference).toFixed(2)} per unit
                        </Text>
                      </View>
                      <Text
                        className={`text-sm font-bold ${
                          priceDifference.isIncrease ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        ({priceDifference.isIncrease ? '+' : ''}
                        {priceDifference.percentageChange.toFixed(1)}%)
                      </Text>
                    </View>

                    {profitMargin.margin !== 0 ? (
                      <View className="border-t border-yellow-400/20 pt-3 mt-3">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-yellow-200 text-sm">Profit Margin:</Text>
                          <Text
                            className={`text-sm font-bold ${
                              profitMargin.isProfitable ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            €{Math.abs(profitMargin.margin).toFixed(2)} (
                            {profitMargin.marginPercentage.toFixed(1)}%)
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {negotiationType === 'quantity' || negotiationType === 'combined' ? (
              <View className="mb-6">
                <Text className="text-yellow-300 font-semibold mb-3">Available Quantity</Text>
                <View className="bg-white/20 rounded-xl p-4 border border-yellow-400/20">
                  <View className="flex-row items-center justify-center">
                    <TextInput
                      value={counterQuantity}
                      onChangeText={onChangeCounterQuantity}
                      placeholder="0"
                      placeholderTextColor="#A16207"
                      className="text-gray-900 text-2xl font-black flex-1 text-center"
                      keyboardType="numeric"
                    />
                    <Text className="text-yellow-400/80 text-lg font-medium ml-3">
                      {offer.unit.toLowerCase()}
                    </Text>
                  </View>
                </View>

                {quantityDifference.difference !== 0 ? (
                  <View className="mt-4 bg-white/30 rounded-xl p-4 border border-yellow-400/20">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-yellow-200 text-sm">Quantity Change:</Text>
                      <Text
                        className={`text-sm font-bold ${
                          quantityDifference.isIncrease ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {quantityDifference.isIncrease ? '+' : ''}
                        {Math.abs(quantityDifference.difference)} {offer.unit.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {negotiationType === 'terms' || negotiationType === 'combined' ? (
              <View className="mb-6">
                <Text className="text-yellow-300 font-semibold mb-3">Delivery Terms</Text>
                <View className="space-y-4">
                  <View>
                    <Text className="text-yellow-200 text-sm mb-2">Delivery Days</Text>
                    <View className="flex-row gap-2">
                      {['7', '14', '21', '30'].map((days) => (
                        <TouchableOpacity
                          key={days}
                          onPress={() => onChangeDeliveryDays(days)}
                          className={`flex-1 p-3 rounded-lg border ${
                            deliveryDays === days
                              ? 'bg-blue-500/20 border-blue-500/50'
                              : 'bg-gray-50/50 border-gray-200/50'
                          }`}
                        >
                          <Text
                            className={`text-center font-medium ${
                              deliveryDays === days ? 'text-blue-400' : 'text-gray-600'
                            }`}
                          >
                            {days} days
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-yellow-200 text-sm mb-2">Terms</Text>
                    <View className="flex-row gap-2">
                      {['FOB', 'CIF', 'EXW', 'DDP'].map((term) => (
                        <TouchableOpacity
                          key={term}
                          onPress={() => onChangeDeliveryTerms(term)}
                          className={`flex-1 p-3 rounded-lg border ${
                            deliveryTerms === term
                              ? 'bg-green-500/20 border-green-500/50'
                              : 'bg-gray-50/50 border-gray-200/50'
                          }`}
                        >
                          <Text
                            className={`text-center text-sm font-medium ${
                              deliveryTerms === term ? 'text-green-400' : 'text-gray-600'
                            }`}
                          >
                            {term}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View className="bg-white/30 rounded-xl p-4 border border-yellow-400/20">
              <View className="flex-row justify-between items-center">
                <Text className="text-yellow-200 font-medium">Total Contract Value</Text>
                <Text className="text-yellow-400 font-bold text-xl">
                  €{totalValue.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Message to Buyer</Text>
          <TextInput
            value={message}
            onChangeText={onChangeMessage}
            placeholder="Explain your counter-offer (e.g., quality standards, delivery logistics, volume pricing, etc.)"
            placeholderTextColor="#6B7280"
            className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-gray-200/50 rounded-xl p-4 text-gray-900 min-h-24"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-3">Counter-offer Valid For</Text>
          <View className="flex-row gap-3">
            {['3', '7', '14'].map((days) => (
              <TouchableOpacity
                key={days}
                onPress={() => onChangeValidDays(days)}
                className={`flex-1 p-4 rounded-xl border ${
                  validDays === days
                    ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border-blue-500/50'
                    : 'bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 border-gray-200/50'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    validDays === days ? 'text-blue-400' : 'text-gray-600'
                  }`}
                >
                  {days} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
