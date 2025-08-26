import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { MapPin, Package, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react-native';
import { useOnboardingStore } from '../../../store/onboardingStore';

interface Base {
  id: string;
  name: string;
  city: string;
  country?: string;
  isPrimary?: boolean;
}

interface Product {
  id: string;
  name: string;
  totalQuantity: number;
  unit: string;
  image?: string;
}

interface ProductDistribution {
  productId: string;
  distributions: { baseId: string; quantity: number; percentage: number }[];
}

interface MultiProductDistributionProps {
  userType: 'buyer' | 'seller';
  products: Product[];
  onComplete?: (distributions: ProductDistribution[]) => void;
}

export const MultiProductDistribution: React.FC<MultiProductDistributionProps> = ({
  userType,
  products,
  onComplete,
}) => {
  const { selectedRole, sellerData, buyerData } = useOnboardingStore();
  const screenWidth = Dimensions.get('window').width;
  
  // Get bases from store
  const bases: Base[] = selectedRole === 'seller' 
    ? sellerData?.bases || []
    : buyerData?.bases || [];

  // State for current product index
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const currentProduct = products[currentProductIndex];

  // State for all product distributions
  const [allDistributions, setAllDistributions] = useState<ProductDistribution[]>(() => {
    return products.map(product => {
      const equalAmount = Math.floor(product.totalQuantity / bases.length);
      const remainder = product.totalQuantity % bases.length;
      
      return {
        productId: product.id,
        distributions: bases.map((base, index) => ({
          baseId: base.id,
          quantity: equalAmount + (index === 0 ? remainder : 0),
          percentage: 0,
        })),
      };
    });
  });

  // Update percentages when distributions change
  useEffect(() => {
    const updatedDistributions = allDistributions.map(productDist => {
      const product = products.find(p => p.id === productDist.productId);
      if (!product) return productDist;

      return {
        ...productDist,
        distributions: productDist.distributions.map(dist => ({
          ...dist,
          percentage: product.totalQuantity > 0 
            ? Math.round((dist.quantity / product.totalQuantity) * 100)
            : 0,
        })),
      };
    });
    
    if (JSON.stringify(updatedDistributions) !== JSON.stringify(allDistributions)) {
      setAllDistributions(updatedDistributions);
    }
  }, [allDistributions, products]);

  const getCurrentDistribution = () => {
    return allDistributions.find(d => d.productId === currentProduct?.id);
  };

  const updateDistribution = (baseId: string, newQuantity: number) => {
    const currentDist = getCurrentDistribution();
    if (!currentDist || !currentProduct) return;

    const validQuantity = Math.max(0, Math.min(newQuantity, currentProduct.totalQuantity));
    
    setAllDistributions(prev => prev.map(dist => {
      if (dist.productId !== currentProduct.id) return dist;
      
      const updatedDistributions = dist.distributions.map(d => 
        d.baseId === baseId ? { ...d, quantity: validQuantity } : d
      );

      // Auto-adjust if over-distributed
      const total = updatedDistributions.reduce((sum, d) => sum + d.quantity, 0);
      if (total > currentProduct.totalQuantity) {
        const excess = total - currentProduct.totalQuantity;
        const otherBases = updatedDistributions.filter(d => d.baseId !== baseId);
        const reductionPerBase = Math.ceil(excess / otherBases.length);
        
        return {
          ...dist,
          distributions: updatedDistributions.map(d => {
            if (d.baseId === baseId) return d;
            return { ...d, quantity: Math.max(0, d.quantity - reductionPerBase) };
          }),
        };
      }

      return { ...dist, distributions: updatedDistributions };
    }));
  };

  const distributeEqually = () => {
    if (!currentProduct) return;
    
    const equalAmount = Math.floor(currentProduct.totalQuantity / bases.length);
    const remainder = currentProduct.totalQuantity % bases.length;
    
    setAllDistributions(prev => prev.map(dist => {
      if (dist.productId !== currentProduct.id) return dist;
      
      return {
        ...dist,
        distributions: bases.map((base, index) => ({
          baseId: base.id,
          quantity: equalAmount + (index === 0 ? remainder : 0),
          percentage: 0,
        })),
      };
    }));
  };

  const allToPrimary = () => {
    if (!currentProduct) return;
    
    setAllDistributions(prev => prev.map(dist => {
      if (dist.productId !== currentProduct.id) return dist;
      
      return {
        ...dist,
        distributions: bases.map((base, index) => ({
          baseId: base.id,
          quantity: index === 0 ? currentProduct.totalQuantity : 0,
          percentage: 0,
        })),
      };
    }));
  };

  const getTotalDistributed = (productId: string) => {
    const dist = allDistributions.find(d => d.productId === productId);
    return dist?.distributions.reduce((sum, d) => sum + d.quantity, 0) || 0;
  };

  const isProductComplete = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return false;
    return getTotalDistributed(productId) === product.totalQuantity;
  };

  const isAllComplete = () => {
    return products.every(p => isProductComplete(p.id));
  };

  const getBarColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
    return colors[index % colors.length];
  };

  if (bases.length === 0) {
    return (
      <View className="flex-1 bg-gray-900 p-4">
        <View className="bg-gray-800 rounded-xl p-6 items-center">
          <MapPin size={32} color="#6B7280" />
          <Text className="text-white text-lg font-bold mt-3">No Locations Added</Text>
          <Text className="text-gray-400 text-sm text-center mt-1">
            Please add locations in the previous step
          </Text>
        </View>
      </View>
    );
  }

  if (!currentProduct) return null;

  const currentDist = getCurrentDistribution();

  return (
    <ScrollView className="flex-1 bg-gray-900" showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Compact Header */}
        <View className="mb-4">
          <Text className="text-white text-lg font-bold mb-2">
            {userType === 'buyer' ? 'Delivery Distribution' : 'Stock Distribution'}
          </Text>
          
          {/* Product Selector Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            {products.map((product, index) => {
              const isComplete = isProductComplete(product.id);
              const isCurrent = index === currentProductIndex;
              
              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => setCurrentProductIndex(index)}
                  className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
                    isCurrent ? 'bg-blue-600' : isComplete ? 'bg-green-600/20 border border-green-600' : 'bg-gray-800'
                  }`}
                >
                  {isComplete && !isCurrent && (
                    <Check size={14} color="#10B981" style={{ marginRight: 4 }} />
                  )}
                  <Text className={`${
                    isCurrent ? 'text-white font-bold' : isComplete ? 'text-green-400' : 'text-gray-400'
                  } text-sm`}>
                    {product.name}
                  </Text>
                  <Text className={`ml-2 text-xs ${
                    isCurrent ? 'text-blue-200' : isComplete ? 'text-green-300' : 'text-gray-500'
                  }`}>
                    ({product.totalQuantity} {product.unit})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Progress Indicator */}
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs">
              {products.filter(p => isProductComplete(p.id)).length} of {products.length} products configured
            </Text>
            {isAllComplete() && (
              <View className="ml-2 bg-green-600/20 px-2 py-1 rounded-full">
                <Text className="text-green-400 text-xs">All Complete</Text>
              </View>
            )}
          </View>
        </View>

        {/* Current Product Info */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-600/20 rounded-lg items-center justify-center mr-3">
                <Package size={20} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-white font-bold">{currentProduct.name}</Text>
                <Text className="text-gray-400 text-sm">
                  Total: {currentProduct.totalQuantity} {currentProduct.unit}
                </Text>
              </View>
            </View>
            
            {/* Navigation between products */}
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setCurrentProductIndex(Math.max(0, currentProductIndex - 1))}
                disabled={currentProductIndex === 0}
                className={`p-2 ${currentProductIndex === 0 ? 'opacity-30' : ''}`}
              >
                <ChevronLeft size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <Text className="text-gray-400 mx-2 text-sm">
                {currentProductIndex + 1}/{products.length}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentProductIndex(Math.min(products.length - 1, currentProductIndex + 1))}
                disabled={currentProductIndex === products.length - 1}
                className={`p-2 ${currentProductIndex === products.length - 1 ? 'opacity-30' : ''}`}
              >
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Distribution Status Bar */}
          <View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-400 text-xs">Distributed</Text>
              <Text className="text-white text-sm font-bold">
                {getTotalDistributed(currentProduct.id)} / {currentProduct.totalQuantity}
              </Text>
            </View>
            <View className="bg-gray-700 h-2 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${
                  isProductComplete(currentProduct.id) ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{
                  width: `${Math.min(100, (getTotalDistributed(currentProduct.id) / currentProduct.totalQuantity) * 100)}%`,
                }}
              />
            </View>
            {!isProductComplete(currentProduct.id) && (
              <Text className="text-orange-400 text-xs mt-1">
                {currentProduct.totalQuantity - getTotalDistributed(currentProduct.id)} {currentProduct.unit} remaining
              </Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={distributeEqually}
            className="flex-1 bg-gray-800 rounded-lg py-2 px-3"
          >
            <Text className="text-gray-300 text-sm text-center">Equal Split</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={allToPrimary}
            className="flex-1 bg-gray-800 rounded-lg py-2 px-3"
          >
            <Text className="text-gray-300 text-sm text-center">All to Primary</Text>
          </TouchableOpacity>
        </View>

        {/* Compact Location Distribution */}
        {currentDist?.distributions.map((dist, index) => {
          const base = bases.find(b => b.id === dist.baseId);
          if (!base) return null;
          
          const barColor = getBarColor(index);
          const percentage = currentProduct.totalQuantity > 0
            ? Math.round((dist.quantity / currentProduct.totalQuantity) * 100)
            : 0;

          return (
            <View key={base.id} className="mb-3 bg-gray-800 rounded-lg p-3 border border-gray-700">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-8 h-8 rounded-md items-center justify-center mr-2"
                    style={{ backgroundColor: barColor + '20' }}
                  >
                    <MapPin size={14} color={barColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-semibold">
                      {base.name}
                      {base.isPrimary && (
                        <Text className="text-blue-400 text-xs"> (Primary)</Text>
                      )}
                    </Text>
                    <Text className="text-gray-500 text-xs">{base.city}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-white font-bold">{percentage}%</Text>
                  <Text className="text-gray-400 text-xs">{dist.quantity} {currentProduct.unit}</Text>
                </View>
              </View>

              {/* Compact Input with Progress Bar */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => updateDistribution(base.id, dist.quantity - 10)}
                  className="bg-gray-700 w-8 h-8 rounded items-center justify-center mr-2"
                >
                  <Text className="text-white">−</Text>
                </TouchableOpacity>

                <View className="flex-1">
                  <View className="bg-gray-700 h-8 rounded overflow-hidden">
                    <View
                      className="h-full absolute left-0 top-0"
                      style={{ width: `${percentage}%`, backgroundColor: barColor }}
                    />
                    <TextInput
                      className="h-full px-2 text-white text-center text-sm font-semibold relative z-10"
                      value={dist.quantity.toString()}
                      onChangeText={(text) => updateDistribution(base.id, parseInt(text) || 0)}
                      keyboardType="numeric"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => updateDistribution(base.id, dist.quantity + 10)}
                  className="bg-gray-700 w-8 h-8 rounded items-center justify-center ml-2"
                >
                  <Text className="text-white">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Overall Completion Status */}
        {isAllComplete() ? (
          <View className="bg-green-600/20 border border-green-600 rounded-xl p-4 mt-4">
            <Text className="text-green-400 text-center font-bold">
              ✓ All Products Distributed Successfully
            </Text>
          </View>
        ) : (
          <View className="bg-gray-800 border border-gray-700 rounded-xl p-4 mt-4 flex-row items-center">
            <AlertCircle size={16} color="#F59E0B" />
            <Text className="text-gray-400 text-sm ml-2">
              Complete distribution for all products to continue
            </Text>
          </View>
        )}

        {/* Continue Button */}
        {onComplete && (
          <TouchableOpacity
            onPress={() => isAllComplete() && onComplete(allDistributions)}
            disabled={!isAllComplete()}
            className={`mt-4 rounded-xl py-4 ${
              isAllComplete() ? 'bg-blue-600' : 'bg-gray-700 opacity-50'
            }`}
          >
            <Text className="text-white text-center font-bold">
              {isAllComplete() ? 'Continue' : 'Complete All Products First'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};