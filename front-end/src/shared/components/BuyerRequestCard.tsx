import React from 'react';
import { View, Text } from 'react-native';
import { Package, DollarSign, Weight, MapPin, Award } from 'lucide-react-native';
import { Badge } from './Badge';

interface BuyerRequestCardProps {
  buyerRequest: any;
  className?: string;
}

export const BuyerRequestCard: React.FC<BuyerRequestCardProps> = ({
  buyerRequest,
  className = '',
}) => {
  if (!buyerRequest) return null;

  return (
    <View
      className={`rounded-xl p-5 border border-blue-500/30 ${className}`}
      style={{
        backgroundColor: 'transparent',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Gradient Background */}
      <View className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-600/10" />

      <View className="relative z-10">
        {/* Header */}
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
            <Package size={18} color="#3B82F6" />
          </View>
          <Text className="text-white font-semibold text-lg flex-1">Your Original Request</Text>
          <Badge className="bg-blue-500/20 border-blue-500/40 text-blue-300 text-xs">
            Reference
          </Badge>
        </View>

        {/* Key Requirements Grid */}
        <View className="space-y-3">
          {/* Price and Quantity Row */}
          <View className="flex-row justify-between">
            {buyerRequest.maxPricePerUnit && (
              <View className="flex-row items-center flex-1">
                <DollarSign size={16} color="#FBBF24" />
                <Text className="text-yellow-400 font-semibold ml-1">
                  Max €{buyerRequest.maxPricePerUnit}
                </Text>
                <Text className="text-neutral-400 text-sm ml-1">
                  /{buyerRequest.unit?.toLowerCase() || 'unit'}
                </Text>
              </View>
            )}

            {buyerRequest.quantity && (
              <View className="flex-row items-center">
                <Weight size={16} color="#10B981" />
                <Text className="text-green-400 font-semibold ml-1">
                  {buyerRequest.quantity} {buyerRequest.unit?.toLowerCase() || 'units'}
                </Text>
              </View>
            )}
          </View>

          {/* Location */}
          {buyerRequest.deliveryLocation && (
            <View className="flex-row items-center">
              <MapPin size={16} color="#60A5FA" />
              <Text className="text-blue-400 ml-1" numberOfLines={1}>
                {buyerRequest.deliveryFlag} {buyerRequest.deliveryLocation}
              </Text>
            </View>
          )}

          {/* Quality Requirements */}
          {buyerRequest.qualityRequirements && buyerRequest.qualityRequirements.length > 0 && (
            <View>
              <View className="flex-row items-center mb-2">
                <Award size={16} color="#A855F7" />
                <Text className="text-purple-400 font-medium ml-1">Quality Requirements</Text>
              </View>
              <View className="flex-row flex-wrap gap-1">
                {buyerRequest.qualityRequirements.slice(0, 4).map((req: string, idx: number) => (
                  <Badge
                    key={idx}
                    className="text-xs bg-purple-500/20 border-purple-500/40 text-purple-300"
                  >
                    {req.length > 25 ? `${req.substring(0, 25)}...` : req}
                  </Badge>
                ))}
                {buyerRequest.qualityRequirements.length > 4 && (
                  <Badge className="text-xs bg-neutral-700/50 border-neutral-600/50 text-neutral-400">
                    +{buyerRequest.qualityRequirements.length - 4} more
                  </Badge>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
