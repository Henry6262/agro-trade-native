import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  DollarSign,
  Package,
  Send,
  TrendingUp,
  TrendingDown,
  Info,
  Target,
  Building2,
  Calculator,
  ArrowUpDown,
} from 'lucide-react-native';

import { Offer, NegotiationOffer } from '../types';
import { Badge } from './Badge';

interface NegotiationDrawerProps {
  visible: boolean;
  onClose: () => void;
  offer: Offer;
  buyerRequest: any;
  onSubmit: (negotiation: Partial<NegotiationOffer>) => void;
  isLoading?: boolean;
}

export const NegotiationDrawer: React.FC<NegotiationDrawerProps> = ({
  visible,
  onClose,
  offer,
  buyerRequest,
  onSubmit,
  isLoading = false,
}) => {
  const [slideAnim] = useState(new Animated.Value(0));
  // Form state - simplified to price only
  const [counterPrice, setCounterPrice] = useState(offer?.pricePerUnit?.toString() || '');
  const [message, setMessage] = useState('');
  const [validDays, setValidDays] = useState('7');

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const calculatePriceDifference = () => {
    const original = offer?.pricePerUnit || 0;
    const counter = parseFloat(counterPrice) || 0;
    const difference = counter - original;
    const percentageChange = original > 0 ? (difference / original) * 100 : 0;

    return { difference, percentageChange, isIncrease: difference > 0 };
  };

  const calculateTotalSavings = () => {
    const originalPrice = offer?.pricePerUnit || 0;
    const counterPriceNum = parseFloat(counterPrice) || 0;
    const quantity = offer?.quantity || 0;

    if (originalPrice > 0 && counterPriceNum > 0 && quantity > 0) {
      const priceDifference = originalPrice - counterPriceNum;
      const totalSavings = priceDifference * quantity;
      return { priceDifference, totalSavings, hasSavings: priceDifference > 0 };
    }

    return { priceDifference: 0, totalSavings: 0, hasSavings: false };
  };

  const validateForm = (): boolean => {
    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid counter price');
      return false;
    }

    const counterPriceNum = parseFloat(counterPrice);
    const originalPrice = offer?.pricePerUnit || 0;

    if (counterPriceNum === originalPrice) {
      Alert.alert(
        'Validation Error',
        'Your counter price must be different from the original offer'
      );
      return false;
    }

    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please add a message explaining your counter-offer');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const negotiation: Partial<NegotiationOffer> = {
      originalOfferId: offer.id,
      requestId: offer.requestId,
      type: 'price',
      message: message.trim(),
      pricePerUnit: parseFloat(counterPrice),
      validUntil: new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    };

    onSubmit(negotiation);
  };

  const priceDiff = calculatePriceDifference();
  const savings = calculateTotalSavings();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Animated.View
          style={{
            flex: 1,
            marginTop: 80,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          }}
          className="bg-gradient-to-b from-neutral-900 to-black rounded-t-3xl"
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200/50">
              <TouchableOpacity
                onPress={handleClose}
                className="p-2 -m-2 bg-gray-50/50 rounded-lg border border-gray-200/50"
              >
                <X color="#9CA3AF" size={20} />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">Price Negotiation</Text>
                <Text className="text-sm text-gray-500 mt-1">Make your counter-offer</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="p-6">
                {/* Buyer's Original Requirements - Enhanced Gradient Card */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-indigo-600/20 rounded-xl items-center justify-center mr-3 border border-blue-400/30">
                      <Target size={20} color="#3B82F6" />
                    </View>
                    <Text className="text-blue-400 font-bold text-xl">Your Requirements</Text>
                  </View>
                  <View
                    className="rounded-2xl p-6 border border-blue-500/40"
                    style={{
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    {/* Gradient Background */}
                    <View className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/10" />

                    <View className="relative z-10">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-blue-200 font-medium text-base">Max Budget</Text>
                        <View className="flex-row items-center">
                          <Text className="text-blue-300 font-black text-2xl">
                            €{buyerRequest?.maxPricePerUnit || 'N/A'}
                          </Text>
                          <Text className="text-blue-400/70 ml-2 text-sm">
                            /{offer?.unit?.toLowerCase() || 'unit'}
                          </Text>
                        </View>
                      </View>
                      <View className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent mb-4" />
                      <View className="flex-row justify-between items-center">
                        <Text className="text-blue-200 font-medium text-base">
                          Required Quantity
                        </Text>
                        <Text className="text-gray-900 font-bold text-lg">
                          {buyerRequest?.quantity || 'N/A'} {offer?.unit?.toLowerCase() || 'units'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Seller's Current Offer - Enhanced Gradient Card */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-emerald-600/20 rounded-xl items-center justify-center mr-3 border border-green-400/30">
                      <Building2 size={20} color="#10B981" />
                    </View>
                    <Text className="text-green-400 font-bold text-xl">Seller&apos;s Offer</Text>
                    <Badge className="bg-green-500/30 border-green-400/50 text-green-200 text-xs ml-3 px-3 py-1">
                      Current
                    </Badge>
                  </View>
                  <View
                    className="rounded-2xl p-6 border border-green-500/40"
                    style={{
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    {/* Gradient Background */}
                    <View className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10" />

                    <View className="relative z-10">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-green-200 font-medium text-base">Offered Price</Text>
                        <View className="flex-row items-center">
                          <Text className="text-green-300 font-black text-2xl">
                            €{offer?.pricePerUnit?.toFixed(2) || '0.00'}
                          </Text>
                          <Text className="text-green-400/70 ml-2 text-sm">
                            /{offer?.unit?.toLowerCase() || 'unit'}
                          </Text>
                        </View>
                      </View>
                      <View className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent mb-4" />
                      <View className="flex-row justify-between items-center">
                        <Text className="text-green-200 font-medium text-base">
                          Available Quantity
                        </Text>
                        <Text className="text-gray-900 font-bold text-lg">
                          {offer?.quantity || 0} {offer?.unit?.toLowerCase() || 'units'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Price Negotiation Section - Enhanced Visual Comparison */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-gradient-to-br from-yellow-500/30 to-orange-600/20 rounded-xl items-center justify-center mr-3 border border-yellow-400/30">
                      <Calculator size={20} color="#F59E0B" />
                    </View>
                    <Text className="text-yellow-400 font-bold text-xl">Your Counter Price</Text>
                  </View>

                  <View
                    className="rounded-2xl border border-yellow-500/40 overflow-hidden"
                    style={{
                      shadowColor: '#F59E0B',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    {/* Gradient Background */}
                    <View className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-600/10" />

                    {/* Price Input Section */}
                    <View className="relative z-10 p-6">
                      <View className="bg-white/20 rounded-xl p-4 border border-yellow-400/20">
                        <View className="flex-row items-center justify-center">
                          <Text className="text-yellow-300 text-3xl font-black">€</Text>
                          <TextInput
                            value={counterPrice}
                            onChangeText={setCounterPrice}
                            placeholder="0.00"
                            placeholderTextColor="#A16207"
                            className="text-gray-900 text-3xl font-black ml-3 flex-1 text-center"
                            keyboardType="decimal-pad"
                          />
                          <Text className="text-yellow-400/80 text-lg font-medium">
                            /{offer?.unit?.toLowerCase() || 'unit'}
                          </Text>
                        </View>
                      </View>

                      {/* Real-time Price Difference Display */}
                      {priceDiff.difference !== 0 && (
                        <View className="mt-6">
                          {/* Visual Comparison Arrow */}
                          <View className="flex-row items-center justify-center mb-4">
                            <View className="flex-row items-center px-4 py-2 bg-white/30 rounded-full border border-yellow-400/30">
                              <Text className="text-green-300 font-bold text-lg">
                                €{offer?.pricePerUnit?.toFixed(2)}
                              </Text>
                              <View className="mx-3">
                                <ArrowUpDown size={16} color="#FBBF24" />
                              </View>
                              <Text className="text-yellow-300 font-bold text-lg">
                                €{parseFloat(counterPrice).toFixed(2)}
                              </Text>
                            </View>
                          </View>

                          {/* Difference Analysis */}
                          <View className="bg-white/30 rounded-xl p-4 border border-yellow-400/20">
                            <View className="flex-row items-center justify-between mb-3">
                              <View className="flex-row items-center">
                                {priceDiff.isIncrease ? (
                                  <TrendingUp size={20} color="#EF4444" />
                                ) : (
                                  <TrendingDown size={20} color="#10B981" />
                                )}
                                <Text
                                  className={`ml-2 text-base font-bold ${
                                    priceDiff.isIncrease ? 'text-red-400' : 'text-green-400'
                                  }`}
                                >
                                  {priceDiff.isIncrease ? '+' : ''}€
                                  {Math.abs(priceDiff.difference).toFixed(2)} per unit
                                </Text>
                              </View>
                              <Text
                                className={`text-base font-bold ${
                                  priceDiff.isIncrease ? 'text-red-400' : 'text-green-400'
                                }`}
                              >
                                ({priceDiff.isIncrease ? '+' : ''}
                                {priceDiff.percentageChange.toFixed(1)}%)
                              </Text>
                            </View>

                            {/* Total Impact Calculation */}
                            {savings.totalSavings !== 0 && offer?.quantity && (
                              <View className="border-t border-yellow-400/20 pt-3 mt-3">
                                <View className="flex-row justify-between items-center">
                                  <Text className="text-yellow-200 font-medium">Total Impact:</Text>
                                  <Text
                                    className={`text-lg font-black ${
                                      savings.hasSavings ? 'text-green-400' : 'text-red-400'
                                    }`}
                                  >
                                    {savings.hasSavings ? 'Save' : 'Cost'} €
                                    {Math.abs(savings.totalSavings).toLocaleString()}
                                  </Text>
                                </View>
                                <Text className="text-yellow-300/70 text-sm mt-1 text-center">
                                  Based on {offer.quantity.toLocaleString()}{' '}
                                  {offer.unit?.toLowerCase() || 'units'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Message to Seller */}
                <View className="mb-6">
                  <Text className="text-gray-900 font-semibold mb-3">Message to Seller</Text>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Explain your counter-offer reasoning (e.g., market conditions, volume discount, etc.)"
                    placeholderTextColor="#6B7280"
                    className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-gray-200/50 rounded-xl p-4 text-gray-900 min-h-24"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Offer Validity */}
                <View className="mb-6">
                  <Text className="text-gray-900 font-semibold mb-3">Counter-offer Valid For</Text>
                  <View className="flex-row gap-3">
                    {['3', '7', '14'].map((days) => (
                      <TouchableOpacity
                        key={days}
                        onPress={() => setValidDays(days)}
                        className={`flex-1 p-4 rounded-xl border ${
                          validDays === days
                            ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border-blue-500/50'
                            : 'bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 border-gray-200/50'
                        }`}
                      >
                        <Text
                          className={`text-center font-semibold ${
                            validDays === days ? 'text-blue-400' : 'text-gray-600'
                          }`}
                        >
                          {days} days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Enhanced Pro Tips */}
                <View
                  className="rounded-2xl p-6 border border-purple-500/40 mb-6"
                  style={{
                    shadowColor: '#A855F7',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {/* Gradient Background */}
                  <View className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/15 to-indigo-500/10" />

                  <View className="relative z-10">
                    <View className="flex-row items-center mb-4">
                      <View className="w-8 h-8 bg-purple-500/30 rounded-lg items-center justify-center mr-3">
                        <Info size={18} color="#A855F7" />
                      </View>
                      <Text className="text-purple-300 font-bold text-lg">Negotiation Tips</Text>
                    </View>
                    <View className="space-y-3">
                      <View className="flex-row items-start">
                        <Text className="text-purple-400 font-bold mr-2">•</Text>
                        <Text className="text-purple-200 text-sm flex-1">
                          Counter-offers become binding once accepted by the seller
                        </Text>
                      </View>
                      <View className="flex-row items-start">
                        <Text className="text-purple-400 font-bold mr-2">•</Text>
                        <Text className="text-purple-200 text-sm flex-1">
                          Research current market rates for better negotiation leverage
                        </Text>
                      </View>
                      <View className="flex-row items-start">
                        <Text className="text-purple-400 font-bold mr-2">•</Text>
                        <Text className="text-purple-200 text-sm flex-1">
                          Reasonable offers have higher acceptance rates
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="p-6 border-t border-gray-200/50 bg-gradient-to-b from-neutral-900/80 to-black">
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-gray-200/50"
                >
                  <Text className="text-gray-900 font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className="flex-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl py-4 items-center justify-center flex-row"
                  style={{
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Send size={18} color="#FFFFFF" />
                  <Text className="text-gray-900 font-bold ml-2">
                    {isLoading ? 'Sending...' : 'Send Counter-Offer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};
