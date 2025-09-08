import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { OrderItem } from '../../../shared/types';
import { Card } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils';

interface OrderItemCardProps {
  item: OrderItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const handleIncrement = () => {
    onUpdateQuantity(item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.quantity - 1);
    } else {
      onRemove();
    }
  };

  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            {item.product.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            {formatCurrency(item.unitPrice)} per {item.product.unit}
          </Text>
          <Text className="text-base font-medium text-primary-600">
            {formatCurrency(item.totalPrice)}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleDecrement}
            className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
          >
            <Text className="text-lg font-bold text-gray-600">-</Text>
          </TouchableOpacity>
          
          <Text className="mx-4 text-lg font-semibold text-gray-900">
            {item.quantity}
          </Text>
          
          <TouchableOpacity
            onPress={handleIncrement}
            className="w-8 h-8 bg-primary-600 rounded-full items-center justify-center"
          >
            <Text className="text-lg font-bold text-white">+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        onPress={onRemove}
        className="mt-3 py-2"
      >
        <Text className="text-red-600 text-center font-medium">
          Remove Item
        </Text>
      </TouchableOpacity>
    </Card>
  );
};