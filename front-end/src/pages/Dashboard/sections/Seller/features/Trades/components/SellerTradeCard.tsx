import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card, CardContent } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { MapPin, DollarSign, Weight, Calendar, Star } from 'lucide-react-native';
import type { SellerTrade, TradeStage } from '../types';
import { getStatusColorClass, getStatusIcon, getTradeStages } from '../utils';
import { TradeStageTimeline } from './TradeStageTimeline';

interface SellerTradeCardProps {
  trade: SellerTrade;
}

export const SellerTradeCard: React.FC<SellerTradeCardProps> = ({ trade }) => {
  const [expanded, setExpanded] = useState(false);
  const stages: TradeStage[] = getTradeStages();
  const IconComponent = getStatusIcon(trade.status);

  return (
    <Card className="bg-neutral-900 border-neutral-700 mb-4">
      <CardContent className="p-6">
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-lg font-semibold text-white">{trade.product}</Text>
            <View className="flex-row items-center gap-4 mt-2">
              <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                <Weight color="#22c55e" size={16} />
                <Text className="text-white font-medium text-sm">{trade.quantity} tons</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                <DollarSign color="#22c55e" size={16} />
                <Text className="text-white font-medium text-sm">
                  ${trade.agreedPricePerTon}/ton
                </Text>
              </View>
              <View className="flex-row items-center gap-1 bg-green-500/20 px-2 py-1 rounded">
                <Text className="text-green-300 text-xs">Total:</Text>
                <Text className="text-green-400 font-bold text-sm">
                  ${trade.price.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
          <Badge
            className={`${getStatusColorClass(trade.status)} text-white flex-row items-center gap-1 px-2 py-1 rounded`}
          >
            <IconComponent color="#ffffff" size={16} />
            <Text className="text-white text-xs capitalize">{trade.status}</Text>
          </Badge>
        </View>

        <TradeStageTimeline currentStage={trade.currentStage} stages={stages} />

        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
            <MapPin color="#fb923c" size={14} />
            <Text className="text-neutral-300 text-xs">
              {trade.buyerFlag} {trade.buyerLocation}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
            <Text className="text-neutral-400 text-xs">Transporter:</Text>
            <Text className="text-white text-xs">{trade.transporter}</Text>
          </View>
          <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
            <Calendar color="#fb923c" size={14} />
            <Text className="text-neutral-300 text-xs">Pickup {trade.pickupDate}</Text>
          </View>
        </View>

        <View className="items-center mt-4">
          <TouchableOpacity
            onPress={() => setExpanded((prev) => !prev)}
            className="px-4 py-2 bg-neutral-700 rounded"
          >
            <Text className="text-neutral-200 text-sm">
              {expanded ? 'Hide Details' : 'View Details'}
            </Text>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View className="mt-4 pt-4 border-t border-neutral-700">
            <View className="mb-4">
              <Text className="text-sm font-medium text-white mb-2">Transport Details</Text>
              <View className="space-y-1">
                <View className="flex-row justify-between">
                  <Text className="text-neutral-400 text-sm">License Plate:</Text>
                  <Text className="text-white font-mono text-sm">{trade.licensePlate}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-neutral-400 text-sm">Fleet Size:</Text>
                  <Text className="text-white text-sm">{trade.transporterTrucks} trucks</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-neutral-400 text-sm">Rating:</Text>
                  <View className="flex-row items-center gap-1">
                    <Star color="#eab308" size={12} fill="#eab308" />
                    <Text className="text-white text-sm">4.8/5</Text>
                  </View>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-white mb-2">Trade Summary</Text>
              <View className="space-y-1">
                <View className="flex-row justify-between">
                  <Text className="text-neutral-400 text-sm">Quantity:</Text>
                  <Text className="text-white text-sm">{trade.quantity} tons</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-neutral-400 text-sm">Price/ton:</Text>
                  <Text className="text-white text-sm">${trade.agreedPricePerTon}</Text>
                </View>
                <View className="flex-row justify-between font-medium">
                  <Text className="text-neutral-400 text-sm">Total Value:</Text>
                  <Text className="text-green-400 text-sm">${trade.price.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
};
