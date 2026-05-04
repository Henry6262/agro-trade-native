import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import {
  MapPin,
  Star,
  Truck,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  MessageSquare,
} from 'lucide-react-native';

import { Offer, SpecificationMatch, MatchType } from '../types';

interface OfferCardProps {
  offer: Offer;
  buyerRequest: any; // Buyer's original request
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  onNegotiate: (offerId: string) => void;
  isLoading?: boolean;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  buyerRequest,
  onAccept,
  onReject,
  onNegotiate,
  isLoading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Calculate match score and specifications comparison
  const calculateMatchScore = (): number => {
    if (!buyerRequest?.qualityRequirements || buyerRequest.qualityRequirements.length === 0) {
      return offer.matchScore || 85; // Default fallback
    }

    let totalScore = 0;
    let weightedTotal = 0;

    // Price match (30% weight)
    const priceWeight = 0.3;
    if (buyerRequest.maxPricePerUnit && offer.pricePerUnit) {
      const priceRatio = Math.min(buyerRequest.maxPricePerUnit / offer.pricePerUnit, 1);
      totalScore += priceRatio * 100 * priceWeight;
    } else {
      totalScore += 80 * priceWeight; // Default score if no max price
    }
    weightedTotal += priceWeight;

    // Quantity match (20% weight)
    const quantityWeight = 0.2;
    if (buyerRequest.quantity && offer.quantity) {
      const quantityRatio = Math.min(offer.quantity / buyerRequest.quantity, 1);
      totalScore += quantityRatio * 100 * quantityWeight;
    } else {
      totalScore += 70 * quantityWeight;
    }
    weightedTotal += quantityWeight;

    // Specifications match (40% weight)
    const specsWeight = 0.4;
    if (offer.specifications && offer.specifications.length > 0) {
      const matchingSpecs = offer.specifications.filter((spec) => spec.matchesRequirement).length;
      const specRatio = matchingSpecs / offer.specifications.length;
      totalScore += specRatio * 100 * specsWeight;
    } else {
      totalScore += 60 * specsWeight;
    }
    weightedTotal += specsWeight;

    // Delivery terms (10% weight)
    const deliveryWeight = 0.1;
    if (offer.deliveryTerms?.deliveryTime) {
      const deliveryScore = Math.max(0, 100 - offer.deliveryTerms.deliveryTime * 2);
      totalScore += deliveryScore * deliveryWeight;
    } else {
      totalScore += 70 * deliveryWeight;
    }
    weightedTotal += deliveryWeight;

    return Math.round(totalScore / weightedTotal);
  };

  const matchScore = calculateMatchScore();

  const getMatchScoreColor = (score: number) => {
    if (score >= 80)
      return { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' };
    if (score >= 60)
      return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' };
    return { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' };
  };

  const getPriceComparison = () => {
    if (!buyerRequest?.maxPricePerUnit || !offer.pricePerUnit) return null;

    const difference = buyerRequest.maxPricePerUnit - offer.pricePerUnit;
    const percentageDiff = (difference / buyerRequest.maxPricePerUnit) * 100;

    if (difference > 0) {
      return {
        type: 'savings',
        amount: Math.abs(difference),
        percentage: Math.abs(percentageDiff),
        color: 'text-green-400',
        icon: TrendingDown,
      };
    } else {
      return {
        type: 'overage',
        amount: Math.abs(difference),
        percentage: Math.abs(percentageDiff),
        color: 'text-red-400',
        icon: TrendingUp,
      };
    }
  };

  const getQuantityComparison = () => {
    if (!buyerRequest?.quantity || !offer.quantity) return null;

    const difference = offer.quantity - buyerRequest.quantity;
    const percentageDiff = (difference / buyerRequest.quantity) * 100;

    return {
      difference,
      percentage: percentageDiff,
      sufficient: offer.quantity >= buyerRequest.quantity,
    };
  };

  const getSpecificationMatches = (): SpecificationMatch[] => {
    if (!offer.specifications || !buyerRequest?.qualityRequirements) return [];

    return buyerRequest.qualityRequirements.map((requirement: string) => {
      const matchingSpec = offer.specifications.find(
        (spec) =>
          spec.name.toLowerCase().includes(requirement.toLowerCase().split(':')[0] || '') ||
          requirement.toLowerCase().includes(spec.name.toLowerCase())
      );

      if (matchingSpec) {
        return {
          specification: { name: requirement } as any,
          offerValue: matchingSpec,
          matchType: matchingSpec.matchesRequirement ? 'exact' : ('partial' as MatchType),
          score: matchingSpec.matchesRequirement ? 100 : 60,
        };
      }

      return {
        specification: { name: requirement } as any,
        matchType: 'missing' as MatchType,
        score: 0,
      };
    });
  };

  const priceComparison = getPriceComparison();
  const quantityComparison = getQuantityComparison();
  const specificationMatches = getSpecificationMatches();
  const matchColors = getMatchScoreColor(matchScore);

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
        {/* Header with Seller Info and Match Score */}
        <View className="p-4 border-b border-gray-200/30">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 flex-row items-center">
              {/* Seller Avatar */}
              <View className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden mr-3">
                {offer.seller?.avatar ? (
                  <Image
                    source={{ uri: offer.seller.avatar }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-gradient-to-br from-blue-500/20 to-green-500/20 items-center justify-center">
                    <Text className="text-gray-900 font-bold text-lg">
                      {offer.seller?.name?.charAt(0) || 'S'}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-semibold text-base" numberOfLines={1}>
                    {offer.seller?.businessName || offer.seller?.name || 'Seller'}
                  </Text>
                  {offer.seller?.verified && (
                    <View className="ml-2 bg-blue-500/20 p-1 rounded-full">
                      <Award size={12} color="#3B82F6" />
                    </View>
                  )}
                </View>

                {offer.seller?.location && (
                  <View className="flex-row items-center mt-1">
                    <MapPin size={12} color="#10B981" />
                    <Text className="text-gray-600 text-xs ml-1" numberOfLines={1}>
                      {offer.seller.location.city}, {offer.seller.location.country}
                    </Text>
                  </View>
                )}

                {offer.seller?.rating && (
                  <View className="flex-row items-center mt-1">
                    <Star size={12} color="#FBBF24" fill="#FBBF24" />
                    <Text className="text-yellow-400 text-xs ml-1">
                      {offer.seller.rating.toFixed(1)}
                    </Text>
                    {offer.seller?.reviewCount && (
                      <Text className="text-gray-500 text-xs ml-1">
                        ({offer.seller.reviewCount})
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Match Score */}
            <View
              className={`${matchColors.bg} ${matchColors.border} border rounded-lg px-3 py-2 ml-3`}
            >
              <Text className={`${matchColors.text} text-xs font-bold`}>{matchScore}% Match</Text>
            </View>
          </View>
        </View>

        {/* Price and Quantity Section */}
        <View className="p-4 border-b border-gray-200/30">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <View className="flex-row items-baseline">
                <Text className="text-gray-900 font-bold text-2xl">
                  €{offer.pricePerUnit.toFixed(2)}
                </Text>
                <Text className="text-gray-500 text-sm ml-1">/{offer.unit.toLowerCase()}</Text>
              </View>

              {priceComparison && (
                <View className="flex-row items-center mt-1">
                  <priceComparison.icon
                    size={14}
                    color={priceComparison.color.replace('text-', '#')}
                  />
                  <Text className={`${priceComparison.color} text-sm ml-1 font-medium`}>
                    {priceComparison.type === 'savings' ? 'Save' : 'Over'} €
                    {priceComparison.amount.toFixed(2)}({priceComparison.percentage.toFixed(1)}%)
                  </Text>
                </View>
              )}
            </View>

            <View className="text-right">
              <Text className="text-gray-900 font-semibold text-lg">
                {offer.quantity.toLocaleString()} {offer.unit.toLowerCase()}
              </Text>
              {quantityComparison && (
                <Text
                  className={`text-sm ${quantityComparison.sufficient ? 'text-green-400' : 'text-yellow-400'}`}
                >
                  {quantityComparison.sufficient ? 'Sufficient' : 'Partial'} quantity
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Specifications Preview */}
        {specificationMatches.length > 0 && (
          <View className="p-4 border-b border-gray-200/30">
            <Text className="text-gray-600 text-sm mb-3">Specifications Match</Text>
            <View className="flex-row flex-wrap gap-2">
              {specificationMatches.slice(0, 3).map((match, index) => (
                <View
                  key={index}
                  className={`flex-row items-center px-2 py-1 rounded-md ${
                    match.matchType === 'exact'
                      ? 'bg-green-500/20 border border-green-500/40'
                      : match.matchType === 'partial'
                        ? 'bg-yellow-500/20 border border-yellow-500/40'
                        : 'bg-red-500/20 border border-red-500/40'
                  }`}
                >
                  {match.matchType === 'exact' ? (
                    <Check size={10} color="#10B981" />
                  ) : match.matchType === 'missing' ? (
                    <X size={10} color="#EF4444" />
                  ) : (
                    <MessageSquare size={10} color="#FBBF24" />
                  )}
                  <Text
                    className={`text-xs ml-1 ${
                      match.matchType === 'exact'
                        ? 'text-green-400'
                        : match.matchType === 'partial'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {match.specification.name.split(':')[0]}
                  </Text>
                </View>
              ))}
              {specificationMatches.length > 3 && (
                <TouchableOpacity
                  onPress={() => setExpanded(!expanded)}
                  className="bg-gray-100/50 px-2 py-1 rounded-md border border-gray-200/50"
                >
                  <Text className="text-gray-500 text-xs">
                    +{specificationMatches.length - 3} more
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Delivery Terms */}
        {offer.deliveryTerms && (
          <View className="p-4 border-b border-gray-200/30">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Truck size={16} color="#60A5FA" />
                <Text className="text-gray-600 text-sm ml-2">
                  {offer.deliveryTerms.deliveryMethod?.charAt(0).toUpperCase()}
                  {offer.deliveryTerms.deliveryMethod?.slice(1)} delivery
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={16} color="#FBBF24" />
                <Text className="text-yellow-400 text-sm ml-2 font-medium">
                  {offer.deliveryTerms.deliveryTime} days
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons - Improved Layout */}
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
            <Text className="text-blue-400 text-sm font-semibold ml-2">Negotiate</Text>
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
