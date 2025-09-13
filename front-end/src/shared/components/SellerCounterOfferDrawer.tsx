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
  Truck,
  Calendar,
  MessageSquare,
} from 'lucide-react-native';

import { Badge } from './Badge';

interface BuyerOffer {
  id: string;
  buyer: {
    id: string;
    name: string;
    company?: string;
    location: {
      city: string;
      state?: string;
      country: string;
    };
    rating: number;
    reviewCount: number;
    verified: boolean;
    avatar?: string;
  };
  requestedQuantity: number;
  offeredPrice: number;
  unit: string;
  currency: string;
  deliveryRequirements: {
    location: string;
    timeframe: string;
    method?: string;
  };
  specifications?: Array<{
    name: string;
    requirement: string;
    matches: boolean;
  }>;
  matchScore: number;
  totalValue: number;
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  createdAt: string;
}

interface SellerCounterOffer {
  originalOfferId: string;
  type: 'price' | 'quantity' | 'terms' | 'combined';
  pricePerUnit?: number;
  quantity?: number;
  deliveryTerms?: string;
  deliveryDays?: number;
  message: string;
  validUntil: string;
  status: 'pending';
}

interface SellerCounterOfferDrawerProps {
  visible: boolean;
  onClose: () => void;
  buyerOffer: BuyerOffer;
  sellerProduct: any;
  onSubmit: (counterOffer: Partial<SellerCounterOffer>) => void;
  isLoading?: boolean;
}

export const SellerCounterOfferDrawer: React.FC<SellerCounterOfferDrawerProps> = ({
  visible,
  onClose,
  buyerOffer,
  sellerProduct,
  onSubmit,
  isLoading = false,
}) => {
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Form state
  const [counterPrice, setCounterPrice] = useState(buyerOffer?.offeredPrice?.toString() || '');
  const [counterQuantity, setCounterQuantity] = useState(buyerOffer?.requestedQuantity?.toString() || '');
  const [deliveryDays, setDeliveryDays] = useState('14');
  const [deliveryTerms, setDeliveryTerms] = useState('FOB');
  const [message, setMessage] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [negotiationType, setNegotiationType] = useState<'price' | 'quantity' | 'terms' | 'combined'>('price');

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
    const original = buyerOffer?.offeredPrice || 0;
    const counter = parseFloat(counterPrice) || 0;
    const difference = counter - original;
    const percentageChange = original > 0 ? (difference / original) * 100 : 0;
    
    return { difference, percentageChange, isIncrease: difference > 0 };
  };

  const calculateQuantityDifference = () => {
    const original = buyerOffer?.requestedQuantity || 0;
    const counter = parseFloat(counterQuantity) || 0;
    const difference = counter - original;
    const percentageChange = original > 0 ? (difference / original) * 100 : 0;
    
    return { difference, percentageChange, isIncrease: difference > 0 };
  };

  const calculateTotalValue = () => {
    const price = parseFloat(counterPrice) || 0;
    const quantity = parseFloat(counterQuantity) || 0;
    return price * quantity;
  };

  const calculateProfitMargin = () => {
    const counterPriceNum = parseFloat(counterPrice) || 0;
    const marketMin = sellerProduct?.priceRangeMin || 0;
    
    if (marketMin > 0 && counterPriceNum > 0) {
      const margin = counterPriceNum - marketMin;
      const marginPercentage = (margin / marketMin) * 100;
      return { margin, marginPercentage, isProfitable: margin > 0 };
    }
    
    return { margin: 0, marginPercentage: 0, isProfitable: false };
  };

  const validateForm = (): boolean => {
    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid counter price');
      return false;
    }
    
    if (!counterQuantity || parseFloat(counterQuantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return false;
    }
    
    const counterQuantityNum = parseFloat(counterQuantity);
    const availableQuantity = sellerProduct?.quantity || 0;
    
    if (counterQuantityNum > availableQuantity) {
      Alert.alert('Validation Error', `Quantity cannot exceed your available stock (${availableQuantity} ${buyerOffer.unit})`);
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

    const counterOffer: Partial<SellerCounterOffer> = {
      originalOfferId: buyerOffer.id,
      type: negotiationType,
      message: message.trim(),
      pricePerUnit: parseFloat(counterPrice),
      quantity: parseFloat(counterQuantity),
      deliveryDays: parseInt(deliveryDays),
      deliveryTerms,
      validUntil: new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    };

    onSubmit(counterOffer);
  };

  const priceDiff = calculatePriceDifference();
  const quantityDiff = calculateQuantityDifference();
  const totalValue = calculateTotalValue();
  const profitMargin = calculateProfitMargin();

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
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            }],
          }}
          className="bg-gradient-to-b from-neutral-900 to-black rounded-t-3xl"
        >
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-neutral-700/50">
              <TouchableOpacity 
                onPress={handleClose}
                className="p-2 -m-2 bg-neutral-800/50 rounded-lg border border-neutral-700/50"
              >
                <X color="#9CA3AF" size={20} />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-xl font-bold text-white">Counter Offer</Text>
                <Text className="text-sm text-neutral-400 mt-1">Negotiate terms with buyer</Text>
              </View>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="p-6">
                {/* Buyer's Original Offer */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-indigo-600/20 rounded-xl items-center justify-center mr-3 border border-blue-400/30">
                      <Target size={20} color="#3B82F6" />
                    </View>
                    <Text className="text-blue-400 font-bold text-xl">Buyer's Offer</Text>
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
                    <View className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/10" />
                    
                    <View className="relative z-10">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-blue-200 font-medium text-base">Offered Price</Text>
                        <View className="flex-row items-center">
                          <Text className="text-blue-300 font-black text-2xl">€{buyerOffer?.offeredPrice?.toFixed(2) || '0.00'}</Text>
                          <Text className="text-blue-400/70 ml-2 text-sm">/{buyerOffer?.unit?.toLowerCase() || 'unit'}</Text>
                        </View>
                      </View>
                      <View className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent mb-4" />
                      <View className="flex-row justify-between items-center">
                        <Text className="text-blue-200 font-medium text-base">Requested Quantity</Text>
                        <Text className="text-white font-bold text-lg">{buyerOffer?.requestedQuantity || 0} {buyerOffer?.unit?.toLowerCase() || 'units'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Your Product Info */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-emerald-600/20 rounded-xl items-center justify-center mr-3 border border-green-400/30">
                      <Building2 size={20} color="#10B981" />
                    </View>
                    <Text className="text-green-400 font-bold text-xl">Your Product</Text>
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
                    <View className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10" />
                    
                    <View className="relative z-10">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-green-200 font-medium text-base">Available Stock</Text>
                        <Text className="text-white font-bold text-lg">{sellerProduct?.quantity || 0} {buyerOffer?.unit?.toLowerCase() || 'units'}</Text>
                      </View>
                      <View className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent mb-4" />
                      <View className="flex-row justify-between items-center">
                        <Text className="text-green-200 font-medium text-base">Market Range</Text>
                        <View className="flex-row items-center">
                          <Text className="text-green-300 font-black text-lg">
                            €{sellerProduct?.priceRangeMin || 0}-{sellerProduct?.priceRangeMax || 0}
                          </Text>
                          <Text className="text-green-400/70 ml-2 text-sm">/{buyerOffer?.unit?.toLowerCase() || 'unit'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Negotiation Type Selection */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-3">What would you like to negotiate?</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { key: 'price', label: 'Price Only', icon: DollarSign },
                      { key: 'quantity', label: 'Quantity', icon: Package },
                      { key: 'terms', label: 'Delivery Terms', icon: Truck },
                      { key: 'combined', label: 'Multiple Terms', icon: ArrowUpDown },
                    ].map(({ key, label, icon: Icon }) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setNegotiationType(key as any)}
                        className={`flex-row items-center px-4 py-3 rounded-xl border ${
                          negotiationType === key
                            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/10 border-yellow-500/50'
                            : 'bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 border-neutral-600/50'
                        }`}
                      >
                        <Icon size={16} color={negotiationType === key ? '#F59E0B' : '#9CA3AF'} />
                        <Text className={`ml-2 font-medium ${
                          negotiationType === key ? 'text-yellow-400' : 'text-neutral-300'
                        }`}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Counter Offer Form */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-gradient-to-br from-yellow-500/30 to-orange-600/20 rounded-xl items-center justify-center mr-3 border border-yellow-400/30">
                      <Calculator size={20} color="#F59E0B" />
                    </View>
                    <Text className="text-yellow-400 font-bold text-xl">Your Counter Offer</Text>
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
                    <View className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-600/10" />
                    
                    <View className="relative z-10 p-6">
                      {/* Price Input */}
                      {(negotiationType === 'price' || negotiationType === 'combined') && (
                        <View className="mb-6">
                          <Text className="text-yellow-300 font-semibold mb-3">Counter Price</Text>
                          <View className="bg-black/20 rounded-xl p-4 border border-yellow-400/20">
                            <View className="flex-row items-center justify-center">
                              <Text className="text-yellow-300 text-2xl font-black">€</Text>
                              <TextInput
                                value={counterPrice}
                                onChangeText={setCounterPrice}
                                placeholder="0.00"
                                placeholderTextColor="#A16207"
                                className="text-white text-2xl font-black ml-3 flex-1 text-center"
                                keyboardType="decimal-pad"
                              />
                              <Text className="text-yellow-400/80 text-lg font-medium">/{buyerOffer?.unit?.toLowerCase() || 'unit'}</Text>
                            </View>
                          </View>
                          
                          {/* Real-time Price Analysis */}
                          {priceDiff.difference !== 0 && (
                            <View className="mt-4 bg-black/30 rounded-xl p-4 border border-yellow-400/20">
                              <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center">
                                  {priceDiff.isIncrease ? (
                                    <TrendingUp size={16} color="#10B981" />
                                  ) : (
                                    <TrendingDown size={16} color="#EF4444" />
                                  )}
                                  <Text className={`ml-2 text-sm font-bold ${
                                    priceDiff.isIncrease ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {priceDiff.isIncrease ? '+' : ''}€{Math.abs(priceDiff.difference).toFixed(2)} per unit
                                  </Text>
                                </View>
                                <Text className={`text-sm font-bold ${
                                  priceDiff.isIncrease ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  ({priceDiff.isIncrease ? '+' : ''}{priceDiff.percentageChange.toFixed(1)}%)
                                </Text>
                              </View>
                              
                              {/* Profit Margin Analysis */}
                              {profitMargin.margin !== 0 && (
                                <View className="border-t border-yellow-400/20 pt-3 mt-3">
                                  <View className="flex-row justify-between items-center">
                                    <Text className="text-yellow-200 text-sm">Profit Margin:</Text>
                                    <Text className={`text-sm font-bold ${
                                      profitMargin.isProfitable ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      €{Math.abs(profitMargin.margin).toFixed(2)} ({profitMargin.marginPercentage.toFixed(1)}%)
                                    </Text>
                                  </View>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      )}

                      {/* Quantity Input */}
                      {(negotiationType === 'quantity' || negotiationType === 'combined') && (
                        <View className="mb-6">
                          <Text className="text-yellow-300 font-semibold mb-3">Available Quantity</Text>
                          <View className="bg-black/20 rounded-xl p-4 border border-yellow-400/20">
                            <View className="flex-row items-center justify-center">
                              <TextInput
                                value={counterQuantity}
                                onChangeText={setCounterQuantity}
                                placeholder="0"
                                placeholderTextColor="#A16207"
                                className="text-white text-2xl font-black flex-1 text-center"
                                keyboardType="numeric"
                              />
                              <Text className="text-yellow-400/80 text-lg font-medium ml-3">{buyerOffer?.unit?.toLowerCase() || 'units'}</Text>
                            </View>
                          </View>
                          
                          {/* Quantity Analysis */}
                          {quantityDiff.difference !== 0 && (
                            <View className="mt-4 bg-black/30 rounded-xl p-4 border border-yellow-400/20">
                              <View className="flex-row items-center justify-between">
                                <Text className="text-yellow-200 text-sm">Quantity Change:</Text>
                                <Text className={`text-sm font-bold ${
                                  quantityDiff.isIncrease ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {quantityDiff.isIncrease ? '+' : ''}{Math.abs(quantityDiff.difference)} {buyerOffer?.unit?.toLowerCase()}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Delivery Terms */}
                      {(negotiationType === 'terms' || negotiationType === 'combined') && (
                        <View className="mb-6">
                          <Text className="text-yellow-300 font-semibold mb-3">Delivery Terms</Text>
                          <View className="space-y-4">
                            <View>
                              <Text className="text-yellow-200 text-sm mb-2">Delivery Days</Text>
                              <View className="flex-row gap-2">
                                {['7', '14', '21', '30'].map((days) => (
                                  <TouchableOpacity
                                    key={days}
                                    onPress={() => setDeliveryDays(days)}
                                    className={`flex-1 p-3 rounded-lg border ${
                                      deliveryDays === days
                                        ? 'bg-blue-500/20 border-blue-500/50'
                                        : 'bg-neutral-800/50 border-neutral-600/50'
                                    }`}
                                  >
                                    <Text className={`text-center font-medium ${
                                      deliveryDays === days ? 'text-blue-400' : 'text-neutral-300'
                                    }`}>
                                      {days} days
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                            
                            <View>
                              <Text className="text-yellow-200 text-sm mb-2">Terms</Text>
                              <View className="flex-row gap-2">
                                {['FOB', 'CIF', 'EXW', 'DDP'].map((term) => (
                                  <TouchableOpacity
                                    key={term}
                                    onPress={() => setDeliveryTerms(term)}
                                    className={`flex-1 p-3 rounded-lg border ${
                                      deliveryTerms === term
                                        ? 'bg-green-500/20 border-green-500/50'
                                        : 'bg-neutral-800/50 border-neutral-600/50'
                                    }`}
                                  >
                                    <Text className={`text-center text-sm font-medium ${
                                      deliveryTerms === term ? 'text-green-400' : 'text-neutral-300'
                                    }`}>
                                      {term}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Total Value Display */}
                      <View className="bg-black/30 rounded-xl p-4 border border-yellow-400/20">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-yellow-200 font-medium">Total Contract Value</Text>
                          <Text className="text-yellow-400 font-bold text-xl">
                            €{totalValue.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Message to Buyer */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-3">Message to Buyer</Text>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Explain your counter-offer (e.g., quality standards, delivery logistics, volume pricing, etc.)"
                    placeholderTextColor="#6B7280"
                    className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-neutral-700/50 rounded-xl p-4 text-white min-h-24"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Offer Validity */}
                <View className="mb-6">
                  <Text className="text-white font-semibold mb-3">Counter-offer Valid For</Text>
                  <View className="flex-row gap-3">
                    {['3', '7', '14'].map((days) => (
                      <TouchableOpacity
                        key={days}
                        onPress={() => setValidDays(days)}
                        className={`flex-1 p-4 rounded-xl border ${
                          validDays === days
                            ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border-blue-500/50'
                            : 'bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 border-neutral-600/50'
                        }`}
                      >
                        <Text className={`text-center font-semibold ${
                          validDays === days ? 'text-blue-400' : 'text-neutral-300'
                        }`}>
                          {days} days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Pro Tips */}
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
                  <View className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/15 to-indigo-500/10" />
                  
                  <View className="relative z-10">
                    <View className="flex-row items-center mb-4">
                      <View className="w-8 h-8 bg-purple-500/30 rounded-lg items-center justify-center mr-3">
                        <Info size={18} color="#A855F7" />
                      </View>
                      <Text className="text-purple-300 font-bold text-lg">Seller Tips</Text>
                    </View>
                    <View className="space-y-3">
                      <View className="flex-row items-start">
                        <Text className="text-purple-400 font-bold mr-2">•</Text>
                        <Text className="text-purple-200 text-sm flex-1">Consider volume discounts for larger quantities</Text>
                      </View>
                      <View className="flex-row items-start">
                        <Text className="text-purple-400 font-bold mr-2">•</Text>
                        <Text className="text-purple-200 text-sm flex-1">Flexible delivery terms can increase acceptance rates</Text>
                      </View>
                      <View className="flex-row items-start">
                        <Text className="text-purple-400 font-bold mr-2">•</Text>
                        <Text className="text-purple-200 text-sm flex-1">Clear communication builds buyer confidence</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="p-6 border-t border-neutral-700/50 bg-gradient-to-b from-neutral-900/80 to-black">
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-neutral-600/50"
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className="flex-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl py-4 items-center justify-center flex-row"
                  style={{
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
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