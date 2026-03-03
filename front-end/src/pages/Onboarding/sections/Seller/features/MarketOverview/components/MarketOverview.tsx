import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Users, Zap, ShoppingCart, MapPin, DollarSign, Building2 } from 'lucide-react-native';
import { products } from '@shared/constants/onboarding';
import type { ProductSpecification } from '@shared/types/onboarding';
import { Card } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { useOnboardingStore } from '@stores/onboarding.store';
import axios from 'axios';
import { APP_CONFIG } from '@shared/constants';

interface MarketOverviewProps {
  selectedProducts: string[];
  specifications: ProductSpecification[];
  onComplete?: () => void;
}

export function MarketOverview({
  selectedProducts,
  specifications,
  onComplete,
}: MarketOverviewProps) {
  const { location: userLocation } = useOnboardingStore();
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      fetchPricingData();
    }
  }, [userLocation]);

  const fetchPricingData = async () => {
    try {
      setLoadingPrices(true);
      const response = await axios.post(`${APP_CONFIG.API_URL}/location/pricing`, {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        productIds: selectedProducts,
      });
      setPricingData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const handleCreateSellRequest = () => {
    // Handle sell request creation
    onComplete?.();
  };

  const totalWeight = specifications.reduce((sum, spec) => {
    const quantity = Number.parseInt(spec.quantity) || 0;
    const multiplier = spec.unit === 'ton' ? 1000 : spec.unit === 'quintal' ? 100 : 1;
    return sum + quantity * multiplier;
  }, 0);

  const totalValue = specifications.reduce((sum, spec) => {
    const quantity = Number.parseInt(spec.quantity) || 0;
    const pricePerKilo = Number.parseFloat(spec.pricePerKilo) || 0;
    const multiplier = spec.unit === 'ton' ? 1000 : spec.unit === 'quintal' ? 100 : 1;
    return sum + quantity * multiplier * pricePerKilo;
  }, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pb-24">
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold text-primary-500 text-center mb-3">
              Almost Done! 🎉
            </Text>
            <Text className="text-gray-400 text-base text-center">
              Review your setup and start trading
            </Text>
          </View>

          {/* Location Card */}
          {userLocation && (
            <Card className="p-4 bg-white border-gray-600 mb-4">
              <View className="flex-row items-center">
                <MapPin size={20} color="#3B82F6" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-medium">Your Location</Text>
                  <Text className="text-gray-400">
                    {userLocation.city
                      ? `${userLocation.city}, ${userLocation.country}`
                      : 'Location detected'}
                  </Text>
                </View>
                <Badge className="bg-blue-500/20 border-blue-500">
                  <Text className="text-blue-400 text-xs">Regional Pricing Active</Text>
                </Badge>
              </View>
            </Card>
          )}

          {/* Regional Pricing Info */}
          {loadingPrices ? (
            <Card className="p-6 bg-white border-gray-600 mb-4">
              <View className="items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-gray-400 mt-2">Loading regional prices...</Text>
              </View>
            </Card>
          ) : (
            pricingData.length > 0 && (
              <Card className="p-4 bg-white border-gray-600 mb-4">
                <View className="flex-row items-center mb-3">
                  <DollarSign size={20} color="#10B981" />
                  <Text className="text-gray-900 font-medium ml-2">Regional Market Prices</Text>
                </View>
                {pricingData.map((price, index) => (
                  <View
                    key={index}
                    className="flex-row justify-between py-2 border-t border-gray-200"
                  >
                    <Text className="text-gray-600">{price.productName}</Text>
                    <Text className="text-green-400 font-medium">
                      €{price.minPrice}-{price.maxPrice}/{price.unit || 'ton'}
                    </Text>
                  </View>
                ))}
              </Card>
            )
          )}

          {/* Quick Features */}
          <View className="flex-row justify-between mb-6">
            <Card className="flex-1 p-3 bg-white border-gray-600 mr-2">
              <View className="items-center">
                <Users size={20} color="#22C55E" />
                <Text className="text-xs text-gray-400 mt-1">Active Buyers</Text>
                <Text className="text-lg font-bold text-gray-900">1,847</Text>
              </View>
            </Card>
            <Card className="flex-1 p-3 bg-white border-gray-600 ml-2">
              <View className="items-center">
                <Building2 size={20} color="#8B5CF6" />
                <Text className="text-xs text-gray-400 mt-1">Base Management</Text>
                <Text className="text-sm text-purple-400">After Setup</Text>
              </View>
            </Card>
          </View>

          <Card className="p-6 bg-white border-gray-600">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <ShoppingCart size={20} color="#22C55E" className="mr-2" />
                <Text className="text-xl font-bold text-gray-900">Your Products</Text>
              </View>
              <Badge className="bg-primary-500/20 border-primary-500">
                <Text className="text-primary-500">
                  {specifications.length} item{specifications.length !== 1 ? 's' : ''}
                </Text>
              </Badge>
            </View>

            <View>
              {specifications.map((spec) => {
                const product = products.find((p) => p.id === spec.productId);
                if (!product) return null;

                const itemWeight = (() => {
                  const quantity = Number.parseInt(spec.quantity) || 0;
                  const multiplier = spec.unit === 'ton' ? 1000 : spec.unit === 'quintal' ? 100 : 1;
                  return quantity * multiplier;
                })();

                const itemValue = (() => {
                  const pricePerKilo = Number.parseFloat(spec.pricePerKilo) || 0;
                  return itemWeight * pricePerKilo;
                })();

                return (
                  <View
                    key={spec.productId}
                    className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-600 mb-4"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-4">{product.icon}</Text>
                      <View>
                        <Text className="font-semibold text-gray-900">{product.name}</Text>
                        <Text className="text-sm text-gray-400">
                          {spec.quantity} {spec.unit} • ₹{spec.pricePerKilo}/kg
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-semibold text-gray-900">
                        ₹{itemValue.toLocaleString()}
                      </Text>
                      <Text className="text-xs text-gray-400">{itemWeight}kg total</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View className="border-t border-gray-600 mt-6 pt-4">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-semibold text-gray-900">Total Weight</Text>
                  <Text className="text-sm text-gray-400">{totalWeight.toLocaleString()} kg</Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-gray-900">Total Value</Text>
                  <Text className="text-lg font-bold text-primary-500">
                    ₹{totalValue.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* What's Next Card */}
          <Card className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30 mb-6">
            <Text className="text-gray-900 font-semibold mb-3">✨ After You Complete Setup</Text>
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Text className="text-green-400 mr-2">✓</Text>
                <Text className="text-gray-600 text-sm">Add multiple warehouse/silo locations</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-green-400 mr-2">✓</Text>
                <Text className="text-gray-600 text-sm">Manage inventory across all bases</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-green-400 mr-2">✓</Text>
                <Text className="text-gray-600 text-sm">Get matched with verified buyers</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-green-400 mr-2">✓</Text>
                <Text className="text-gray-600 text-sm">Access real-time market analytics</Text>
              </View>
            </View>
          </Card>

          <View className="items-center mt-8">
            <TouchableOpacity
              className={`
                w-full py-6 px-4 rounded-lg flex-row items-center justify-center
                ${
                  specifications.length === 0 ||
                  !specifications.every((spec) => spec.quantity && spec.pricePerKilo)
                    ? 'bg-gray-600'
                    : 'bg-primary-500'
                }
              `}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 6,
              }}
              onPress={handleCreateSellRequest}
              disabled={
                specifications.length === 0 ||
                !specifications.every((spec) => spec.quantity && spec.pricePerKilo)
              }
              activeOpacity={0.8}
            >
              <Zap size={20} color="white" className="mr-2" />
              <Text className="text-gray-900 text-lg font-semibold">Complete Setup</Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-400 text-center mt-3">
              You&apos;ll be asked to sign in to finalize your account
            </Text>
            <Text className="text-xs text-green-400 text-center mt-1">
              Setup time: Less than 5 minutes!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
