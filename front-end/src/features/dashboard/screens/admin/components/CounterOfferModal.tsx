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
import {
  X,
  Send,
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { negotiationService } from '@services/negotiationService';

interface CounterOfferModalProps {
  visible: boolean;
  onClose: () => void;
  negotiationId: string;
  currentOffer: {
    price: number;
    quantity: number;
    terms?: string;
  };
  counterOffer?: {
    price: number;
    quantity: number;
    terms?: string;
    reason?: string;
  };
  sellerName?: string;
  buyerMaxPrice?: number;
  targetMargin?: number;
  onOfferSent?: () => void;
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
  visible,
  onClose,
  negotiationId,
  currentOffer,
  counterOffer,
  sellerName = 'Seller',
  buyerMaxPrice = 0,
  targetMargin = 7,
  onOfferSent,
}) => {
  const [responseType, setResponseType] = useState<'COUNTER' | 'ACCEPT' | 'REJECT'>('COUNTER');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize with suggested values
  useEffect(() => {
    if (counterOffer && currentOffer) {
      // Suggest a middle ground price
      const suggestedPrice = ((currentOffer.price + counterOffer.price) / 2).toFixed(2);
      setNewPrice(suggestedPrice);
      setNewQuantity(counterOffer.quantity.toString());

      // Generate appropriate message based on price difference
      const priceDiff = counterOffer.price - currentOffer.price;
      const percentDiff = ((priceDiff / currentOffer.price) * 100).toFixed(1);

      if (Math.abs(priceDiff) < currentOffer.price * 0.05) {
        setResponseMessage(
          `We're very close to an agreement. This offer represents a fair middle ground.`
        );
      } else if (priceDiff > 0) {
        setResponseMessage(
          `While we understand your position, this price would impact our margins. We propose a compromise.`
        );
      } else {
        setResponseMessage(
          `We appreciate your flexibility. This adjusted offer ensures a mutually beneficial arrangement.`
        );
      }
    }
  }, [counterOffer, currentOffer]);

  const calculateProfitMargin = (price: number) => {
    if (!buyerMaxPrice || buyerMaxPrice === 0) return 0;
    const margin = ((buyerMaxPrice - price) / buyerMaxPrice) * 100;
    return margin;
  };

  const calculateConvergence = () => {
    if (!counterOffer || !currentOffer) return null;

    const currentGap = Math.abs(counterOffer.price - currentOffer.price);
    const newGap = Math.abs(parseFloat(newPrice) - counterOffer.price);
    const convergenceRate = (((currentGap - newGap) / currentGap) * 100).toFixed(1);

    return {
      currentGap,
      newGap,
      convergenceRate: parseFloat(convergenceRate),
      isConverging: newGap < currentGap,
    };
  };

  const validateResponse = (): boolean => {
    const errors: string[] = [];

    if (responseType === 'COUNTER') {
      const price = parseFloat(newPrice);
      const quantity = parseFloat(newQuantity);

      if (!price || price <= 0) {
        errors.push('Please enter a valid price');
      }

      if (!quantity || quantity <= 0) {
        errors.push('Please enter a valid quantity');
      }

      if (price > buyerMaxPrice) {
        errors.push(`Price exceeds buyer's maximum (€${buyerMaxPrice})`);
      }

      const margin = calculateProfitMargin(price);
      if (margin < 5) {
        errors.push(`Price results in ${margin.toFixed(1)}% margin (minimum 5% required)`);
      }

      // Check if the new offer is moving in the right direction
      if (counterOffer && price >= counterOffer.price) {
        errors.push("Counter-offer should be lower than seller's current offer");
      }
    } else if (responseType === 'REJECT' && !rejectReason) {
      errors.push('Please provide a reason for rejection');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResponse()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      switch (responseType) {
        case 'ACCEPT':
          result = await negotiationService.acceptOffer(
            negotiationId,
            responseMessage || 'Offer accepted'
          );
          Alert.alert(
            'Offer Accepted',
            `You have accepted the seller's offer of €${counterOffer?.price || currentOffer.price} for ${counterOffer?.quantity || currentOffer.quantity} units.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  onOfferSent?.();
                  onClose();
                },
              },
            ]
          );
          break;

        case 'REJECT':
          result = await negotiationService.rejectOffer(
            negotiationId,
            rejectReason || 'Terms not acceptable'
          );
          Alert.alert('Offer Rejected', 'The negotiation has been closed.', [
            {
              text: 'OK',
              onPress: () => {
                onOfferSent?.();
                onClose();
              },
            },
          ]);
          break;

        case 'COUNTER':
          result = await negotiationService.counterOffer(negotiationId, {
            counterPrice: parseFloat(newPrice),
            message: responseMessage,
          });

          const convergence = calculateConvergence();
          Alert.alert(
            'Counter-Offer Sent',
            `Your counter-offer of €${newPrice} has been sent to ${sellerName}.${
              convergence?.isConverging
                ? ` The price gap has narrowed by ${convergence.convergenceRate}%.`
                : ''
            }`,
            [
              {
                text: 'OK',
                onPress: () => {
                  onOfferSent?.();
                  onClose();
                },
              },
            ]
          );
          break;
      }
    } catch (error: any) {
      console.error('Error responding to counter-offer:', error);
      Alert.alert('Error', error?.message || 'Failed to send response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profitMargin = calculateProfitMargin(parseFloat(newPrice) || counterOffer?.price || 0);
  const isProfitable = profitMargin >= 5;
  const meetsTarget = profitMargin >= targetMargin;
  const convergence = calculateConvergence();

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
                <Text className="text-lg font-bold text-gray-800">Respond to Counter-Offer</Text>
                <Text className="text-sm text-gray-600 mt-1">{sellerName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-gray-100">
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Offer Comparison */}
              <View className="bg-blue-50 rounded-lg p-3 mb-4">
                <Text className="text-blue-800 font-semibold mb-2">Negotiation Status</Text>
                <View className="flex-row justify-between mb-2">
                  <View>
                    <Text className="text-xs text-blue-600">Your Offer</Text>
                    <Text className="text-blue-800 font-bold">
                      €{currentOffer.price} × {currentOffer.quantity}
                    </Text>
                  </View>
                  <View className="justify-center">
                    <MessageSquare size={20} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="text-xs text-blue-600">Their Counter</Text>
                    <Text className="text-blue-800 font-bold">
                      €{counterOffer?.price || 0} × {counterOffer?.quantity || 0}
                    </Text>
                  </View>
                </View>
                {counterOffer?.reason && (
                  <Text className="text-xs text-blue-600 italic mt-1">"{counterOffer.reason}"</Text>
                )}
              </View>

              {/* Response Type Selection */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">
                  How do you want to respond?
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setResponseType('COUNTER')}
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      responseType === 'COUNTER'
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <MessageSquare
                      size={16}
                      color={responseType === 'COUNTER' ? 'white' : '#6B7280'}
                      style={{ alignSelf: 'center' }}
                    />
                    <Text
                      className={`text-xs text-center mt-1 ${
                        responseType === 'COUNTER' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Counter
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setResponseType('ACCEPT')}
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      responseType === 'ACCEPT'
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <CheckCircle
                      size={16}
                      color={responseType === 'ACCEPT' ? 'white' : '#6B7280'}
                      style={{ alignSelf: 'center' }}
                    />
                    <Text
                      className={`text-xs text-center mt-1 ${
                        responseType === 'ACCEPT' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Accept
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setResponseType('REJECT')}
                    className={`flex-1 py-2 px-3 rounded-lg border ${
                      responseType === 'REJECT'
                        ? 'bg-red-600 border-red-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <XCircle
                      size={16}
                      color={responseType === 'REJECT' ? 'white' : '#6B7280'}
                      style={{ alignSelf: 'center' }}
                    />
                    <Text
                      className={`text-xs text-center mt-1 ${
                        responseType === 'REJECT' ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      Reject
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

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

              {/* Counter-Offer Form */}
              {responseType === 'COUNTER' && (
                <>
                  <View className="mb-4">
                    <Text className="text-gray-700 font-semibold mb-2">New Price (per unit)</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-300">
                      <DollarSign size={20} color="#6B7280" />
                      <TextInput
                        value={newPrice}
                        onChangeText={setNewPrice}
                        placeholder={counterOffer?.price.toString() || '0'}
                        keyboardType="numeric"
                        className="flex-1 ml-2 text-gray-800"
                      />
                      <Text className="text-gray-600">EUR</Text>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      Seller's offer: €{counterOffer?.price} | Your last: €{currentOffer.price}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-700 font-semibold mb-2">Quantity</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-300">
                      <Package size={20} color="#6B7280" />
                      <TextInput
                        value={newQuantity}
                        onChangeText={setNewQuantity}
                        placeholder={counterOffer?.quantity.toString() || '0'}
                        keyboardType="numeric"
                        className="flex-1 ml-2 text-gray-800"
                      />
                      <Text className="text-gray-600">units</Text>
                    </View>
                  </View>

                  {/* Convergence Indicator */}
                  {convergence && (
                    <View
                      className={`rounded-lg p-3 mb-4 ${
                        convergence.isConverging ? 'bg-green-50' : 'bg-orange-50'
                      }`}
                    >
                      <View className="flex-row items-center">
                        {convergence.isConverging ? (
                          <TrendingDown size={16} color="#10B981" />
                        ) : (
                          <TrendingUp size={16} color="#F97316" />
                        )}
                        <Text
                          className={`font-semibold ml-2 ${
                            convergence.isConverging ? 'text-green-800' : 'text-orange-800'
                          }`}
                        >
                          {convergence.isConverging ? 'Converging' : 'Diverging'} Negotiation
                        </Text>
                      </View>
                      <Text
                        className={`text-xs mt-1 ${
                          convergence.isConverging ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        Price gap: €{convergence.currentGap.toFixed(2)} → €
                        {convergence.newGap.toFixed(2)}
                        {convergence.isConverging && ` (-${convergence.convergenceRate}%)`}
                      </Text>
                    </View>
                  )}

                  {/* Profit Indicator */}
                  <View
                    className={`rounded-lg p-3 mb-4 ${
                      meetsTarget ? 'bg-green-50' : isProfitable ? 'bg-yellow-50' : 'bg-red-50'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        meetsTarget
                          ? 'text-green-800'
                          : isProfitable
                            ? 'text-yellow-800'
                            : 'text-red-800'
                      }`}
                    >
                      Profit Margin: {profitMargin.toFixed(1)}%
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        meetsTarget
                          ? 'text-green-600'
                          : isProfitable
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {meetsTarget
                        ? `Meets target margin (${targetMargin}%)`
                        : isProfitable
                          ? `Below target (${targetMargin}%) but profitable`
                          : 'Below minimum margin (5%)'}
                    </Text>
                  </View>
                </>
              )}

              {/* Accept Form */}
              {responseType === 'ACCEPT' && (
                <View className="bg-green-50 rounded-lg p-3 mb-4">
                  <View className="flex-row items-center mb-2">
                    <CheckCircle size={20} color="#10B981" />
                    <Text className="text-green-800 font-semibold ml-2">
                      Accepting Counter-Offer
                    </Text>
                  </View>
                  <Text className="text-green-700 text-sm">
                    You will accept: €{counterOffer?.price} × {counterOffer?.quantity} units
                  </Text>
                  <Text className="text-green-600 text-xs mt-1">
                    Total value: €
                    {((counterOffer?.price || 0) * (counterOffer?.quantity || 0)).toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Reject Form */}
              {responseType === 'REJECT' && (
                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2">Reason for Rejection</Text>
                  <TextInput
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    placeholder="Explain why you're rejecting this offer..."
                    multiline
                    numberOfLines={3}
                    className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-300 text-gray-800"
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Message/Note */}
              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-2">
                  {responseType === 'REJECT' ? 'Additional Note' : 'Message'} (Optional)
                </Text>
                <TextInput
                  value={responseMessage}
                  onChangeText={setResponseMessage}
                  placeholder={
                    responseType === 'ACCEPT'
                      ? 'Thank you for your flexibility...'
                      : responseType === 'REJECT'
                        ? 'We appreciate your offer but...'
                        : "Let's find a middle ground..."
                  }
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-300 text-gray-800"
                  textAlignVertical="top"
                />
              </View>

              {/* Negotiation Tips */}
              <View className="bg-gray-50 rounded-lg p-3 mb-4">
                <View className="flex-row items-center mb-1">
                  <Info size={14} color="#6B7280" />
                  <Text className="text-xs font-semibold text-gray-700 ml-1">Negotiation Tips</Text>
                </View>
                <Text className="text-xs text-gray-600">
                  {responseType === 'COUNTER'
                    ? '• Move closer to their price to show willingness\n• Consider quantity adjustments for better pricing\n• Keep communication professional and positive'
                    : responseType === 'ACCEPT'
                      ? '• Accepting builds trust for future deals\n• Consider the long-term relationship value\n• Quick acceptance can expedite delivery'
                      : '• Provide clear reasoning for rejection\n• Leave door open for future negotiations\n• Consider alternative suppliers before rejecting'}
                </Text>
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
                    isSubmitting
                      ? 'bg-gray-400'
                      : responseType === 'ACCEPT'
                        ? 'bg-green-600'
                        : responseType === 'REJECT'
                          ? 'bg-red-600'
                          : isProfitable
                            ? 'bg-blue-600'
                            : 'bg-orange-600'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Send size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">
                        {responseType === 'ACCEPT'
                          ? 'Accept'
                          : responseType === 'REJECT'
                            ? 'Reject'
                            : 'Send Counter'}
                      </Text>
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
