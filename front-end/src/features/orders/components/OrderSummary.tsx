import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@shared/components/Card';
import { formatCurrency } from '@shared/utils';

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee?: number;
  tax?: number;
  total: number;
  currency?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  deliveryFee = 0,
  tax = 0,
  total,
  currency = 'USD',
}) => {
  return (
    <Card>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Order Summary</Text>

      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="text-gray-900 font-medium">{formatCurrency(subtotal, currency)}</Text>
        </View>

        {deliveryFee > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Delivery Fee</Text>
            <Text className="text-gray-900 font-medium">
              {formatCurrency(deliveryFee, currency)}
            </Text>
          </View>
        )}

        {tax > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Tax</Text>
            <Text className="text-gray-900 font-medium">{formatCurrency(tax, currency)}</Text>
          </View>
        )}

        <View className="border-t border-gray-200 pt-2 mt-2">
          <View className="flex-row justify-between">
            <Text className="text-lg font-semibold text-gray-900">Total</Text>
            <Text className="text-lg font-bold text-primary-600">
              {formatCurrency(total, currency)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};
