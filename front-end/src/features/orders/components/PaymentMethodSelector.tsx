import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PaymentMethod } from '@shared/types';
import { Card } from '@shared/components/Card';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

const paymentMethods: { value: PaymentMethod; label: string; description: string }[] = [
  {
    value: 'credit_card',
    label: 'Credit Card',
    description: 'Pay with your credit card',
  },
  {
    value: 'debit_card',
    label: 'Debit Card',
    description: 'Pay with your debit card',
  },
  {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Direct transfer from your bank',
  },
  {
    value: 'mobile_money',
    label: 'Mobile Money',
    description: 'Pay with mobile money services',
  },
  {
    value: 'cash_on_delivery',
    label: 'Cash on Delivery',
    description: 'Pay when you receive your order',
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
}) => {
  return (
    <Card>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Payment Method</Text>

      <View className="space-y-3">
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.value}
            onPress={() => onSelect(method.value)}
            className={`p-4 border-2 rounded-lg ${
              selectedMethod === method.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">{method.label}</Text>
                <Text className="text-sm text-gray-600">{method.description}</Text>
              </View>

              <View
                className={`w-5 h-5 rounded-full border-2 ${
                  selectedMethod === method.value
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedMethod === method.value && (
                  <View className="w-full h-full rounded-full bg-primary-500" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
};
