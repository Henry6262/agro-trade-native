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
  Check,
  X,
  DollarSign,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
} from 'lucide-react-native';

import { Card, CardContent } from '@shared/components/Card';
import { SellerOffer } from '@services/sellerOfferService';

interface SellerAcceptOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer: SellerOffer | null;
  onConfirm: (negotiationId: string, acceptanceNote?: string) => void;
  isLoading?: boolean;
}

export const SellerAcceptOfferModal: React.FC<SellerAcceptOfferModalProps> = ({
  visible,
  onClose,
  offer,
  onConfirm,
  isLoading = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [acceptanceNote, setAcceptanceNote] = useState('');

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
    onConfirm(offer.negotiationId, acceptanceNote.trim() || undefined);
  };

  const handleClose = () => {
    onClose();
    setAcceptanceNote('');
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
              <Text className="text-xl font-bold text-white">Accept Offer</Text>
              <TouchableOpacity onPress={handleClose}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
            <Text className="text-neutral-400 mt-1">Confirm this offer acceptance</Text>
          </View>

          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            <View className="p-6">
              {/* Buyer Info */}
              <View className="bg-neutral-800 rounded-lg p-4 mb-4 border border-neutral-700">
                <View className="flex-row items-center mb-3">
                  <User color="#60a5fa" size={20} />
                  <Text className="text-white font-semibold text-lg ml-2 flex-1">
                    {offer.buyer}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <MapPin size={14} color="#60a5fa" />
                  <Text className="text-neutral-300 text-sm ml-2">
                    {offer.buyerFlag} {offer.buyerLocation}
                  </Text>
                </View>
              </View>

              {/* Offer Details */}
              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30 mb-4">
                <CardContent className="p-4">
                  <Text className="text-green-400 font-semibold mb-3">Offer Details</Text>

                  <View className="space-y-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-neutral-300">Product</Text>
                      <Text className="text-white font-semibold">{offer.product}</Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Package color="#10B981" size={16} />
                        <Text className="text-neutral-300 ml-2">Quantity</Text>
                      </View>
                      <Text className="text-white font-semibold">{offer.quantity} tons</Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <DollarSign color="#10B981" size={16} />
                        <Text className="text-neutral-300 ml-2">Price per ton</Text>
                      </View>
                      <Text className="text-white font-semibold">${offer.offeredPricePerTon}</Text>
                    </View>

                    <View className="border-t border-green-500/20 pt-3">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-green-300 font-semibold">Total Value</Text>
                        <Text className="text-green-400 font-bold text-xl">
                          ${offer.totalValue.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>

              {/* Estimated Profit */}
              <View className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-green-400 text-sm">Estimated Profit</Text>
                  <Text className="text-green-400 font-bold text-lg">
                    +${offer.estimatedProfit.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Quality Requirements */}
              <View className="mb-4">
                <Text className="text-neutral-400 text-sm mb-2">Quality Requirements:</Text>
                <View className="flex-row flex-wrap gap-1">
                  {offer.qualityRequirements.map((req, index) => (
                    <View
                      key={index}
                      className="bg-neutral-800 border border-orange-400/30 px-2 py-1 rounded"
                    >
                      <Text className="text-orange-300 text-xs">{req}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Admin Note */}
              {offer.adminNote && (
                <View className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                  <View className="flex-row items-center mb-2">
                    <FileText color="#9CA3AF" size={16} />
                    <Text className="text-neutral-400 text-sm ml-2">Note from buyer:</Text>
                  </View>
                  <Text className="text-neutral-300 text-sm">{offer.adminNote}</Text>
                </View>
              )}

              {/* Acceptance Note */}
              <View className="mb-4">
                <Text className="text-neutral-400 text-sm mb-2">Optional note to buyer:</Text>
                <TextInput
                  value={acceptanceNote}
                  onChangeText={setAcceptanceNote}
                  placeholder="Thank you for your offer. I accept these terms..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white"
                  textAlignVertical="top"
                />
              </View>

              {/* Expiry Warning */}
              {offer.isExpiringSoon && (
                <View className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                  <View className="flex-row items-center">
                    <Calendar color="#FB923C" size={16} />
                    <Text className="text-orange-400 text-sm ml-2">
                      This offer expires in {offer.hoursUntilExpiry} hours
                    </Text>
                  </View>
                </View>
              )}
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
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg py-3 items-center justify-center"
                style={{
                  shadowColor: '#10B981',
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
                    <Check color="#FFFFFF" size={18} />
                  )}
                  <Text className="text-white font-bold ml-2">
                    {isLoading ? 'Accepting...' : 'Accept Offer'}
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
