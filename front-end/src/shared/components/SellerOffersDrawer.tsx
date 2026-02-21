import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Package,
  TrendingUp,
  Star,
  Eye,
  DollarSign,
  Users,
  ArrowLeft,
  Check,
  Send,
  AlertTriangle,
  Info,
  Calculator,
  Building2,
  Target,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Truck,
  ArrowUpDown,
  MessageSquare,
  CheckCircle,
} from 'lucide-react-native';

import { SellerOfferCard } from './SellerOfferCard';
import { sellerOfferService } from '@services/sellerOfferService';

interface BuyerOffer {
  id: string;
  negotiationId?: string;
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
  specifications?: {
    name: string;
    requirement: string;
    matches: boolean;
  }[];
  matchScore: number;
  totalValue: number;
  message?: string;
  urgency: 'low' | 'medium' | 'high';
  validUntil: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  createdAt: string;
}

interface SellerOffersDrawerProps {
  visible: boolean;
  onClose: () => void;
  offers: BuyerOffer[];
  sellerProduct: any;
  productName: string;
  productId: string;
}

type ViewType = 'list' | 'negotiate' | 'accept' | 'reject';

export const SellerOffersDrawer: React.FC<SellerOffersDrawerProps> = ({
  visible,
  onClose,
  offers,
  sellerProduct,
  productName,
  productId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [contentAnim] = useState(new Animated.Value(1));
  const [filterBy, setFilterBy] = useState<'all' | 'pending'>('all');

  // Unified view state
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedOffer, setSelectedOffer] = useState<BuyerOffer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQuantity, setCounterQuantity] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('14');
  const [deliveryTerms, setDeliveryTerms] = useState('FOB');
  const [message, setMessage] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [negotiationType, setNegotiationType] = useState<
    'price' | 'quantity' | 'terms' | 'combined'
  >('price');
  const [acceptNotes, setAcceptNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Simulate loading time for offers
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
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
        setCounterQuantity('');
        setMessage('');
        setAcceptNotes('');
        setRejectReason('');
        setRejectMessage('');
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

  // Filter offers (no sorting)
  const processedOffers = React.useMemo(() => {
    let filtered = offers;

    // Apply filters
    switch (filterBy) {
      case 'pending':
        filtered = offers.filter((offer) => offer.status === 'pending');
        break;
      default:
        filtered = offers;
    }

    // Return filtered results without sorting
    return filtered;
  }, [offers, filterBy]);

  // Calculate offer statistics
  const offerStats = React.useMemo(() => {
    const pending = offers.filter((o) => o.status === 'pending').length;
    const avgPrice =
      offers.length > 0 ? offers.reduce((sum, o) => sum + o.offeredPrice, 0) / offers.length : 0;
    const bestPrice = offers.length > 0 ? Math.max(...offers.map((o) => o.offeredPrice)) : 0;

    return { pending, avgPrice, bestPrice };
  }, [offers]);

  const handleOfferAction = (action: 'accept' | 'reject' | 'negotiate', offerId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;

    setSelectedOffer(offer);
    setCounterPrice(offer.offeredPrice.toString());
    setCounterQuantity(offer.requestedQuantity.toString());
    // Change view to show the appropriate content (negotiate/accept/reject)
    animateViewChange(action);
  };

  const handleSubmitAccept = async () => {
    if (!selectedOffer) return;

    setActionLoading(true);
    try {
      const offerId = selectedOffer.negotiationId || selectedOffer.id;
      await sellerOfferService.acceptOffer(offerId, { acceptanceNote: acceptNotes || undefined });
      Alert.alert('Success', 'Offer accepted successfully!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReject = async () => {
    if (!selectedOffer) return;

    if (!rejectReason.trim()) {
      Alert.alert('Validation Error', 'Please select a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const offerId = selectedOffer.negotiationId || selectedOffer.id;
      await sellerOfferService.rejectOffer(offerId, { reason: rejectReason });
      Alert.alert('Offer Rejected', 'The buyer has been notified of your decision.');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitNegotiation = async () => {
    if (!selectedOffer) return;

    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid counter price');
      return;
    }

    if (!counterQuantity || parseFloat(counterQuantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    const counterQuantityNum = parseFloat(counterQuantity);
    const availableQuantity = sellerProduct?.quantity || 0;

    if (counterQuantityNum > availableQuantity) {
      Alert.alert(
        'Validation Error',
        `Quantity cannot exceed your available stock (${availableQuantity} ${selectedOffer.unit})`
      );
      return;
    }

    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please add a message explaining your counter-offer');
      return;
    }

    setActionLoading(true);
    try {
      const offerId = selectedOffer.negotiationId || selectedOffer.id;
      await sellerOfferService.counterOffer(offerId, {
        counterPrice: parseFloat(counterPrice),
        quantity: parseFloat(counterQuantity),
        message: message.trim(),
      });
      Alert.alert('Counter-Offer Sent', 'Your counter-offer has been sent to the buyer.');
      handleBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to send counter-offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper functions
  const calculatePriceDifference = () => {
    if (!selectedOffer) return { difference: 0, percentageChange: 0, isIncrease: false };
    const original = selectedOffer.offeredPrice || 0;
    const counter = parseFloat(counterPrice) || 0;
    const difference = counter - original;
    const percentageChange = original > 0 ? (difference / original) * 100 : 0;
    return { difference, percentageChange, isIncrease: difference > 0 };
  };

  const calculateQuantityDifference = () => {
    if (!selectedOffer) return { difference: 0, percentageChange: 0, isIncrease: false };
    const original = selectedOffer.requestedQuantity || 0;
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

  // Render functions
  const renderHeader = () => {
    const getTitle = () => {
      switch (currentView) {
        case 'negotiate':
          return 'Counter Offer';
        case 'accept':
          return 'Accept Offer';
        case 'reject':
          return 'Reject Offer';
        default:
          return `${productName} Offers`;
      }
    };

    const getSubtitle = () => {
      switch (currentView) {
        case 'negotiate':
          return 'Negotiate terms with buyer';
        case 'accept':
          return 'Confirm your acceptance';
        case 'reject':
          return 'Provide rejection reason';
        default:
          return `${offers.length} offer${offers.length !== 1 ? 's' : ''} received`;
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
        {/* Offer Statistics */}
        <View className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 border border-green-500/20 mb-6">
          <View className="flex-row justify-between items-center">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-green-400">
                €{offerStats.bestPrice.toFixed(2)}
              </Text>
              <Text className="text-xs text-green-300">Best Price</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-yellow-400">{offerStats.pending}</Text>
              <Text className="text-xs text-yellow-300">Pending</Text>
            </View>
          </View>
        </View>

        {/* Filter Controls */}
        <View className="mb-6">
          <Text className="text-neutral-400 text-xs mb-2">Filter offers</Text>
          <View className="flex-row gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setFilterBy(key as any)}
                className={`px-3 py-2 rounded-lg border ${
                  filterBy === key
                    ? 'bg-green-500/20 border-green-500/50'
                    : 'bg-neutral-800/50 border-neutral-600/50'
                }`}
              >
                <Text
                  className={`text-xs ${filterBy === key ? 'text-green-400' : 'text-neutral-400'}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#10B981" />
            <Text className="mt-4 text-gray-400">Loading offers...</Text>
          </View>
        ) : processedOffers.length === 0 ? (
          <View className="items-center py-12">
            <Users size={48} color="#6B7280" />
            <Text className="text-lg font-semibold text-white mt-4">
              No {filterBy !== 'all' ? filterBy : ''} Offers
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              {filterBy !== 'all'
                ? `No offers match the ${filterBy} filter criteria`
                : 'No buyers have made offers for this product yet'}
            </Text>
          </View>
        ) : (
          <View>
            {processedOffers.map((offer) => (
              <SellerOfferCard
                key={offer.id}
                offer={offer}
                sellerProduct={sellerProduct}
                onAccept={(id) => handleOfferAction('accept', id)}
                onReject={(id) => handleOfferAction('reject', id)}
                onNegotiate={(id) => handleOfferAction('negotiate', id)}
                isLoading={actionLoading}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderNegotiationView = () => {
    if (!selectedOffer) return null;
    const priceDiff = calculatePriceDifference();
    const quantityDiff = calculateQuantityDifference();
    const totalValue = calculateTotalValue();
    const profitMargin = calculateProfitMargin();

    return (
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
            <View className="rounded-2xl p-6 border border-blue-500/40 bg-gradient-to-br from-blue-500/20 to-indigo-600/10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-blue-200 font-medium text-base">Offered Price</Text>
                <View className="flex-row items-center">
                  <Text className="text-blue-300 font-black text-2xl">
                    €{selectedOffer.offeredPrice.toFixed(2)}
                  </Text>
                  <Text className="text-blue-400/70 ml-2 text-sm">
                    /{selectedOffer.unit.toLowerCase()}
                  </Text>
                </View>
              </View>
              <View className="h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent mb-4" />
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-200 font-medium text-base">Requested Quantity</Text>
                <Text className="text-white font-bold text-lg">
                  {selectedOffer.requestedQuantity} {selectedOffer.unit.toLowerCase()}
                </Text>
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
            <View className="rounded-2xl p-6 border border-green-500/40 bg-gradient-to-br from-green-500/20 to-emerald-600/10">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-green-200 font-medium text-base">Available Stock</Text>
                <Text className="text-white font-bold text-lg">
                  {sellerProduct?.quantity || 0} {selectedOffer.unit.toLowerCase()}
                </Text>
              </View>
              <View className="h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent mb-4" />
              <View className="flex-row justify-between items-center">
                <Text className="text-green-200 font-medium text-base">Market Range</Text>
                <View className="flex-row items-center">
                  <Text className="text-green-300 font-black text-lg">
                    €{sellerProduct?.priceRangeMin || 0}-{sellerProduct?.priceRangeMax || 0}
                  </Text>
                  <Text className="text-green-400/70 ml-2 text-sm">
                    /{selectedOffer.unit.toLowerCase()}
                  </Text>
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
                  <Text
                    className={`ml-2 font-medium ${
                      negotiationType === key ? 'text-yellow-400' : 'text-neutral-300'
                    }`}
                  >
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

            <View className="rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/20 to-orange-600/10 p-6">
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
                      <Text className="text-yellow-400/80 text-lg font-medium">
                        /{selectedOffer.unit.toLowerCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Real-time Price Analysis */}
                  {priceDiff.difference !== 0 && (
                    <View className="mt-4 bg-black/30 rounded-xl p-4 border border-yellow-400/20">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          {priceDiff.isIncrease ? (
                            <TrendingUpIcon size={16} color="#10B981" />
                          ) : (
                            <TrendingDown size={16} color="#EF4444" />
                          )}
                          <Text
                            className={`ml-2 text-sm font-bold ${
                              priceDiff.isIncrease ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {priceDiff.isIncrease ? '+' : ''}€
                            {Math.abs(priceDiff.difference).toFixed(2)} per unit
                          </Text>
                        </View>
                        <Text
                          className={`text-sm font-bold ${
                            priceDiff.isIncrease ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          ({priceDiff.isIncrease ? '+' : ''}
                          {priceDiff.percentageChange.toFixed(1)}%)
                        </Text>
                      </View>

                      {/* Profit Margin Analysis */}
                      {profitMargin.margin !== 0 && (
                        <View className="border-t border-yellow-400/20 pt-3 mt-3">
                          <View className="flex-row justify-between items-center">
                            <Text className="text-yellow-200 text-sm">Profit Margin:</Text>
                            <Text
                              className={`text-sm font-bold ${
                                profitMargin.isProfitable ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              €{Math.abs(profitMargin.margin).toFixed(2)} (
                              {profitMargin.marginPercentage.toFixed(1)}%)
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
                      <Text className="text-yellow-400/80 text-lg font-medium ml-3">
                        {selectedOffer.unit.toLowerCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Analysis */}
                  {quantityDiff.difference !== 0 && (
                    <View className="mt-4 bg-black/30 rounded-xl p-4 border border-yellow-400/20">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-yellow-200 text-sm">Quantity Change:</Text>
                        <Text
                          className={`text-sm font-bold ${
                            quantityDiff.isIncrease ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {quantityDiff.isIncrease ? '+' : ''}
                          {Math.abs(quantityDiff.difference)} {selectedOffer.unit.toLowerCase()}
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
                            <Text
                              className={`text-center font-medium ${
                                deliveryDays === days ? 'text-blue-400' : 'text-neutral-300'
                              }`}
                            >
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
                            <Text
                              className={`text-center text-sm font-medium ${
                                deliveryTerms === term ? 'text-green-400' : 'text-neutral-300'
                              }`}
                            >
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
                <Text className="text-neutral-300">Buyer</Text>
                <Text className="text-white font-semibold">{selectedOffer.buyer.name}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-neutral-300">Price</Text>
                <Text className="text-green-400 font-bold">
                  €{selectedOffer.offeredPrice.toFixed(2)}/{selectedOffer.unit.toLowerCase()}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-neutral-300">Quantity</Text>
                <Text className="text-white font-semibold">
                  {selectedOffer.requestedQuantity} {selectedOffer.unit.toLowerCase()}
                </Text>
              </View>
              <View className="h-px bg-green-400/30 my-3" />
              <View className="flex-row justify-between">
                <Text className="text-neutral-300">Total Value</Text>
                <Text className="text-green-400 font-black text-xl">
                  €{(selectedOffer.offeredPrice * selectedOffer.requestedQuantity).toLocaleString()}
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
                  By accepting this offer, you agree to the buyer's terms and conditions. This
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
      'Price too low',
      'Quantity too small',
      'Delivery requirements not feasible',
      'Quality concerns',
      'Better offer available',
      'Insufficient buyer credentials',
      'Terms not acceptable',
      'Other reason',
    ];

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Offer Being Rejected */}
          <View className="mb-6">
            <Text className="text-white font-bold text-lg mb-4">Rejecting offer from:</Text>
            <View className="bg-gradient-to-br from-red-500/20 to-orange-600/10 rounded-xl p-4 border border-red-500/40">
              <Text className="text-white font-semibold mb-2">{selectedOffer.buyer.name}</Text>
              <Text className="text-neutral-300">
                €{selectedOffer.offeredPrice.toFixed(2)}/{selectedOffer.unit.toLowerCase()} •{' '}
                {selectedOffer.requestedQuantity} {selectedOffer.unit.toLowerCase()}
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
            <Text className="text-white font-semibold mb-3">Message to Buyer (Optional)</Text>
            <TextInput
              value={rejectMessage}
              onChangeText={setRejectMessage}
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
                disabled={actionLoading}
                className="flex-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl py-4 items-center justify-center flex-row"
              >
                <Send size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">
                  {actionLoading ? 'Sending...' : 'Send Counter-Offer'}
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
                disabled={actionLoading}
                className="flex-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl py-4 items-center justify-center flex-row"
              >
                <Check size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">
                  {actionLoading ? 'Processing...' : 'Confirm Accept'}
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
                disabled={actionLoading || !rejectReason}
                className="flex-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl py-4 items-center justify-center flex-row"
              >
                <X size={18} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">
                  {actionLoading ? 'Processing...' : 'Confirm Reject'}
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
            marginTop: 100,
            backgroundColor: '#0A0A0A',
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
