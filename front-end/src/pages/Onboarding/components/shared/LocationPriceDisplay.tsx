import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MapPin, TrendingUp, TrendingDown, DollarSign } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';

interface LocationPriceDisplayProps {
  productId?: string;
  className?: string;
}

export const LocationPriceDisplay: React.FC<LocationPriceDisplayProps> = ({
  productId,
  className = '',
}) => {
  const { location } = useOnboardingStore();
  const { products } = useProductStore();
  const [priceData, setPriceData] = useState<{
    min: number;
    max: number;
    average: number;
    trend?: 'up' | 'down' | 'stable';
  } | null>(null);

  const product = productId ? products.find((p) => p.id === productId) : null;

  useEffect(() => {
    if (product && location) {
      // Simulate fetching location-based pricing
      // In production, this would make an API call to get regional pricing
      const baseMin = parseFloat(product.priceRangeMin || '0');
      const baseMax = parseFloat(product.priceRangeMax || '0');

      // Add some regional variation (this would come from actual API)
      const regionMultiplier = 1 + (Math.random() * 0.2 - 0.1); // ±10% variation

      setPriceData({
        min: Math.round(baseMin * regionMultiplier),
        max: Math.round(baseMax * regionMultiplier),
        average: Math.round(((baseMin + baseMax) / 2) * regionMultiplier),
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      });
    }
  }, [product, location]);

  if (!location) {
    return null;
  }

  return (
    <View className={`bg-white/50 rounded-lg p-3 ${className}`}>
      {/* Location Display */}
      <View className="flex-row items-center mb-3">
        <View className="bg-emerald-500/20 p-2 rounded-full mr-3">
          <MapPin size={16} color="#10B981" />
        </View>
        <View className="flex-1">
          <Text className="text-white text-sm font-medium">Pickup Location</Text>
          <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
            {location.address || `${location.city || 'Location detected'}`}
          </Text>
        </View>
      </View>

      {/* Price Display */}
      {priceData && product && (
        <View className="border-t border-gray-200 pt-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-400 text-xs">Regional Market Price</Text>
            {priceData.trend && (
              <View className="flex-row items-center">
                {priceData.trend === 'up' ? (
                  <TrendingUp size={12} color="#10B981" />
                ) : priceData.trend === 'down' ? (
                  <TrendingDown size={12} color="#EF4444" />
                ) : null}
                <Text
                  className={`text-xs ml-1 ${
                    priceData.trend === 'up'
                      ? 'text-emerald-400'
                      : priceData.trend === 'down'
                        ? 'text-red-400'
                        : 'text-gray-400'
                  }`}
                >
                  {priceData.trend === 'up'
                    ? '+2.5%'
                    : priceData.trend === 'down'
                      ? '-1.8%'
                      : 'Stable'}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-baseline">
            <DollarSign size={16} color="#10B981" />
            <Text className="text-gray-900 text-lg font-bold">
              {priceData.min} - {priceData.max}
            </Text>
            <Text className="text-gray-400 text-xs ml-2">/ {product.defaultUnit}</Text>
          </View>

          <View className="bg-blue-500/10 p-2 rounded mt-2">
            <Text className="text-blue-400 text-xs">
              Average: ${priceData.average}/{product.defaultUnit} in your area
            </Text>
          </View>
        </View>
      )}

      {/* Loading State */}
      {!priceData && product && (
        <View className="border-t border-gray-200 pt-3">
          <ActivityIndicator size="small" color="#10B981" />
          <Text className="text-gray-400 text-xs text-center mt-2">
            Fetching regional prices...
          </Text>
        </View>
      )}
    </View>
  );
};
