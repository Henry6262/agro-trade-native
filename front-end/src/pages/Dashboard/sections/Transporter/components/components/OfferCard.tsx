import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { MapOffer } from '@pages/Dashboard/sections/Transporter/features/maps/types';

interface OfferCardProps {
  offer: MapOffer;
  onViewRoute?: (offer: MapOffer) => void | Promise<void>;
}

interface ExtendedMapOffer extends MapOffer {
  estimatedDistance?: number;
}

/**
 * Offer card component with View Route button
 */
export const OfferCard: React.FC<OfferCardProps> = ({ offer, onViewRoute }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const extendedOffer = offer as ExtendedMapOffer;
  const trucksNeeded = Math.ceil(offer.quantity / 40);
  const isDelivered = offer.status === 'delivered';

  const handleViewRoute = async () => {
    if (!onViewRoute || isDelivered) return;

    setIsLoading(true);
    setHasError(false);

    try {
      await onViewRoute(offer);
    } catch (_error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (hasError) return 'Route unavailable';
    if (isLoading) return 'Calculating...';
    return 'View Route';
  };

  return (
    <View className="bg-white dark:bg-white rounded-lg p-4 mb-3 shadow-sm">
      {/* Offer Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-900">
            {offer.productType.charAt(0).toUpperCase() + offer.productType.slice(1)}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400">{offer.quantity} tons</Text>
        </View>
        <View className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
          <Text className="text-blue-800 dark:text-blue-200 text-xs font-medium">
            {offer.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Location Info */}
      <View className="mb-3">
        <View className="flex-row items-center mb-1">
          <Text className="text-sm text-gray-700 dark:text-gray-600 font-medium">From:</Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {offer.pickup.name || offer.pickup.address.city}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-700 dark:text-gray-600 font-medium">To:</Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {offer.delivery.name || offer.delivery.address.city}
          </Text>
        </View>
      </View>

      {/* Distance and Trucks Info */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {trucksNeeded} trucks needed
        </Text>
        {extendedOffer.estimatedDistance && (
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            ~{extendedOffer.estimatedDistance} km
          </Text>
        )}
      </View>

      {/* Value and Deadline */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-sm font-medium text-green-600 dark:text-green-400">
          QAR {offer.estimatedValue.toLocaleString()}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          Due: {new Date(offer.deadline).toLocaleDateString()}
        </Text>
      </View>

      {/* View Route Button */}
      <TouchableOpacity
        onPress={handleViewRoute}
        disabled={isDelivered || isLoading}
        accessible={true}
        accessibilityLabel="View Route"
        accessibilityRole="button"
        className={`
          flex-row items-center justify-center 
          py-3 px-4 rounded-lg
          ${
            isDelivered
              ? 'bg-gray-200 dark:bg-gray-700'
              : hasError
                ? 'bg-red-100 dark:bg-red-900'
                : 'bg-blue-500 dark:bg-blue-600'
          }
        `}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <MapPin size={18} color={isDelivered ? '#9CA3AF' : '#FFFFFF'} testID="map-icon" />
            <Text
              className={`
                ml-2 font-medium
                ${isDelivered ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900'}
              `}
              disabled={isDelivered}
            >
              {getButtonText()}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
