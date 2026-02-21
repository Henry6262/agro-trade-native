import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  ArrowLeft,
  Filter,
  Search,
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
  Check,
  MessageSquare,
} from 'lucide-react-native';

import { Offer, NegotiationOffer } from '../types';
import { OfferCard } from './OfferCard';
import { BuyerRequestCard } from './BuyerRequestCard';
import { Badge } from './Badge';
import buyerService from '@services/buyerService';

interface UnifiedOffersDrawerProps {
  visible: boolean;
  onClose: () => void;
  offers: any[];
  productName: string;
  requestId: string;
  buyerRequest?: any;
}

type ViewType = 'list' | 'negotiate' | 'accept' | 'reject';

export const UnifiedOffersDrawer: React.FC<UnifiedOffersDrawerProps> = ({
  visible,
  onClose,
  offers,
  productName,
  requestId,
  buyerRequest,
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [contentAnim] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(false);

  // Negotiation form state
  const [counterPrice, setCounterPrice] = useState('');
  const [message, setMessage] = useState('');
  const [validDays, setValidDays] = useState('7');

  // Accept/Reject form state
  const [acceptNotes, setAcceptNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

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
      }).start(() => {
        // Reset state when drawer closes
        setCurrentView('list');
        setSelectedOffer(null);
        setCounterPrice('');
        setMessage('');
        setAcceptNotes('');
        setRejectReason('');
      });
    }
  }, [visible]);

  const animateViewChange = (newView: ViewType) => {
    Animated.sequence([
      Animated.timing(contentAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentView(newView);
  };

  const handleBack = () => {
    animateViewChange('list');
    setSelectedOffer(null);
  };

  const handleOfferAction = (action: 'accept' | 'reject' | 'negotiate', offer: Offer) => {
    setSelectedOffer(offer);
    setCounterPrice(offer.pricePerUnit.toString());
    animateViewChange(action === 'negotiate' ? 'negotiate' : action);
  };

  const transformOfferData = (rawOffer: any): Offer => {
    const seller = rawOffer.saleListing?.seller || rawOffer.seller;
    const sellerName = seller?.name || seller?.company?.name || 'Unknown Seller';

    return {
      id: rawOffer.id || `offer_${Math.random()}`,
      requestId: requestId,
      sellerId: seller?.id || 'unknown',
      seller: {
        id: seller?.id || 'unknown',
        name: sellerName,
        businessName: seller?.company?.name || seller?.businessName,
        location: {
          id: 'loc_1',
          address: rawOffer.originLocation || seller?.location || 'Unknown',
          city: seller?.city || 'Unknown',
          state: seller?.state || 'Unknown',
          country: seller?.country || 'Unknown',
          zipCode: seller?.zipCode || '00000',
        },
        rating: seller?.rating || 4.2,
        reviewCount: seller?.reviewCount || 15,
        verified: seller?.verified !== false,
        avatar:
          seller?.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=10B981&color=fff`,
      },
      productId: rawOffer.product?.id || rawOffer.saleListing?.product?.id || 'unknown',
      product: rawOffer.product || rawOffer.saleListing?.product || { name: productName },
      pricePerUnit: parseFloat(rawOffer.offeredPrice || rawOffer.pricePerUnit) || 0,
      currency: 'EUR',
      quantity: parseFloat(rawOffer.quantity) || 0,
      unit: rawOffer.unit || 'TON',
      specifications:
        rawOffer.specifications?.map((spec: any) => ({
          id: spec.id || `spec_${Math.random()}`,
          name: spec.name || 'Unknown Spec',
          value: spec.value || spec.valueText || spec.valueNumber || 'N/A',
          category: 'quality',
          matchesRequirement: spec.matchesRequirement !== false,
        })) || [],
      deliveryTerms: {
        deliveryTime: rawOffer.deliveryDays || parseInt(rawOffer.deliveryTerms) || 14,
        deliveryMethod: 'delivery',
        deliveryLocation: rawOffer.deliveryLocation || rawOffer.deliveryTerms,
      },
      validUntil:
        rawOffer.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      message: rawOffer.message,
      status: rawOffer.status?.toLowerCase() || 'pending',
      matchScore: rawOffer.matchScore || 85,
      createdAt: rawOffer.createdAt || new Date().toISOString(),
      updatedAt: rawOffer.updatedAt || new Date().toISOString(),
    };
  };

  const sortedOffers = React.useMemo(() => {
    const transformedOffers = offers.map(transformOfferData);
    return transformedOffers.sort((a, b) => b.matchScore - a.matchScore);
  }, [offers]);

  const calculatePriceDifference = () => {
    if (!selectedOffer) return { difference: 0, percentageChange: 0, isIncrease: false };
    const original = selectedOffer.pricePerUnit || 0;
    const counter = parseFloat(counterPrice) || 0;
    const difference = counter - original;
    const percentageChange = original > 0 ? (difference / original) * 100 : 0;
    return { difference, percentageChange, isIncrease: difference > 0 };
  };

  const handleSubmitNegotiation = async () => {
    if (!selectedOffer) return;

    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid counter price');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please add a message explaining your counter-offer');
      return;
    }

    setIsLoading(true);
    try {
      await buyerService.counterOffer(
        selectedOffer.id,
        parseFloat(counterPrice),
        selectedOffer.quantity
      );
      Alert.alert('Success', 'Your counter-offer has been sent to the seller!');
      handleBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to send counter-offer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAccept = async () => {
    if (!selectedOffer) return;

    setIsLoading(true);
    try {
      await buyerService.acceptOffer(selectedOffer.id);
      Alert.alert('Success', 'Offer accepted successfully!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept offer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReject = async () => {
    if (!selectedOffer) return;

    if (!rejectReason.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for rejection');
      return;
    }

    setIsLoading(true);
    try {
      await buyerService.rejectOffer(selectedOffer.id, rejectReason);
      Alert.alert('Offer Rejected', 'The seller has been notified of your decision.');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject offer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => {
    const getTitle = () => {
      switch (currentView) {
        case 'negotiate':
          return 'Price Negotiation';
        case 'accept':
          return 'Accept Offer';
        case 'reject':
          return 'Reject Offer';
        default:
          return `${sortedOffers.length} Available Offers`;
      }
    };

    const getSubtitle = () => {
      switch (currentView) {
        case 'negotiate':
          return 'Make your counter-offer';
        case 'accept':
          return 'Confirm your acceptance';
        case 'reject':
          return 'Provide rejection reason';
        default:
          return productName;
      }
    };

    return (
      <View className="flex-row justify-between items-center p-6 border-b border-neutral-700/50">
        <TouchableOpacity
          onPress={currentView === 'list' ? onClose : handleBack}
          className="p-2 -m-2 bg-neutral-800/50 rounded-lg border border-neutral-700/50"
        >
          {currentView === 'list' ? (
            <X color="#9CA3AF" size={20} />
          ) : (
            <ArrowLeft color="#9CA3AF" size={20} />
          )}
        </TouchableOpacity>
        <View className="items-center flex-1 mx-4">
          <Text className="text-xl font-bold text-white">{getTitle()}</Text>
          <Text className="text-sm text-neutral-400 mt-1">{getSubtitle()}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
    );
  };

  const renderListView = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* Buyer Request Reference */}
        {buyerRequest && <BuyerRequestCard buyerRequest={buyerRequest} className="mb-6" />}

        {/* Offers List */}
        {sortedOffers.length === 0 ? (
          <View className="py-12 items-center">
            <Package size={48} color="#6B7280" />
            <Text className="text-neutral-400 text-lg mt-4">No offers available yet</Text>
            <Text className="text-neutral-500 text-sm mt-2">Check back later for new offers</Text>
          </View>
        ) : (
          sortedOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              buyerRequest={buyerRequest}
              onAccept={(id) => handleOfferAction('accept', offer)}
              onReject={(id) => handleOfferAction('reject', offer)}
              onNegotiate={(id) => handleOfferAction('negotiate', offer)}
              isLoading={isLoading}
            />
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderNegotiationView = () => {
    if (!selectedOffer) return null;
    const priceDiff = calculatePriceDifference();

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Seller's Current Offer */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-emerald-600/20 rounded-xl items-center justify-center mr-3 border border-green-400/30">
                <Building2 size={20} color="#10B981" />
              </View>
              <Text className="text-green-400 font-bold text-xl">Current Offer</Text>
            </View>
            <View className="rounded-2xl p-6 border border-green-500/40 bg-gradient-to-br from-green-500/20 to-emerald-600/10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-green-200 font-medium text-base">Offered Price</Text>
                <View className="flex-row items-center">
                  <Text className="text-green-300 font-black text-2xl">
                    €{selectedOffer.pricePerUnit.toFixed(2)}
                  </Text>
                  <Text className="text-green-400/70 ml-2 text-sm">
                    /{selectedOffer.unit?.toLowerCase()}
                  </Text>
                </View>
              </View>
              <View className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent mb-4" />
              <View className="flex-row justify-between items-center">
                <Text className="text-green-200 font-medium text-base">Available Quantity</Text>
                <Text className="text-white font-bold text-lg">
                  {selectedOffer.quantity} {selectedOffer.unit?.toLowerCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Counter Price Input */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-gradient-to-br from-yellow-500/30 to-orange-600/20 rounded-xl items-center justify-center mr-3 border border-yellow-400/30">
                <Calculator size={20} color="#F59E0B" />
              </View>
              <Text className="text-yellow-400 font-bold text-xl">Your Counter Price</Text>
            </View>

            <View className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/20 to-orange-600/10 p-6">
              <View className="bg-black/20 rounded-xl p-4 border border-yellow-400/20">
                <View className="flex-row items-center justify-center">
                  <Text className="text-yellow-300 text-3xl font-black">€</Text>
                  <TextInput
                    value={counterPrice}
                    onChangeText={setCounterPrice}
                    placeholder="0.00"
                    placeholderTextColor="#A16207"
                    className="text-white text-3xl font-black ml-3 flex-1 text-center"
                    keyboardType="decimal-pad"
                  />
                  <Text className="text-yellow-400/80 text-lg font-medium">
                    /{selectedOffer.unit?.toLowerCase()}
                  </Text>
                </View>
              </View>

              {/* Price Difference Display */}
              {priceDiff.difference !== 0 && (
                <View className="mt-4 bg-black/30 rounded-xl p-4 border border-yellow-400/20">
                  <View className="flex-row items-center justify-between">
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
                </View>
              )}
            </View>
          </View>

          {/* Message Input */}
          <View className="mb-6">
            <Text className="text-white font-semibold mb-3">Message to Seller</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Explain your counter-offer reasoning..."
              placeholderTextColor="#6B7280"
              className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-neutral-700/50 rounded-xl p-4 text-white min-h-24"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Validity Period */}
          <View className="mb-6">
            <Text className="text-white font-semibold mb-3">Valid For</Text>
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
                  <Text
                    className={`text-center font-semibold ${
                      validDays === days ? 'text-blue-400' : 'text-neutral-300'
                    }`}
                  >
                    {days} days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAcceptView = () => {
    if (!selectedOffer) return null;

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Offer Summary */}
          <View className="mb-6">
            <Text className="text-white font-bold text-lg mb-4">You're accepting this offer:</Text>
            <View className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 rounded-xl p-4 border border-green-500/40">
              <View className="flex-row justify-between mb-3">
                <Text className="text-neutral-300">Seller</Text>
                <Text className="text-white font-semibold">{selectedOffer.seller.name}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-neutral-300">Price</Text>
                <Text className="text-green-400 font-bold">
                  €{selectedOffer.pricePerUnit.toFixed(2)}/{selectedOffer.unit?.toLowerCase()}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-neutral-300">Quantity</Text>
                <Text className="text-white font-semibold">
                  {selectedOffer.quantity} {selectedOffer.unit?.toLowerCase()}
                </Text>
              </View>
              <View className="h-px bg-green-400/30 my-3" />
              <View className="flex-row justify-between">
                <Text className="text-neutral-300">Total Value</Text>
                <Text className="text-green-400 font-black text-xl">
                  €{(selectedOffer.pricePerUnit * selectedOffer.quantity).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Additional Notes */}
          <View className="mb-6">
            <Text className="text-white font-semibold mb-3">Additional Notes (Optional)</Text>
            <TextInput
              value={acceptNotes}
              onChangeText={setAcceptNotes}
              placeholder="Any special requirements or delivery instructions..."
              placeholderTextColor="#6B7280"
              className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-neutral-700/50 rounded-xl p-4 text-white min-h-24"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Terms Notice */}
          <View className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/40">
            <View className="flex-row items-start">
              <Info size={20} color="#60A5FA" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-300 font-semibold mb-1">Important</Text>
                <Text className="text-blue-200 text-sm">
                  By accepting this offer, you agree to the seller's terms and conditions. This
                  action is binding and cannot be undone.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderRejectView = () => {
    if (!selectedOffer) return null;

    const rejectReasons = [
      'Price too high',
      'Quantity insufficient',
      'Delivery time too long',
      'Quality concerns',
      'Found better offer',
      'Other',
    ];

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Offer Being Rejected */}
          <View className="mb-6">
            <Text className="text-white font-bold text-lg mb-4">Rejecting offer from:</Text>
            <View className="bg-gradient-to-br from-red-500/20 to-orange-600/10 rounded-xl p-4 border border-red-500/40">
              <Text className="text-white font-semibold mb-2">{selectedOffer.seller.name}</Text>
              <Text className="text-neutral-300">
                €{selectedOffer.pricePerUnit.toFixed(2)}/{selectedOffer.unit?.toLowerCase()} •{' '}
                {selectedOffer.quantity} {selectedOffer.unit?.toLowerCase()}
              </Text>
            </View>
          </View>

          {/* Rejection Reason */}
          <View className="mb-6">
            <Text className="text-white font-semibold mb-3">Reason for Rejection</Text>
            <View className="flex-row flex-wrap gap-2">
              {rejectReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setRejectReason(reason)}
                  className={`px-4 py-2 rounded-lg border ${
                    rejectReason === reason
                      ? 'bg-red-500/30 border-red-500/50'
                      : 'bg-neutral-800/50 border-neutral-700/50'
                  }`}
                >
                  <Text
                    className={`${rejectReason === reason ? 'text-red-400' : 'text-neutral-300'}`}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Message */}
          <View className="mb-6">
            <Text className="text-white font-semibold mb-3">Message to Seller (Optional)</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Provide additional feedback or suggestions..."
              placeholderTextColor="#6B7280"
              className="bg-gradient-to-br from-neutral-800/90 to-neutral-900/80 border border-neutral-700/50 rounded-xl p-4 text-white min-h-24"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderFooter = () => {
    if (currentView === 'list') return null;

    const getButtons = () => {
      switch (currentView) {
        case 'negotiate':
          return (
            <>
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-neutral-600/50"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitNegotiation}
                disabled={isLoading}
                className="flex-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl py-4 items-center justify-center flex-row"
              >
                <Send size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">
                  {isLoading ? 'Sending...' : 'Send Counter-Offer'}
                </Text>
              </TouchableOpacity>
            </>
          );
        case 'accept':
          return (
            <>
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-neutral-600/50"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitAccept}
                disabled={isLoading}
                className="flex-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl py-4 items-center justify-center flex-row"
              >
                <Check size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">
                  {isLoading ? 'Processing...' : 'Confirm Accept'}
                </Text>
              </TouchableOpacity>
            </>
          );
        case 'reject':
          return (
            <>
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-neutral-600/50"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitReject}
                disabled={isLoading || !rejectReason}
                className="flex-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl py-4 items-center justify-center flex-row"
              >
                <X size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">
                  {isLoading ? 'Processing...' : 'Confirm Reject'}
                </Text>
              </TouchableOpacity>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <View className="p-6 border-t border-neutral-700/50 bg-gradient-to-b from-neutral-900/80 to-black">
        <View className="flex-row gap-4">{getButtons()}</View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Animated.View
          style={{
            flex: 1,
            marginTop: 80,
            backgroundColor: '#0A0A0A', // Solid black background
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          }}
          className="rounded-t-3xl"
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {renderHeader()}

            <Animated.View
              style={{
                flex: 1,
                transform: [{ scale: contentAnim }],
              }}
            >
              {currentView === 'list' && renderListView()}
              {currentView === 'negotiate' && renderNegotiationView()}
              {currentView === 'accept' && renderAcceptView()}
              {currentView === 'reject' && renderRejectView()}
            </Animated.View>

            {renderFooter()}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};
