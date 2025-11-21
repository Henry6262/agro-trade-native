import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Package,
  Weight,
  MapPin,
  Calendar,
  Navigation,
  DollarSign,
  Target,
  Zap,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Input } from '@shared/components/Input';
import type { TransporterBiddingRequestView, TransportRequest } from '../types';

interface TransporterBiddingRequestCardProps {
  request: TransporterBiddingRequestView;
  isSelected: boolean;
  bidAmount: string;
  isVerified: boolean;
  isSubmitting: boolean;
  onSelect: (request: TransportRequest) => void;
  onBidAmountChange: (value: string) => void;
  onSubmit: (requestId: string) => void;
  onCancelSelection: () => void;
  onViewRoute: (request: TransportRequest) => void;
}

export const TransporterBiddingRequestCard: React.FC<TransporterBiddingRequestCardProps> = ({
  request,
  isSelected,
  bidAmount,
  isVerified,
  isSubmitting,
  onSelect,
  onBidAmountChange,
  onSubmit,
  onCancelSelection,
  onViewRoute,
}) => (
  <View className="border border-neutral-700 rounded-lg p-6 mb-3 mx-2">
    <View className="mb-3">
      <View className="flex-row items-start mb-3">
        <View className="w-12 h-12 bg-gradient-to-br from-green-500/30 to-green-600/10 rounded-lg items-center justify-center border border-green-500/30">
          <Text className="text-xl">{request.productInitial}</Text>
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-bold text-white mb-2">{request.reference}</Text>
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Weight size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm ml-1">{request.totalWeightLabel}</Text>
            </View>
            <View className="flex-row items-center">
              <MapPin size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm ml-1">{request.distanceLabel}</Text>
            </View>
            <View className="flex-row items-center">
              <Calendar size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm ml-1">{request.biddingDeadlineLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="bg-neutral-800/60 p-3 rounded-lg border border-neutral-700 mb-3">
        <View className="flex-row justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-xs text-neutral-400 mb-1">PICKUP</Text>
            <Text className="text-sm text-white">{request.pickupLabel}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-neutral-400 mb-1">DELIVERY</Text>
            <Text className="text-sm text-white">{request.deliveryLabel}</Text>
          </View>
        </View>
        <Text className="text-xs text-blue-300 mt-2">
          Time remaining: {request.timeRemainingLabel}
        </Text>
      </View>
    </View>

    <View className="flex-row justify-between mb-3">
      <View className="flex-1 mr-4">
        <View className="flex-row items-center mb-2">
          <Navigation size={16} color="#9CA3AF" />
          <Text className="text-neutral-400 ml-2">
            Max budget: <Text className="text-gray-400 font-medium">{request.maxBudgetLabel}</Text>
          </Text>
        </View>
      </View>

      <View className="bg-gradient-to-br from-green-500/10 to-transparent rounded-lg p-3 border border-green-500/20">
        <Text className="text-xs text-green-400 font-medium">CURRENT BID</Text>
        <Text className="text-2xl font-bold text-green-400">{request.lowestBidLabel}</Text>
        <View className="flex-row justify-between">
          <Text className="text-xs text-neutral-400">{request.bidsCountLabel}</Text>
          <Text className="text-xs text-green-300 font-medium">{request.pricePerKmLabel}</Text>
        </View>
      </View>
    </View>

    <View className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        className="border-blue-500/50 flex-1"
        onPress={() => onViewRoute(request.request)}
      >
        <MapPin size={14} color="#60A5FA" />
        <Text className="text-blue-400 ml-1">View Route</Text>
      </Button>

      <View className="flex-row justify-center items-center">
        {isSelected ? (
          <View className="flex-row items-center w-full">
            <View className="relative mr-2 flex-1">
              <DollarSign
                size={14}
                color="#9CA3AF"
                style={{ position: 'absolute', left: 8, top: 10, zIndex: 10 }}
              />
              <Input
                placeholder="2800"
                value={bidAmount}
                onChangeText={onBidAmountChange}
                keyboardType="numeric"
                className="w-full h-8 pl-6 bg-neutral-700 border-neutral-600 text-white text-sm"
              />
            </View>
            <Button
              size="sm"
              variant="gradient"
              className="bg-gradient-to-r from-green-600 to-green-700 mr-2"
              disabled={!isVerified || isSubmitting}
              onPress={() => onSubmit(request.id)}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Zap size={14} color="#FFFFFF" />
                  <Text className="ml-1 text-white font-semibold">BID</Text>
                </>
              )}
            </Button>
            <TouchableOpacity onPress={onCancelSelection} className="px-2 py-1">
              <Text className="text-neutral-400">✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            size="sm"
            variant="gradient"
            className="bg-gradient-to-r from-blue-600 to-blue-700 flex-1"
            onPress={() => onSelect(request.request)}
            disabled={!isVerified || request.hasBid}
          >
            <Target size={14} color="#FFFFFF" />
            <Text className="ml-1 text-white font-semibold">PLACE BID</Text>
          </Button>
        )}
      </View>

      {request.hasBid && (
        <Text className="text-xs text-blue-400 text-center">
          You already have a pending bid for this request
        </Text>
      )}
    </View>
  </View>
);
