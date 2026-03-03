import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import {
  MapPin,
  Star,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  MessageSquare,
  DollarSign,
  Package,
  Building2,
  User,
} from 'lucide-react-native';

import { Badge } from './Badge';

interface BuyerOffer {
  id: string;
  buyer: {
    id: string;
    name: string;
    company?: string;
    location: {
      city: string;
      state?: string;
      country: string;
    };
    rating: number;
    reviewCount: number;
    verified: boolean;
    avatar?: string;
  };
  requestedQuantity: number;
  offeredPrice: number;
  unit: string;
  currency: string;
  deliveryRequirements: {
    location: string;
    timeframe: string;
    method?: string;
  };
  specifications?: {
    name: string;
    requirement: string;
    matches: boolean;
  }[];
  matchScore: number;
  totalValue: number;
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  createdAt: string;
}

interface SellerOfferCardProps {
  offer: BuyerOffer;
  sellerProduct: any; // Seller's product listing
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onNegotiate: (offerId: string) => void;
  isLoading?: boolean;
}

export const SellerOfferCard: React.FC<SellerOfferCardProps> = ({
  offer,
  sellerProduct,
  onAccept,
  onReject,
  onNegotiate,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Calculate profit margin and price comparison
  const calculatePriceAnalysis = () => {
    const marketPrice = sellerProduct?.priceRangeMin || 0;
    const offerPrice = offer.offeredPrice;
    const difference = offerPrice - marketPrice;
    const marginPercentage = marketPrice > 0 ? (difference / marketPrice) * 100 : 0;

    return {
      difference,
      marginPercentage,
      isProfitable: difference > 0,
      isAboveMarket: offerPrice > marketPrice,
    };
  };

  const priceAnalysis = calculatePriceAnalysis();

  const getMatchScoreColor = (score: number) => {
    if (score >= 80)
      return { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' };
    if (score >= 60)
      return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' };
    return { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' };
  };

  const formatTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) return `${diffDays} days`;
    if (diffHours > 1) return `${diffHours} hours`;
    return 'Expires soon';
  };

  const matchColors = getMatchScoreColor(offer.matchScore);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="mb-4">
      <View className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 rounded-xl border border-gray-200/50 overflow-hidden">
        {/* Header with Buyer Info and Match Score */}
        <View className="p-4 border-b border-gray-200/30">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 flex-row items-center">
              {/* Buyer Avatar */}
              <View className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden mr-3">
                {offer.buyer?.avatar ? (
                  <Image
                    source={{ uri: offer.buyer.avatar }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-gradient-to-br from-blue-500/20 to-green-500/20 items-center justify-center">
                    <Text className="text-gray-900 font-bold text-lg">
                      {offer.buyer?.name?.charAt(0) || offer.buyer?.company?.charAt(0) || 'B'}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-semibold text-base" numberOfLines={1}>
                    {offer.buyer?.company || offer.buyer?.name || 'Buyer'}
                  </Text>
                  {offer.buyer?.verified && (
                    <View className="ml-2 bg-blue-500/20 p-1 rounded-full">
                      <Award size={12} color="#3B82F6" />
                    </View>
                  )}
                </View>

                {offer.buyer?.location && (
                  <View className="flex-row items-center mt-1">
                    <MapPin size={12} color="#10B981" />
                    <Text className="text-gray-600 text-xs ml-1" numberOfLines={1}>
                      {offer.buyer.location.city}, {offer.buyer.location.country}
                    </Text>
                  </View>
                )}

                {offer.buyer?.rating && (
                  <View className="flex-row items-center mt-1">
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text className="text-yellow-400 text-xs ml-1">
                      {offer.buyer.rating.toFixed(1)}
                    </Text>
                    {offer.buyer?.reviewCount && (
                      <Text className="text-gray-500 text-xs ml-1">
                        ({offer.buyer.reviewCount})
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Match Score */}
            <View className="ml-3 items-end">
              <View
                className={`${matchColors.bg} ${matchColors.border} border rounded-lg px-3 py-2`}
              >
                <Text className={`${matchColors.text} text-xs font-bold`}>
                  {offer.matchScore}% Match
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Offer Details Section */}
        <View className="p-4 border-b border-gray-200/30">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-1">
              <View className="flex-row items-baseline">
                <Text className="text-gray-900 font-bold text-2xl">
                  €{offer.offeredPrice.toFixed(2)}
                </Text>
                <Text className="text-gray-500 text-sm ml-1">/{offer.unit.toLowerCase()}</Text>
              </View>

              {/* Price Analysis */}
              <View className="flex-row items-center mt-1">
                {priceAnalysis.isProfitable ? (
                  <TrendingUp size={14} color="#10B981" />
                ) : (
                  <TrendingDown size={14} color="#EF4444" />
                )}
                <Text
                  className={`text-sm ml-1 font-medium ${
                    priceAnalysis.isProfitable ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {priceAnalysis.isProfitable ? '+' : ''}€
                  {Math.abs(priceAnalysis.difference).toFixed(2)}(
                  {priceAnalysis.marginPercentage.toFixed(1)}%)
                </Text>
              </View>
            </View>

            <View className="text-right">
              <Text className="text-gray-900 font-semibold text-lg">
                {offer.requestedQuantity.toLocaleString()} {offer.unit.toLowerCase()}
              </Text>
              <Text className="text-gray-500 text-sm">Requested</Text>
            </View>
          </View>

          {/* Total Value and Availability Check */}
          <View className="bg-gray-50/50 rounded-lg p-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 font-medium">Total Value</Text>
              <Text className="text-green-400 font-bold text-lg">
                €{offer.totalValue.toLocaleString()}
              </Text>
            </View>

            {sellerProduct?.quantity && (
              <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-200/30">
                <Text className="text-gray-500 text-sm">Your Available</Text>
                <Text
                  className={`text-sm font-medium ${
                    sellerProduct.quantity >= offer.requestedQuantity
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {sellerProduct.quantity} {offer.unit.toLowerCase()}(
                  {sellerProduct.quantity >= offer.requestedQuantity ? 'Sufficient' : 'Partial'})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Specifications Match */}
        {offer.specifications && offer.specifications.length > 0 && (
          <View className="p-4 border-b border-gray-200/30">
            <Text className="text-gray-600 text-sm mb-3">Specification Requirements</Text>
            <View className="flex-row flex-wrap gap-2">
              {offer.specifications.slice(0, 3).map((spec, index) => (
                <View
                  key={index}
                  className={`flex-row items-center px-2 py-1 rounded-md ${
                    spec.matches
                      ? 'bg-green-500/20 border border-green-500/40'
                      : 'bg-red-500/20 border border-red-500/40'
                  }`}
                >
                  {spec.matches ? (
                    <Check size={10} color="#10B981" />
                  ) : (
                    <X size={10} color="#EF4444" />
                  )}
                  <Text
                    className={`text-xs ml-1 ${spec.matches ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {spec.name}
                  </Text>
                </View>
              ))}
              {offer.specifications.length > 3 && (
                <TouchableOpacity
                  onPress={() => setExpanded(!expanded)}
                  className="bg-gray-100/50 px-2 py-1 rounded-md border border-gray-200/50"
                >
                  <Text className="text-gray-500 text-xs">
                    +{offer.specifications.length - 3} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Message from Buyer */}
        {offer.message && (
          <View className="p-4 border-b border-gray-200/30">
            <Text className="text-gray-600 text-sm mb-2">Buyer&apos;s Message</Text>
            <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <Text className="text-blue-200 text-sm">{offer.message}</Text>
            </View>
          </View>
        )}

        {/* Validity and Timing */}
        <View className="p-4 border-b border-gray-200/30">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Clock size={16} color="#FBBF24" />
              <Text className="text-gray-600 text-sm ml-2">Valid until</Text>
            </View>
            <Text className="text-yellow-400 text-sm font-medium">
              {formatTimeRemaining(offer.validUntil)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="p-5 flex-row gap-4">
          <TouchableOpacity
            onPress={() => onReject(offer.id)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className="flex-1 bg-gradient-to-br from-red-500/15 to-red-600/10 border border-red-500/40 rounded-xl py-4 flex-row items-center justify-center"
            disabled={isLoading}
            style={{
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <X size={18} color="#EF4444" />
            <Text className="text-red-400 text-sm font-semibold ml-2">Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onNegotiate(offer.id)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className="flex-1 bg-gradient-to-br from-blue-500/20 to-indigo-500/15 border border-blue-500/50 rounded-xl py-4 flex-row items-center justify-center"
            disabled={isLoading}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <MessageSquare size={18} color="#3B82F6" />
            <Text className="text-blue-400 text-sm font-semibold ml-2">Counter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onAccept(offer.id)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className="flex-1 bg-gradient-to-br from-green-500/20 to-emerald-600/15 border border-green-500/50 rounded-xl py-4 flex-row items-center justify-center"
            disabled={isLoading}
            style={{
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              elevation: 3,
            }}
          >
            <Check size={18} color="#10B981" />
            <Text className="text-green-400 text-sm font-bold ml-2">Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};
