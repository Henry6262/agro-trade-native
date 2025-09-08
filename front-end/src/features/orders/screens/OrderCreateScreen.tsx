import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, EmptyState, LoadingSpinner } from '../../../shared/components';
import { OrderItemCard } from '../components/OrderItemCard';
import { OrderSummary } from '../components/OrderSummary';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { useOrders } from '../../../shared/hooks';
import { PaymentMethod } from '../../../shared/types';

const deliverySchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  zipCode: z.string().min(3, 'ZIP code is required'),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

export default function OrderCreateScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { productId } = (route.params as { productId?: string }) || {};
  
  const {
    currentOrder,
    updateItemQuantity,
    removeItemFromOrder,
    setDeliveryAddress,
    setPaymentMethod,
    setOrderNotes,
    createOrder,
    clearCurrentOrder,
  } = useOrders();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      country: 'United States',
    },
  });

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentMethod(method);
  };

  const onSubmit = async (deliveryData: DeliveryFormData) => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (currentOrder.items.length === 0) {
      Alert.alert('Error', 'Please add items to your order');
      return;
    }

    try {
      // Set delivery address and notes
      setDeliveryAddress(deliveryData);
      setOrderNotes(deliveryData.notes || '');

      // Create the order
      const orderData = {
        items: currentOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          ...deliveryData,
          country: deliveryData.country || 'United States',
        },
        paymentMethod: selectedPaymentMethod,
        notes: deliveryData.notes || '',
      };

      await createOrder.mutateAsync(orderData);
      
      Alert.alert(
        'Order Placed Successfully!',
        'Your order has been submitted and is being processed.',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Main', { screen: 'Orders' } as never),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Order Failed',
        error?.response?.data?.message || 'Failed to place order. Please try again.'
      );
    }
  };

  if (currentOrder.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <EmptyState
          title="No Items in Order"
          description="Add products to your order to continue"
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('Main', { screen: 'Marketplace' } as never)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Order Items */}
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Order Items ({currentOrder.items.length})
            </Text>
            {currentOrder.items.map((item) => (
              <OrderItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={(quantity) =>
                  updateItemQuantity(item.productId, quantity)
                }
                onRemove={() => removeItemFromOrder(item.productId)}
              />
            ))}
          </View>

          {/* Delivery Information */}
          <View className="bg-white p-4 rounded-lg">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Delivery Information
            </Text>
            
            <View className="space-y-4">
              <Controller
                name="address"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Street Address"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter your street address"
                    error={errors.address?.message}
                    required
                  />
                )}
              />

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Controller
                    name="city"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="City"
                        value={value}
                        onChangeText={onChange}
                        placeholder="City"
                        error={errors.city?.message}
                        required
                      />
                    )}
                  />
                </View>
                
                <View className="flex-1">
                  <Controller
                    name="state"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="State"
                        value={value}
                        onChangeText={onChange}
                        placeholder="State"
                        error={errors.state?.message}
                        required
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                name="zipCode"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="ZIP Code"
                    value={value}
                    onChangeText={onChange}
                    placeholder="ZIP Code"
                    error={errors.zipCode?.message}
                    required
                  />
                )}
              />

              <Controller
                name="notes"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Delivery Notes (Optional)"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Any special delivery instructions..."
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
            </View>
          </View>

          {/* Payment Method */}
          <PaymentMethodSelector
            selectedMethod={selectedPaymentMethod}
            onSelect={handlePaymentMethodSelect}
          />

          {/* Order Summary */}
          <OrderSummary
            subtotal={currentOrder.totalAmount}
            total={currentOrder.totalAmount}
          />

          {/* Place Order Button */}
          <Button
            title="Place Order"
            onPress={handleSubmit(onSubmit)}
            loading={createOrder.isPending}
            disabled={createOrder.isPending}
            fullWidth
            size="large"
          />
        </View>
      </ScrollView>
      
      {createOrder.isPending && (
        <LoadingSpinner overlay message="Placing your order..." />
      )}
    </SafeAreaView>
  );
}