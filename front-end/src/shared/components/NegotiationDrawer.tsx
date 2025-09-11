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
  MessageSquare,
  DollarSign,
  Package,
  Truck,
  Clock,
  Send,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react-native';

import { Offer, NegotiationOffer, DeliveryTerms } from '../types';

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
  const [selectedNegotiationType, setSelectedNegotiationType] = useState<'price' | 'quantity' | 'delivery' | 'comprehensive'>('price');
  
  // Form state
  const [counterPrice, setCounterPrice] = useState(offer?.pricePerUnit?.toString() || '');
  const [counterQuantity, setCounterQuantity] = useState(offer?.quantity?.toString() || '');
  const [deliveryDays, setDeliveryDays] = useState(offer?.deliveryTerms?.deliveryTime?.toString() || '');
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

  const calculateQuantityDifference = () => {
    const original = offer?.quantity || 0;
    const counter = parseFloat(counterQuantity) || 0;
    const difference = counter - original;
    const percentageChange = original > 0 ? (difference / original) * 100 : 0;
    
    return { difference, percentageChange, isIncrease: difference > 0 };
  };

  const calculateDeliveryDifference = () => {
    const original = offer?.deliveryTerms?.deliveryTime || 0;
    const counter = parseFloat(deliveryDays) || 0;
    const difference = counter - original;
    
    return { difference, isFaster: difference < 0 };
  };

  const validateForm = (): boolean => {
    if (selectedNegotiationType === 'price' || selectedNegotiationType === 'comprehensive') {
      if (!counterPrice || parseFloat(counterPrice) <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid price');
        return false;
      }
    }
    
    if (selectedNegotiationType === 'quantity' || selectedNegotiationType === 'comprehensive') {
      if (!counterQuantity || parseFloat(counterQuantity) <= 0) {
        Alert.alert('Validation Error', 'Please enter a valid quantity');
        return false;
      }
    }
    
    if (selectedNegotiationType === 'delivery' || selectedNegotiationType === 'comprehensive') {
      if (!deliveryDays || parseFloat(deliveryDays) <= 0) {
        Alert.alert('Validation Error', 'Please enter valid delivery days');
        return false;
      }
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
      type: selectedNegotiationType,
      message: message.trim(),
      validUntil: new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    };

    if (selectedNegotiationType === 'price' || selectedNegotiationType === 'comprehensive') {
      negotiation.pricePerUnit = parseFloat(counterPrice);
    }

    if (selectedNegotiationType === 'quantity' || selectedNegotiationType === 'comprehensive') {
      negotiation.quantity = parseFloat(counterQuantity);
    }

    if (selectedNegotiationType === 'delivery' || selectedNegotiationType === 'comprehensive') {
      negotiation.deliveryTerms = {
        ...offer.deliveryTerms,
        deliveryTime: parseFloat(deliveryDays),
      } as DeliveryTerms;
    }

    onSubmit(negotiation);
  };

  const priceDiff = calculatePriceDifference();
  const quantityDiff = calculateQuantityDifference();
  const deliveryDiff = calculateDeliveryDifference();

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
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            }],
          }}
          className="bg-neutral-900 rounded-t-3xl"
        >
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-neutral-700">
              <TouchableOpacity onPress={handleClose}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">Counter Offer</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="p-6">
                {/* Original Offer Summary */}
                <View className="bg-neutral-800 rounded-lg p-4 mb-6 border border-neutral-700">
                  <Text className="text-white font-semibold mb-3">Original Offer</Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-neutral-400">Price per unit</Text>
                      <Text className="text-white">€{offer?.pricePerUnit?.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-neutral-400">Quantity</Text>
                      <Text className="text-white">{offer?.quantity} {offer?.unit}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-neutral-400">Delivery</Text>
                      <Text className="text-white">{offer?.deliveryTerms?.deliveryTime} days</Text>
                    </View>
                  </View>
                </View>

                {/* Negotiation Type Selector */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-3">What would you like to negotiate?</Text>
                  <View className="space-y-3">
                    <TouchableOpacity
                      onPress={() => setSelectedNegotiationType('price')}
                      className={`p-4 rounded-lg border flex-row items-center ${
                        selectedNegotiationType === 'price' 
                          ? 'bg-blue-500/20 border-blue-500' 
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                    >
                      <DollarSign size={20} color={selectedNegotiationType === 'price' ? '#3B82F6' : '#9CA3AF'} />
                      <Text className={`ml-3 font-medium ${
                        selectedNegotiationType === 'price' ? 'text-blue-400' : 'text-neutral-300'
                      }`}>
                        Price Only
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedNegotiationType('quantity')}
                      className={`p-4 rounded-lg border flex-row items-center ${
                        selectedNegotiationType === 'quantity' 
                          ? 'bg-blue-500/20 border-blue-500' 
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                    >
                      <Package size={20} color={selectedNegotiationType === 'quantity' ? '#3B82F6' : '#9CA3AF'} />
                      <Text className={`ml-3 font-medium ${
                        selectedNegotiationType === 'quantity' ? 'text-blue-400' : 'text-neutral-300'
                      }`}>
                        Quantity Only
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedNegotiationType('delivery')}
                      className={`p-4 rounded-lg border flex-row items-center ${
                        selectedNegotiationType === 'delivery' 
                          ? 'bg-blue-500/20 border-blue-500' 
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                    >
                      <Truck size={20} color={selectedNegotiationType === 'delivery' ? '#3B82F6' : '#9CA3AF'} />
                      <Text className={`ml-3 font-medium ${
                        selectedNegotiationType === 'delivery' ? 'text-blue-400' : 'text-neutral-300'
                      }`}>
                        Delivery Terms
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedNegotiationType('comprehensive')}
                      className={`p-4 rounded-lg border flex-row items-center ${
                        selectedNegotiationType === 'comprehensive' 
                          ? 'bg-blue-500/20 border-blue-500' 
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                    >
                      <ArrowUpDown size={20} color={selectedNegotiationType === 'comprehensive' ? '#3B82F6' : '#9CA3AF'} />
                      <Text className={`ml-3 font-medium ${
                        selectedNegotiationType === 'comprehensive' ? 'text-blue-400' : 'text-neutral-300'
                      }`}>
                        Comprehensive Negotiation
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price Negotiation */}
                {(selectedNegotiationType === 'price' || selectedNegotiationType === 'comprehensive') && (
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-3">Your Counter Price</Text>
                    <View className="bg-neutral-800 rounded-lg border border-neutral-700">
                      <View className="p-4">
                        <View className="flex-row items-center">
                          <Text className="text-neutral-300 text-lg">€</Text>
                          <TextInput
                            value={counterPrice}
                            onChangeText={setCounterPrice}
                            placeholder="0.00"
                            placeholderTextColor="#6B7280"
                            className="text-white text-xl font-semibold ml-2 flex-1"
                            keyboardType="decimal-pad"
                          />
                          <Text className="text-neutral-400">per {offer?.unit}</Text>
                        </View>
                      </View>
                      {priceDiff.difference !== 0 && (
                        <View className={`px-4 pb-3 flex-row items-center ${
                          priceDiff.isIncrease ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {priceDiff.isIncrease ? (
                            <TrendingUp size={16} color="#EF4444" />
                          ) : (
                            <TrendingDown size={16} color="#10B981" />
                          )}
                          <Text className={`ml-2 text-sm ${
                            priceDiff.isIncrease ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {priceDiff.isIncrease ? '+' : ''}€{Math.abs(priceDiff.difference).toFixed(2)} 
                            ({priceDiff.isIncrease ? '+' : ''}{priceDiff.percentageChange.toFixed(1)}%)
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Quantity Negotiation */}
                {(selectedNegotiationType === 'quantity' || selectedNegotiationType === 'comprehensive') && (
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-3">Your Counter Quantity</Text>
                    <View className="bg-neutral-800 rounded-lg border border-neutral-700">
                      <View className="p-4">
                        <View className="flex-row items-center">
                          <TextInput
                            value={counterQuantity}
                            onChangeText={setCounterQuantity}
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            className="text-white text-xl font-semibold flex-1"
                            keyboardType="numeric"
                          />
                          <Text className="text-neutral-400 ml-2">{offer?.unit}</Text>
                        </View>
                      </View>
                      {quantityDiff.difference !== 0 && (
                        <View className={`px-4 pb-3 flex-row items-center`}>
                          {quantityDiff.isIncrease ? (
                            <TrendingUp size={16} color="#3B82F6" />
                          ) : (
                            <TrendingDown size={16} color="#FBBF24" />
                          )}
                          <Text className={`ml-2 text-sm ${
                            quantityDiff.isIncrease ? 'text-blue-400' : 'text-yellow-400'
                          }`}>
                            {quantityDiff.isIncrease ? '+' : ''}{quantityDiff.difference} {offer?.unit} 
                            ({quantityDiff.isIncrease ? '+' : ''}{quantityDiff.percentageChange.toFixed(1)}%)
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Delivery Negotiation */}
                {(selectedNegotiationType === 'delivery' || selectedNegotiationType === 'comprehensive') && (
                  <View className="mb-6">
                    <Text className="text-white font-semibold mb-3">Delivery Timeline</Text>
                    <View className="bg-neutral-800 rounded-lg border border-neutral-700">
                      <View className="p-4">
                        <View className="flex-row items-center">
                          <TextInput
                            value={deliveryDays}
                            onChangeText={setDeliveryDays}
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            className="text-white text-xl font-semibold flex-1"
                            keyboardType="numeric"
                          />
                          <Text className="text-neutral-400 ml-2">days</Text>
                        </View>
                      </View>
                      {deliveryDiff.difference !== 0 && (
                        <View className={`px-4 pb-3 flex-row items-center`}>
                          <Clock size={16} color={deliveryDiff.isFaster ? '#10B981' : '#EF4444'} />
                          <Text className={`ml-2 text-sm ${
                            deliveryDiff.isFaster ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {Math.abs(deliveryDiff.difference)} days {deliveryDiff.isFaster ? 'faster' : 'slower'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Message */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-3">Message to Seller</Text>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Explain your counter-offer and reasoning..."
                    placeholderTextColor="#6B7280"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-white min-h-24"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Valid Until */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-3">Counter-offer Valid For</Text>
                  <View className="flex-row gap-3">
                    {['3', '7', '14'].map((days) => (
                      <TouchableOpacity
                        key={days}
                        onPress={() => setValidDays(days)}
                        className={`flex-1 p-3 rounded-lg border ${
                          validDays === days
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-neutral-800 border-neutral-700'
                        }`}
                      >
                        <Text className={`text-center font-medium ${
                          validDays === days ? 'text-blue-400' : 'text-neutral-300'
                        }`}>
                          {days} days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Important Notice */}
                <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <View className="flex-row items-start">
                    <Info size={16} color="#3B82F6" />
                    <Text className="text-blue-300 text-sm ml-2 flex-1">
                      Counter-offers are binding once accepted. Make sure your terms are realistic and fair 
                      to increase chances of acceptance.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="p-6 border-t border-neutral-700 bg-neutral-900">
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-neutral-700 rounded-lg py-4 items-center justify-center"
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg py-4 items-center justify-center flex-row"
                  style={{
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Send size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">
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