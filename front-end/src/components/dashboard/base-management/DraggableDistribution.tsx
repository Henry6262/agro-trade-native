import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { MapPin, Package, Sliders, RotateCcw } from 'lucide-react-native';
import { useOnboardingStore } from '../../../store/onboardingStore';

interface Base {
  id: string;
  name: string;
  city: string;
  country?: string;
  isPrimary?: boolean;
}

interface DraggableDistributionProps {
  userType: 'buyer' | 'seller';
  product: {
    id: string;
    name: string;
    totalQuantity: number;
    unit: string;
    image?: string;
  };
  onDistributionComplete?: (distribution: { baseId: string; quantity: number }[]) => void;
}

export const DraggableDistribution: React.FC<DraggableDistributionProps> = ({
  userType,
  product,
  onDistributionComplete,
}) => {
  const { selectedRole, sellerData, buyerData } = useOnboardingStore();
  const screenWidth = Dimensions.get('window').width;
  
  // Get bases from store
  const bases: Base[] = selectedRole === 'seller' 
    ? sellerData?.bases || []
    : buyerData?.bases || [];

  // Initialize distribution state
  const [distribution, setDistribution] = useState<{ baseId: string; quantity: number }[]>(() => {
    if (bases.length === 0) return [];
    
    // Equal distribution by default
    const equalAmount = Math.floor(product.totalQuantity / bases.length);
    const remainder = product.totalQuantity % bases.length;
    return bases.map((base, index) => ({
      baseId: base.id,
      quantity: equalAmount + (index === 0 ? remainder : 0),
    }));
  });

  // Animated values for each slider
  const sliderPositions = useRef(
    bases.map(() => new Animated.Value(0))
  ).current;

  // Update slider positions when distribution changes
  useEffect(() => {
    distribution.forEach((dist, index) => {
      const percentage = (dist.quantity / product.totalQuantity) * 100;
      const position = (percentage / 100) * (screenWidth - 120); // Account for padding
      Animated.timing(sliderPositions[index], {
        toValue: position,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [distribution, product.totalQuantity]);

  // Create pan responders for each base
  const createPanResponder = (index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        // Slider grabbed
      },
      
      onPanResponderMove: (_, gestureState) => {
        const maxWidth = screenWidth - 120;
        const newPosition = Math.max(0, Math.min(gestureState.moveX - 60, maxWidth));
        sliderPositions[index].setValue(newPosition);
        
        // Calculate new quantity
        const percentage = (newPosition / maxWidth) * 100;
        const newQuantity = Math.round((percentage / 100) * product.totalQuantity);
        
        // Update distribution
        const newDistribution = [...distribution];
        newDistribution[index].quantity = newQuantity;
        
        // Adjust other distributions proportionally
        const totalAssigned = newDistribution.reduce((sum, d) => sum + d.quantity, 0);
        const difference = product.totalQuantity - totalAssigned;
        
        if (difference !== 0 && newDistribution.length > 1) {
          // Distribute difference among other bases
          const otherBases = newDistribution.filter((_, i) => i !== index);
          const adjustment = Math.floor(difference / otherBases.length);
          const remainder = difference % otherBases.length;
          
          let remainderAdded = 0;
          newDistribution.forEach((dist, i) => {
            if (i !== index) {
              dist.quantity = Math.max(0, dist.quantity + adjustment + (remainderAdded < remainder ? 1 : 0));
              if (remainderAdded < remainder) remainderAdded++;
            }
          });
        }
        
        setDistribution(newDistribution);
      },
      
      onPanResponderRelease: () => {
        // Slider released
      },
    });
  };

  const panResponders = bases.map((_, index) => createPanResponder(index));

  const getTotalDistributed = () => {
    return distribution.reduce((sum, d) => sum + d.quantity, 0);
  };

  const getRemainingQuantity = () => {
    return product.totalQuantity - getTotalDistributed();
  };

  const resetDistribution = () => {
    const equalAmount = Math.floor(product.totalQuantity / bases.length);
    const remainder = product.totalQuantity % bases.length;
    setDistribution(
      bases.map((base, index) => ({
        baseId: base.id,
        quantity: equalAmount + (index === 0 ? remainder : 0),
      }))
    );
  };

  const allToPrimary = () => {
    setDistribution(
      bases.map((base, index) => ({
        baseId: base.id,
        quantity: index === 0 ? product.totalQuantity : 0,
      }))
    );
  };

  const getPercentage = (quantity: number) => {
    return product.totalQuantity > 0
      ? Math.round((quantity / product.totalQuantity) * 100)
      : 0;
  };

  const getBarColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
    return colors[index % colors.length];
  };

  if (bases.length === 0) {
    return (
      <View className="flex-1 bg-gray-900 p-6">
        <View className="bg-gray-800 rounded-2xl p-8 items-center">
          <MapPin size={48} color="#6B7280" />
          <Text className="text-white text-xl font-bold mt-4">No Locations Added</Text>
          <Text className="text-gray-400 text-center mt-2">
            Please add locations in the previous step
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-gray-700">
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 bg-gray-700 rounded-xl items-center justify-center mr-4">
              <Package size={28} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-white">{product.name}</Text>
              <Text className="text-gray-400">
                {userType === 'buyer' ? 'Distribution to Delivery Points' : 'Stock Distribution'}
              </Text>
            </View>
          </View>

          {/* Total Progress */}
          <View className="bg-gray-800 rounded-xl p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400">Total Quantity</Text>
              <Text className="text-white font-bold text-lg">
                {product.totalQuantity} {product.unit}
              </Text>
            </View>
            <View className="bg-gray-700 h-3 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  getRemainingQuantity() === 0 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min(100, (getTotalDistributed() / product.totalQuantity) * 100)}%`,
                }}
              />
            </View>
            {getRemainingQuantity() !== 0 && (
              <Text className="text-orange-400 text-sm mt-2">
                {Math.abs(getRemainingQuantity())} {product.unit} {getRemainingQuantity() > 0 ? 'remaining' : 'over-distributed'}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={resetDistribution}
            className="flex-1 bg-gray-800 rounded-xl p-4 flex-row items-center justify-center border border-gray-700"
          >
            <Sliders size={20} color="#3B82F6" />
            <Text className="text-white font-medium ml-2">Equal Split</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={allToPrimary}
            className="flex-1 bg-gray-800 rounded-xl p-4 flex-row items-center justify-center border border-gray-700"
          >
            <MapPin size={20} color="#3B82F6" />
            <Text className="text-white font-medium ml-2">Primary Only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={resetDistribution}
            className="bg-gray-800 rounded-xl p-4 items-center justify-center border border-gray-700"
          >
            <RotateCcw size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Distribution Sliders */}
        <View className="space-y-4">
          {bases.map((base, index) => {
            const dist = distribution.find(d => d.baseId === base.id);
            const quantity = dist?.quantity || 0;
            const percentage = getPercentage(quantity);
            const barColor = getBarColor(index);

            return (
              <View key={base.id} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
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
                      <Text className="text-lg font-bold text-white">
                        {base.name}
                        {base.isPrimary && (
                          <Text className="text-blue-400 text-xs"> (PRIMARY)</Text>
                        )}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {base.city}{base.country ? `, ${base.country}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-3xl font-bold text-white">{percentage}%</Text>
                    <Text className="text-gray-400">{quantity} {product.unit}</Text>
                  </View>
                </View>

                {/* Draggable Slider */}
                <View className="h-16 bg-gray-700 rounded-xl overflow-hidden relative">
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      backgroundColor: barColor,
                      width: sliderPositions[index],
                      borderRadius: 12,
                    }}
                  />
                  <Animated.View
                    {...panResponders[index].panHandlers}
                    style={{
                      position: 'absolute',
                      top: 8,
                      bottom: 8,
                      width: 48,
                      backgroundColor: 'white',
                      borderRadius: 24,
                      transform: [{ translateX: sliderPositions[index] }],
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                    }}
                  >
                    <Text className="text-xs font-bold" style={{ color: barColor }}>
                      {quantity}
                    </Text>
                  </Animated.View>
                </View>

                {/* Helper text */}
                <Text className="text-gray-500 text-xs mt-2 text-center">
                  Drag the slider to adjust distribution
                </Text>
              </View>
            );
          })}
        </View>

        {/* Completion Status */}
        {getRemainingQuantity() === 0 && (
          <View className="bg-green-500/20 border border-green-500 rounded-xl p-4 mt-6">
            <Text className="text-green-400 text-center font-bold text-lg">
              ✓ Distribution Complete
            </Text>
          </View>
        )}

        {/* Continue Button */}
        {onDistributionComplete && (
          <TouchableOpacity
            onPress={() => getRemainingQuantity() === 0 && onDistributionComplete(distribution)}
            disabled={getRemainingQuantity() !== 0}
            className={`mt-6 rounded-xl p-5 ${
              getRemainingQuantity() === 0 ? 'bg-blue-600' : 'bg-gray-700 opacity-50'
            }`}
          >
            <Text className="text-white text-center font-bold text-lg">
              {getRemainingQuantity() === 0
                ? 'Continue'
                : `Distribute ${Math.abs(getRemainingQuantity())} ${product.unit} to continue`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};