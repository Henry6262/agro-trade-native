import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Product } from '../../types';
import { Card } from '../common';
import { formatCurrency } from '../../utils';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  showAddToCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  showAddToCart = true,
}) => {
  return (
    <Card onPress={onPress} className="mb-4">
      {product.images.length > 0 && (
        <Image
          source={{ uri: product.images[0] }}
          className="w-full h-48 rounded-lg mb-3"
          resizeMode="cover"
        />
      )}
      
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-lg font-semibold text-gray-900 flex-1 mr-2">
          {product.name}
        </Text>
        <Text className="text-lg font-bold text-primary-600">
          {formatCurrency(product.price)}
        </Text>
      </View>
      
      <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
        {product.description}
      </Text>
      
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm text-gray-500">
          {product.quantity} {product.unit} available
        </Text>
        {product.isOrganic && (
          <View className="bg-green-100 px-2 py-1 rounded">
            <Text className="text-xs text-green-800 font-medium">
              Organic
            </Text>
          </View>
        )}
      </View>
      
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-500">
          {product.seller.name}
        </Text>
        
        {showAddToCart && onAddToCart && (
          <TouchableOpacity
            onPress={onAddToCart}
            className="bg-primary-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};