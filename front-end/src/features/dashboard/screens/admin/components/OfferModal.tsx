import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Send, AlertCircle, DollarSign, Package } from 'lucide-react-native';
import { MatchingSeller, TradeOperation } from '../../../../../types/trade-operations';
import { negotiationService } from '@services/negotiationService';
import { apiClient } from '@services/api';

interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  seller?: MatchingSeller | null;
  sellerId?: string;
  tradeOperationId: string;
  tradeOperation?: TradeOperation | null;
  onOfferSent?: () => void;
  buyerMaxPrice?: number;
  requiredQuantity?: number;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  visible,
  onClose,
  seller,
  sellerId,
  tradeOperationId,
  tradeOperation,
  onOfferSent,
  buyerMaxPrice = 0,
  requiredQuantity = 0,
}) => {
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState('');
  const [terms, setTerms] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize default values when seller changes
  useEffect(() => {
    if (seller) {
      // Default to seller's asking price
      setOfferPrice(seller.askingPrice?.toString() || '');
      // Default to minimum of available quantity or required quantity
      const defaultQuantity = Math.min(
        seller.availableQuantity || 0,
        requiredQuantity || seller.availableQuantity || 0
      );
      setOfferQuantity(defaultQuantity.toString());
      // Set default terms
      setTerms('Standard trade terms apply. Payment upon delivery confirmation.');
      setMessage('');
      setValidationErrors([]);
    }
  }, [seller, requiredQuantity]);

  const validateOffer = (): boolean => {
    const errors: string[] = [];
    const price = parseFloat(offerPrice);
    const quantity = parseFloat(offerQuantity);

    if (!price || price <= 0) {
      errors.push('Please enter a valid price');
    }

    if (!quantity || quantity <= 0) {
      errors.push('Please enter a valid quantity');
    }

    if (price > buyerMaxPrice) {
      errors.push(`Price exceeds buyer's maximum (€${buyerMaxPrice})`);
    }

    if (quantity > (seller?.availableQuantity || 0)) {
      errors.push(
        `Quantity exceeds available (${seller?.availableQuantity} ${seller?.saleListing?.unit || 'units'})`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const calculateProfitMargin = () => {
    const price = parseFloat(offerPrice) || 0;
    if (!price || !buyerMaxPrice) return 0;
    const margin = ((buyerMaxPrice - price) / buyerMaxPrice) * 100;
    return margin.toFixed(1);
  };

  const handleSubmit = async () => {
    if (!validateOffer() || (!seller && !sellerId)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // First check if this seller is already added to the trade operation
      let tradeSeller = tradeOperation?.sellers?.find((ts) => ts.sellerId === seller.sellerId);

      // If seller is not added to trade operation yet, add them first
      if (!tradeSeller) {
        console.log('Seller not in trade operation yet, adding them first...');

        try {
          // Add the seller to the trade operation
          const response = await apiClient.post(`/trade-operations/${tradeOperationId}/sellers`, {
            sellers: [
              {
                sellerId: seller.sellerId,
                saleListingId: seller.saleListingId,
                requestedQuantity: parseFloat(offerQuantity),
              },
            ],
          });

          const result = response.data;
          console.log('Seller added successfully:', result);

          // Now the seller should have a TradeSeller ID
          // We need to get it from the response or refresh the trade operation
          if (result.sellersAdded && result.sellersAdded.length > 0) {
            tradeSeller = result.sellersAdded[0];
          } else {
            // If the response doesn't include the TradeSeller details, we'll use the sellerId directly
            // The backend negotiation endpoint should handle both TradeSeller ID and regular seller ID
            tradeSeller = { id: seller.sellerId, sellerId: seller.sellerId };
          }
        } catch (error) {
          console.error('Error adding seller to trade:', error);
          Alert.alert('Error', 'Failed to add seller to trade operation. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Now send the offer using the TradeSeller ID
      await negotiationService.sendOffer(tradeOperationId, {
        tradeSellerId: sellerId || tradeSeller.id || seller.sellerId, // Use provided sellerId or fallback
        price: parseFloat(offerPrice),
        quantity: parseFloat(offerQuantity),
        terms: terms || undefined,
      });

      Alert.alert(
        'Offer Sent',
        `Your offer of €${offerPrice} for ${offerQuantity} units has been sent to ${seller.sellerName}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onOfferSent) onOfferSent();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error sending offer:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to send offer. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!seller && !sellerId) return null;

  const profitMargin = calculateProfitMargin();
  const isProfitable = parseFloat(profitMargin) >= 5; // 5% minimum margin

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full h-[95%] px-4"
        >
          <View className="bg-white rounded-2xl h-full w-full">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800">Create Offer</Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {seller?.sellerName || `Seller ${sellerId}`}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-gray-100">
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Seller Info */}
              {seller && (
                <View className="bg-blue-50 rounded-lg p-3 mb-4">
                  <Text className="text-blue-800 font-semibold mb-1">Seller Information</Text>
                  <Text className="text-blue-700 text-sm">
                    Location: {seller.location?.displayName || 'Unknown'}
                  </Text>
                  <Text className="text-blue-700 text-sm">
                    Available: {seller.availableQuantity} {seller.saleListing?.unit || 'units'}
                  </Text>
                  <Text className="text-blue-700 text-sm">
                    Asking Price: €{seller.askingPrice}/unit
                  </Text>
                </View>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <View className="bg-red-50 rounded-lg p-3 mb-4">
                  {validationErrors.map((error, index) => (
                    <View key={index} className="flex-row items-start mb-1">
                      <AlertCircle size={14} color="#DC2626" style={{ marginTop: 2 }} />
                      <Text className="text-red-600 text-sm ml-1">{error}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Price Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Offer Price (per unit)</Text>
                <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-300">
                  <DollarSign size={20} color="#6B7280" />
                  <TextInput
                    value={offerPrice}
                    onChangeText={setOfferPrice}
                    placeholder={seller.askingPrice?.toString() || '0'}
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-gray-800"
                  />
                  <Text className="text-gray-600">EUR</Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  Max buyer price: €{buyerMaxPrice}
                </Text>
              </View>

              {/* Quantity Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Quantity</Text>
                <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-300">
                  <Package size={20} color="#6B7280" />
                  <TextInput
                    value={offerQuantity}
                    onChangeText={setOfferQuantity}
                    placeholder={seller.availableQuantity?.toString() || '0'}
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-gray-800"
                  />
                  <Text className="text-gray-600">{seller.saleListing?.unit || 'units'}</Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  Available: {seller.availableQuantity} | Required: {requiredQuantity}
                </Text>
              </View>

              {/* Profit Indicator */}
              <View
                className={`rounded-lg p-3 mb-4 ${isProfitable ? 'bg-green-50' : 'bg-orange-50'}`}
              >
                <Text
                  className={`font-semibold ${isProfitable ? 'text-green-800' : 'text-orange-800'}`}
                >
                  Estimated Profit Margin: {profitMargin}%
                </Text>
                <Text
                  className={`text-sm mt-1 ${isProfitable ? 'text-green-600' : 'text-orange-600'}`}
                >
                  {isProfitable
                    ? 'This offer meets minimum profit requirements'
                    : 'Warning: Below 5% minimum margin'}
                </Text>
              </View>

              {/* Terms Input */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Terms & Conditions</Text>
                <TextInput
                  value={terms}
                  onChangeText={setTerms}
                  placeholder="Enter trade terms..."
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-300 text-gray-800"
                  textAlignVertical="top"
                />
              </View>

              {/* Message Input */}
              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-2">Message (Optional)</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Add a personal message to the seller..."
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-300 text-gray-800"
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="p-4 border-t border-gray-200">
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 py-3 rounded-lg border border-gray-300"
                  disabled={isSubmitting}
                >
                  <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
                    isSubmitting ? 'bg-gray-400' : isProfitable ? 'bg-blue-500' : 'bg-orange-500'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Send size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">Send Offer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
