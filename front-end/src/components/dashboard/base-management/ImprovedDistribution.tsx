import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { MapPin, Package, TrendingUp, Minus, Plus } from 'lucide-react-native';

interface Base {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity?: number;
}

interface ImprovedDistributionProps {
  userType: 'buyer' | 'seller';
  bases: Base[];
  product: { 
    id: string; 
    name: string; 
    totalQuantity: number; 
    unit: string;
    image?: string;
  };
  onDistributionComplete?: (distribution: { baseId: string; quantity: number }[]) => void;
}

export const ImprovedDistribution: React.FC<ImprovedDistributionProps> = ({
  userType,
  bases,
  product,
  onDistributionComplete,
}) => {
  const [distribution, setDistribution] = useState<{ baseId: string; quantity: number }[]>(() => {
    // Initialize with equal distribution
    if (bases.length > 0) {
      const equalAmount = Math.floor(product.totalQuantity / bases.length);
      const remainder = product.totalQuantity % bases.length;
      return bases.map((base, index) => ({
        baseId: base.id,
        quantity: equalAmount + (index === 0 ? remainder : 0),
      }));
    }
    return [];
  });

  const [animatedValues] = useState(() => 
    bases.map(() => new Animated.Value(0))
  );

  const getBaseDistribution = (baseId: string) => {
    return distribution.find(d => d.baseId === baseId)?.quantity || 0;
  };

  const getPercentage = (quantity: number) => {
    return product.totalQuantity > 0 
      ? Math.round((quantity / product.totalQuantity) * 100) 
      : 0;
  };

  const getTotalDistributed = () => {
    return distribution.reduce((sum, d) => sum + d.quantity, 0);
  };

  const getRemainingQuantity = () => {
    return product.totalQuantity - getTotalDistributed();
  };

  const isComplete = () => getRemainingQuantity() === 0;

  const handleQuantityChange = (baseId: string, newQuantity: number) => {
    const validQuantity = Math.max(0, newQuantity);
    setDistribution(prev => 
      prev.map(d => d.baseId === baseId ? { ...d, quantity: validQuantity } : d)
    );
  };

  const handlePercentageChange = (baseId: string, percentage: number) => {
    const quantity = Math.round((percentage / 100) * product.totalQuantity);
    handleQuantityChange(baseId, quantity);
  };

  const distributeEqually = () => {
    const equalAmount = Math.floor(product.totalQuantity / bases.length);
    const remainder = product.totalQuantity % bases.length;
    setDistribution(bases.map((base, index) => ({
      baseId: base.id,
      quantity: equalAmount + (index === 0 ? remainder : 0),
    })));
  };

  const allToPrimary = () => {
    setDistribution(bases.map((base, index) => ({
      baseId: base.id,
      quantity: index === 0 ? product.totalQuantity : 0,
    })));
  };

  // Animate progress bars
  useEffect(() => {
    distribution.forEach((d, index) => {
      const percentage = getPercentage(d.quantity);
      Animated.timing(animatedValues[index], {
        toValue: percentage,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [distribution]);

  const getBarColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
    return colors[index % colors.length];
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        {/* Product Header */}
        <View className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-16 h-16 bg-gray-800 rounded-xl items-center justify-center mr-4">
                <Package size={32} color="#60A5FA" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white">{product.name}</Text>
                <Text className="text-gray-300">
                  {userType === 'buyer' ? 'Delivery Distribution' : 'Stock Distribution'}
                </Text>
              </View>
            </View>
          </View>

          {/* Total Progress */}
          <View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-300">Total Quantity</Text>
              <Text className="text-white font-bold">
                {getTotalDistributed()} / {product.totalQuantity} {product.unit}
              </Text>
            </View>
            <View className="bg-gray-800 h-4 rounded-full overflow-hidden">
              <View 
                className={`h-full rounded-full ${isComplete() ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ 
                  width: `${Math.min(100, (getTotalDistributed() / product.totalQuantity) * 100)}%` 
                }}
              />
            </View>
            {!isComplete() && (
              <Text className="text-orange-400 text-sm mt-2">
                {getRemainingQuantity()} {product.unit} remaining
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={distributeEqually}
            className="flex-1 bg-gray-800 rounded-xl p-4 flex-row items-center justify-center"
          >
            <TrendingUp size={20} color="#60A5FA" />
            <Text className="text-white font-medium ml-2">Equal Split</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={allToPrimary}
            className="flex-1 bg-gray-800 rounded-xl p-4 flex-row items-center justify-center"
          >
            <MapPin size={20} color="#60A5FA" />
            <Text className="text-white font-medium ml-2">Primary Only</Text>
          </TouchableOpacity>
        </View>

        {/* Location Cards */}
        <View className="space-y-4">
          {bases.map((base, index) => {
            const quantity = getBaseDistribution(base.id);
            const percentage = getPercentage(quantity);
            const barColor = getBarColor(index);
            const isPrimary = index === 0;

            return (
              <View 
                key={base.id} 
                className={`bg-gray-800 rounded-2xl p-5 ${isPrimary ? 'border-2 border-blue-500/30' : ''}`}
              >
                {/* Location Header */}
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center flex-1">
                    <View 
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: barColor + '20' }}
                    >
                      <MapPin size={20} color={barColor} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-lg font-bold text-white">{base.name}</Text>
                        {isPrimary && (
                          <View className="bg-blue-500/20 px-2 py-1 rounded-full ml-2">
                            <Text className="text-blue-400 text-xs font-bold">PRIMARY</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-400 text-sm">{base.city}, {base.country}</Text>
                    </View>
                  </View>
                </View>

                {/* Large Visual Progress Bar */}
                <View className="mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-400 text-sm">Distribution</Text>
                    <Text className="text-white font-bold text-lg">{percentage}%</Text>
                  </View>
                  <View className="bg-gray-700 h-14 rounded-xl overflow-hidden">
                    <Animated.View
                      className="h-full rounded-xl flex-row items-center justify-center"
                      style={{ 
                        width: animatedValues[index].interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: barColor,
                      }}
                    >
                      {percentage > 20 && (
                        <Text className="text-white font-bold text-lg">
                          {quantity} {product.unit}
                        </Text>
                      )}
                    </Animated.View>
                  </View>
                  {percentage <= 20 && quantity > 0 && (
                    <Text className="text-gray-400 text-sm mt-1">{quantity} {product.unit}</Text>
                  )}
                </View>

                {/* Input Controls */}
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(base.id, quantity - 50)}
                    className="bg-gray-700 w-12 h-12 rounded-xl items-center justify-center"
                  >
                    <Minus size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View className="flex-1 bg-gray-700 rounded-xl px-4 py-3 flex-row items-center">
                    <TextInput
                      className="flex-1 text-white text-center text-lg font-bold"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                      value={quantity.toString()}
                      onChangeText={(text) => handleQuantityChange(base.id, parseInt(text) || 0)}
                    />
                    <Text className="text-gray-400 ml-2">{product.unit}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleQuantityChange(base.id, quantity + 50)}
                    className="bg-gray-700 w-12 h-12 rounded-xl items-center justify-center"
                  >
                    <Plus size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Completion Status */}
        {isComplete() && (
          <View className="bg-green-500/20 border border-green-500 rounded-xl p-4 mt-6">
            <Text className="text-green-400 text-center font-bold">
              ✓ Distribution Complete
            </Text>
          </View>
        )}

        {/* Continue Button */}
        {onDistributionComplete && (
          <TouchableOpacity
            onPress={() => isComplete() && onDistributionComplete(distribution)}
            disabled={!isComplete()}
            className={`mt-6 rounded-xl p-5 ${
              isComplete() ? 'bg-blue-600' : 'bg-gray-700 opacity-50'
            }`}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isComplete() ? 'Continue' : `Distribute ${getRemainingQuantity()} ${product.unit} more`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};