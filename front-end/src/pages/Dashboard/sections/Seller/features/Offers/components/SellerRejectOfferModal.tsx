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
} from 'react-native';
import {
  X,
  XCircle,
  AlertTriangle,
  DollarSign,
  Package,
  MessageSquare,
  User,
  MapPin,
} from 'lucide-react-native';

import { Card, CardContent } from '../../../../../../shared/components/Card';
import { SellerOffer } from '../../../../../../services/sellerOfferService';

interface SellerRejectOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer: SellerOffer | null;
  onConfirm: (negotiationId: string, reason?: string) => void;
  isLoading?: boolean;
}

export const SellerRejectOfferModal: React.FC<SellerRejectOfferModalProps> = ({
  visible,
  onClose,
  offer,
  onConfirm,
  isLoading = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [rejectReason, setRejectReason] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('');

  const predefinedReasons = [
    'Price is below my minimum',
    'Quantity is too low',
    'Cannot meet quality requirements',
    'Timeline conflicts with other commitments',
    'Payment terms not acceptable',
    'Delivery terms not feasible',
    'Other',
  ];

  useEffect(() => {
    if (visible) {
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
  }, [visible]);

  if (!offer || !visible) return null;

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other' ? rejectReason : selectedReason;
    onConfirm(offer.negotiationId, finalReason.trim() || undefined);
  };

  const handleClose = () => {
    onClose();
    setRejectReason('');
    setSelectedReason('');
  };

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
              <Text className="text-xl font-bold text-white">Reject Offer</Text>
              <TouchableOpacity onPress={handleClose}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
            <Text className="text-neutral-400 mt-1">Decline this offer with reason</Text>
          </View>

          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <View className="p-6">
              {/* Buyer Info */}
              <View className="bg-neutral-800 rounded-lg p-4 mb-4 border border-neutral-700">
                <View className="flex-row items-center mb-3">
                  <User color="#ef4444" size={20} />
                  <Text className="text-white font-semibold text-lg ml-2 flex-1">
                    {offer.buyer}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <MapPin size={14} color="#ef4444" />
                  <Text className="text-neutral-300 text-sm ml-2">
                    {offer.buyerFlag} {offer.buyerLocation}
                  </Text>
                </View>
              </View>

              {/* Offer Summary */}
              <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-500/30 mb-4">
                <CardContent className="p-4">
                  <Text className="text-red-400 font-semibold mb-3">Offer Being Rejected</Text>

                  <View className="space-y-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-neutral-300">Product</Text>
                      <Text className="text-white font-semibold">{offer.product}</Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Package color="#ef4444" size={16} />
                        <Text className="text-neutral-300 ml-2">Quantity</Text>
                      </View>
                      <Text className="text-white font-semibold">{offer.quantity} tons</Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <DollarSign color="#ef4444" size={16} />
                        <Text className="text-neutral-300 ml-2">Offered price</Text>
                      </View>
                      <Text className="text-white font-semibold">
                        ${offer.offeredPricePerTon}/ton
                      </Text>
                    </View>

                    <View className="border-t border-red-500/20 pt-3">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-red-300 font-semibold">Total Value</Text>
                        <Text className="text-red-400 font-bold text-lg">
                          ${offer.totalValue.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>

              {/* Warning */}
              <View className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                <View className="flex-row items-start">
                  <AlertTriangle color="#FB923C" size={16} />
                  <Text className="text-orange-400 text-sm ml-2 flex-1">
                    Rejecting this offer will end the negotiation. The buyer will be notified and
                    cannot make another offer for this transaction.
                  </Text>
                </View>
              </View>

              {/* Reason Selection */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-3">Reason for rejection:</Text>
                <View className="space-y-2">
                  {predefinedReasons.map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedReason(reason)}
                      className={`p-3 rounded-lg border ${
                        selectedReason === reason
                          ? 'bg-red-500/20 border-red-500'
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selectedReason === reason ? 'text-red-300' : 'text-neutral-300'
                        }`}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Custom Reason Input */}
              {selectedReason === 'Other' && (
                <View className="mb-4">
                  <Text className="text-neutral-400 text-sm mb-2">Please specify your reason:</Text>
                  <TextInput
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    placeholder="Enter your reason for rejecting this offer..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={3}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white"
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Professional Message Suggestion */}
              <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <View className="flex-row items-start">
                  <MessageSquare color="#3B82F6" size={16} />
                  <View className="ml-2 flex-1">
                    <Text className="text-blue-300 text-sm font-semibold mb-1">
                      Professional tip:
                    </Text>
                    <Text className="text-blue-300 text-xs">
                      Being clear about your reasons helps maintain good business relationships and
                      may lead to future opportunities.
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
                disabled={
                  isLoading ||
                  !selectedReason ||
                  (selectedReason === 'Other' && !rejectReason.trim())
                }
                className={`flex-1 rounded-lg py-3 items-center justify-center ${
                  isLoading ||
                  !selectedReason ||
                  (selectedReason === 'Other' && !rejectReason.trim())
                    ? 'bg-neutral-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{
                  shadowColor: '#ef4444',
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
                    <XCircle color="#FFFFFF" size={18} />
                  )}
                  <Text className="text-white font-bold ml-2">
                    {isLoading ? 'Rejecting...' : 'Reject Offer'}
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
