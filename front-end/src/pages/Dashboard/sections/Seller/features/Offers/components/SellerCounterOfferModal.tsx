import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  User,
  MapPin,
  Calculator,
  Info,
  Send,
} from 'lucide-react-native';

import { Card, CardContent } from '../../../../../../shared/components/Card';
import { SellerOffer } from '../../../../../../services/sellerOfferService';

interface SellerCounterOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer: SellerOffer | null;
  onConfirm: (
    negotiationId: string,
    counterPrice: number,
    quantity?: number,
    message?: string
  ) => void;
  isLoading?: boolean;
}

export const SellerCounterOfferModal: React.FC<SellerCounterOfferModalProps> = ({
  visible,
  onClose,
  offer,
  onConfirm,
  isLoading = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQuantity, setCounterQuantity] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (visible && offer) {
      // Initialize with suggested values
      const suggestedPrice = (offer.offeredPricePerTon * 1.1).toFixed(2); // 10% higher
      setCounterPrice(suggestedPrice);
      setCounterQuantity(offer.quantity.toString());
      setCounterMessage('Thank you for your offer. I would like to propose the following terms:');

      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, offer]);

  if (!offer || !visible) return null;

  const calculateNewTotal = () => {
    const price = parseFloat(counterPrice) || 0;
    const quantity = parseFloat(counterQuantity) || 0;
    return price * quantity;
  };

  const calculatePriceDifference = () => {
    const newPrice = parseFloat(counterPrice) || 0;
    const originalPrice = offer.offeredPricePerTon;
    const difference = newPrice - originalPrice;
    const percentage = originalPrice > 0 ? (difference / originalPrice) * 100 : 0;
    return { difference, percentage };
  };

  const validateCounter = (): boolean => {
    const errors: string[] = [];
    const price = parseFloat(counterPrice);
    const quantity = parseFloat(counterQuantity);

    if (!price || price <= 0) {
      errors.push('Please enter a valid counter price');
    }

    if (!quantity || quantity <= 0) {
      errors.push('Please enter a valid quantity');
    }

    if (price <= offer.offeredPricePerTon) {
      errors.push('Counter price should be higher than the original offer');
    }

    if (price > offer.offeredPricePerTon * 1.5) {
      errors.push('Counter price seems too high (more than 50% increase)');
    }

    if (quantity !== offer.quantity && Math.abs(quantity - offer.quantity) / offer.quantity > 0.2) {
      errors.push('Quantity change should not exceed 20% of original offer');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleConfirm = () => {
    if (!validateCounter()) {
      return;
    }

    Alert.alert(
      'Confirm Counter Offer',
      `Send counter offer of $${counterPrice}/ton for ${counterQuantity} tons?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            onConfirm(
              offer.negotiationId,
              parseFloat(counterPrice),
              parseFloat(counterQuantity),
              counterMessage.trim() || undefined
            );
          },
        },
      ]
    );
  };

  const handleClose = () => {
    onClose();
    setCounterPrice('');
    setCounterQuantity('');
    setCounterMessage('');
    setValidationErrors([]);
  };

  const priceDiff = calculatePriceDifference();
  const newTotal = calculateNewTotal();
  const newProfit = newTotal - (offer.totalValue - offer.estimatedProfit);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}
        className="justify-center items-center p-6"
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="bg-neutral-900 rounded-2xl w-full max-w-md border border-neutral-700"
        >
          {/* Header */}
          <View className="p-6 border-b border-neutral-700">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-white">Counter Offer</Text>
              <TouchableOpacity onPress={handleClose}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
            <Text className="text-neutral-400 mt-1">Propose your terms</Text>
          </View>

          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <View className="p-6">
              {/* Buyer Info */}
              <View className="bg-neutral-800 rounded-lg p-4 mb-4 border border-neutral-700">
                <View className="flex-row items-center mb-3">
                  <User color="#fb923c" size={20} />
                  <Text className="text-white font-semibold text-lg ml-2 flex-1">
                    {offer.buyer}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <MapPin size={14} color="#fb923c" />
                  <Text className="text-neutral-300 text-sm ml-2">
                    {offer.buyerFlag} {offer.buyerLocation}
                  </Text>
                </View>
              </View>

              {/* Original vs Counter Comparison */}
              <Card className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border-orange-500/30 mb-4">
                <CardContent className="p-4">
                  <Text className="text-orange-400 font-semibold mb-3">Offer Comparison</Text>

                  <View className="flex-row justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-neutral-400 text-xs">Their Offer</Text>
                      <Text className="text-white font-semibold">
                        ${offer.offeredPricePerTon}/ton
                      </Text>
                      <Text className="text-neutral-400 text-xs">{offer.quantity} tons</Text>
                    </View>
                    <View className="justify-center">
                      <MessageSquare size={20} color="#FB923C" />
                    </View>
                    <View className="flex-1 items-end">
                      <Text className="text-neutral-400 text-xs">Your Counter</Text>
                      <Text className="text-orange-400 font-semibold">
                        ${counterPrice || '0'}/ton
                      </Text>
                      <Text className="text-neutral-400 text-xs">{counterQuantity} tons</Text>
                    </View>
                  </View>

                  {priceDiff.percentage !== 0 && (
                    <View className="flex-row items-center justify-center bg-neutral-800/50 rounded-lg p-2">
                      {priceDiff.difference > 0 ? (
                        <TrendingUp size={16} color="#10B981" />
                      ) : (
                        <TrendingDown size={16} color="#EF4444" />
                      )}
                      <Text
                        className={`ml-2 text-sm font-semibold ${
                          priceDiff.difference > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {priceDiff.difference > 0 ? '+' : ''}${priceDiff.difference.toFixed(2)}(
                        {priceDiff.percentage.toFixed(1)}%)
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <View className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  {validationErrors.map((error, index) => (
                    <View key={index} className="flex-row items-start mb-1">
                      <Text className="text-red-400 text-sm">• {error}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Counter Price Input */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-2">Counter Price (per ton)</Text>
                <View className="flex-row items-center bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3">
                  <DollarSign size={20} color="#FB923C" />
                  <TextInput
                    value={counterPrice}
                    onChangeText={setCounterPrice}
                    placeholder={offer.offeredPricePerTon.toString()}
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-white"
                  />
                  <Text className="text-neutral-400">USD</Text>
                </View>
                <Text className="text-xs text-neutral-500 mt-1">
                  Original offer: ${offer.offeredPricePerTon}/ton
                </Text>
              </View>

              {/* Quantity Input */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-2">Quantity (tons)</Text>
                <View className="flex-row items-center bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-3">
                  <Package size={20} color="#FB923C" />
                  <TextInput
                    value={counterQuantity}
                    onChangeText={setCounterQuantity}
                    placeholder={offer.quantity.toString()}
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-white"
                  />
                  <Text className="text-neutral-400">tons</Text>
                </View>
              </View>

              {/* Profit Calculation */}
              <View className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <View className="flex-row items-center mb-2">
                  <Calculator color="#10B981" size={16} />
                  <Text className="text-green-400 font-semibold ml-2">Updated Calculation</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-green-300 text-sm">New Total Value</Text>
                  <Text className="text-green-400 font-bold">${newTotal.toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-green-300 text-sm">Estimated Profit</Text>
                  <Text className="text-green-400 font-bold">${newProfit.toLocaleString()}</Text>
                </View>
              </View>

              {/* Message Input */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-2">Message to Buyer</Text>
                <TextInput
                  value={counterMessage}
                  onChangeText={setCounterMessage}
                  placeholder="Explain your counter offer terms..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white"
                  textAlignVertical="top"
                />
              </View>

              {/* Negotiation Tips */}
              <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <View className="flex-row items-start">
                  <Info size={16} color="#3B82F6" />
                  <View className="ml-2 flex-1">
                    <Text className="text-blue-300 text-sm font-semibold mb-1">
                      Negotiation Tips:
                    </Text>
                    <Text className="text-blue-300 text-xs">
                      • Justify your counter with quality, freshness, or service value{'\n'}•
                      Consider market conditions and seasonal pricing{'\n'}• Be reasonable to
                      maintain the business relationship
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="p-6 border-t border-neutral-700">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleClose}
                className="flex-1 bg-neutral-700 rounded-lg py-3 items-center justify-center"
                disabled={isLoading}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                disabled={isLoading || !counterPrice || !counterQuantity}
                className={`flex-1 rounded-lg py-3 items-center justify-center ${
                  isLoading || !counterPrice || !counterQuantity
                    ? 'bg-neutral-600'
                    : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                }`}
                style={{
                  shadowColor: '#FB923C',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Send color="#FFFFFF" size={18} />
                  )}
                  <Text className="text-white font-bold ml-2">
                    {isLoading ? 'Sending...' : 'Send Counter'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
