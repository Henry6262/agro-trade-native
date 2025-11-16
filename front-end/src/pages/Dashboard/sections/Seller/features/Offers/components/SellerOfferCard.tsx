import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, CardContent } from '../../../../../../shared/components/Card';
import { Badge } from '../../../../../../shared/components/Badge';
import {
  Weight,
  DollarSign,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import type { SellerOffer } from '../types';
import { getStatusColorClass } from '../utils';

interface SellerOfferCardProps {
  offer: SellerOffer;
  onAccept: (offer: SellerOffer) => void;
  onReject: (offer: SellerOffer) => void;
  onCounter: (offer: SellerOffer) => void;
  isProcessing: boolean;
}

export const SellerOfferCard: React.FC<SellerOfferCardProps> = ({
  offer,
  onAccept,
  onReject,
  onCounter,
  isProcessing,
}) => (
  <Card
    key={offer.id}
    className={`mb-4 ${
      offer.status === 'pending'
        ? 'bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30'
        : offer.status === 'accepted'
          ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30'
          : offer.status === 'rejected'
            ? 'bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/30'
            : offer.status === 'countered'
              ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/30'
              : 'bg-gradient-to-r from-gray-900/20 to-gray-800/20 border-gray-500/30'
    }`}
  >
    <CardContent className="p-6">
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-lg font-semibold text-white">{offer.product}</Text>
          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
              <Weight color="#fb923c" size={16} />
              <Text className="text-white font-medium text-sm">{offer.quantity} tons</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
              <DollarSign color="#fb923c" size={16} />
              <Text className="text-white font-medium text-sm">
                ${offer.offeredPricePerTon}/ton
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-orange-500/20 px-2 py-1 rounded">
              <Text className="text-orange-300 text-xs">Total:</Text>
              <Text className="text-orange-400 font-bold text-sm">
                ${offer.totalValue.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-col items-end gap-1">
          <Badge
            className={`px-2 py-1 rounded flex-row items-center gap-1 ${getStatusColorClass(offer.status)}`}
          >
            <Text className="text-white text-xs capitalize">{offer.status}</Text>
          </Badge>
          <View className="flex-row items-center gap-1">
            <MapPin color="#9ca3af" size={12} />
            <Text className="text-neutral-400 text-xs">
              {offer.buyerFlag} {offer.buyerLocation}
            </Text>
          </View>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-neutral-400 text-xs mb-2">Buyer Notes</Text>
        <Text className="text-white text-sm">{offer.adminNote}</Text>
      </View>

      <View className="flex-row gap-2 mb-4">
        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
          <Calendar color="#fb923c" size={14} />
          <Text className="text-neutral-300 text-xs">Deadline {offer.deadline}</Text>
        </View>
        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
          <Clock color="#fb923c" size={14} />
          <Text className="text-neutral-300 text-xs">{offer.responseTime}</Text>
        </View>
        {offer.isExpiringSoon && (
          <View className="flex-row items-center gap-1 bg-red-500/20 px-2 py-1 rounded">
            <AlertTriangle color="#ef4444" size={14} />
            <Text className="text-red-400 text-xs">Expiring soon</Text>
          </View>
        )}
      </View>

      <View className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-green-400 text-sm">Estimated Profit</Text>
          <Text className="text-green-400 font-bold text-lg">
            +${offer.estimatedProfit.toLocaleString()}
          </Text>
        </View>
      </View>

      <View className="bg-neutral-800 rounded-lg p-3 mb-4">
        <Text className="text-neutral-400 text-xs mb-2">Quality Requirements</Text>
        <View className="flex-row flex-wrap gap-1">
          {offer.qualityRequirements.map((req) => (
            <Badge key={req} className="bg-neutral-700 text-white text-xs px-2 py-1 rounded">
              {req}
            </Badge>
          ))}
        </View>
      </View>

      {offer.status === 'pending' ? (
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => onAccept(offer)}
            disabled={isProcessing}
            className="flex-1 bg-green-500 py-2 px-4 rounded flex-row items-center justify-center gap-2"
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <CheckCircle color="#ffffff" size={16} />
            )}
            <Text className="text-white font-semibold">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReject(offer)}
            disabled={isProcessing}
            className="bg-transparent border border-red-500 py-2 px-3 rounded"
          >
            <X color="#ef4444" size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onCounter(offer)}
            disabled={isProcessing}
            className="bg-transparent border border-orange-500 py-2 px-3 rounded"
          >
            <DollarSign color="#fb923c" size={16} />
          </TouchableOpacity>
        </View>
      ) : null}

      {offer.status === 'accepted' && (
        <View className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
          <Text className="text-green-400 text-sm font-semibold">Offer Accepted</Text>
          <Text className="text-green-300 text-xs mt-1">
            You've accepted this offer. The buyer has been notified.
          </Text>
        </View>
      )}

      {offer.status === 'rejected' && (
        <View className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <Text className="text-red-400 text-sm font-semibold">Offer Rejected</Text>
          <Text className="text-red-300 text-xs mt-1">
            You've rejected this offer. The negotiation has ended.
          </Text>
        </View>
      )}

      {offer.status === 'countered' && (
        <View className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
          <Text className="text-blue-400 text-sm font-semibold">Counter Offer Sent</Text>
          <Text className="text-blue-300 text-xs mt-1">
            Waiting for buyer's response to your counter offer.
          </Text>
        </View>
      )}

      {offer.status === 'expired' && (
        <View className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-3">
          <Text className="text-gray-400 text-sm font-semibold">Offer Expired</Text>
          <Text className="text-gray-300 text-xs mt-1">
            This offer has expired and is no longer valid.
          </Text>
        </View>
      )}
    </CardContent>
  </Card>
);
