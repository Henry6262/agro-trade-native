import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import {
  X,
  AlertTriangle,
  DollarSign,
  Package,
  Truck,
  Clock,
  Star,
  MessageSquare,
  CheckCircle,
} from 'lucide-react-native';

import { Offer, RejectReason } from '../types';

interface RejectOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer: Offer | null;
  onConfirm: (offerId: string, reason: string, message?: string) => void;
  isLoading?: boolean;
}

const REJECT_REASONS: RejectReason[] = [
  {
    id: 'price',
    label: 'Price too high',
    description: 'The offered price exceeds my budget',
    requiresMessage: false,
  },
  {
    id: 'quantity',
    label: 'Insufficient quantity',
    description: 'The offered quantity is less than needed',
    requiresMessage: false,
  },
  {
    id: 'quality',
    label: 'Quality specifications',
    description: 'The offered specifications do not meet requirements',
    requiresMessage: true,
  },
  {
    id: 'delivery',
    label: 'Delivery timeline',
    description: 'The delivery time is too long for my needs',
    requiresMessage: false,
  },
  {
    id: 'location',
    label: 'Location/logistics',
    description: 'Delivery location or logistics are not suitable',
    requiresMessage: false,
  },
  {
    id: 'seller',
    label: 'Seller concerns',
    description: 'Concerns about the seller or their credentials',
    requiresMessage: true,
  },
  {
    id: 'terms',
    label: 'Terms and conditions',
    description: 'The terms and conditions are not acceptable',
    requiresMessage: true,
  },
  {
    id: 'other',
    label: 'Other reason',
    description: 'A different reason not listed above',
    requiresMessage: true,
  },
];

export const RejectOfferModal: React.FC<RejectOfferModalProps> = ({
  visible,
  onClose,
  offer,
  onConfirm,
  isLoading = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [selectedReason, setSelectedReason] = useState<RejectReason | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setStep('select');
      setSelectedReason(null);
      setMessage('');
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

  const handleReasonSelect = (reason: RejectReason) => {
    setSelectedReason(reason);
    if (!reason.requiresMessage) {
      // Auto-proceed if no message required
      setTimeout(() => setStep('confirm'), 100);
    }
  };

  const handleContinue = () => {
    if (!selectedReason) return;
    
    if (selectedReason.requiresMessage && !message.trim()) {
      // Stay on selection step to allow message input
      return;
    }
    
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    onConfirm(
      offer.id, 
      selectedReason.id, 
      message.trim() || undefined
    );
    
    setStep('success');
    
    // Auto-close after success animation
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (step === 'success') return; // Prevent closing during success
    onClose();
    setStep('select');
    setSelectedReason(null);
    setMessage('');
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
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} className="justify-center items-center p-6">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="bg-neutral-900 rounded-2xl w-full max-w-md border border-neutral-700"
        >
          {step === 'select' && (
            <>
              {/* Header */}
              <View className="p-6 border-b border-neutral-700">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-bold text-white">Reject Offer</Text>
                  <TouchableOpacity onPress={handleClose}>
                    <X color="#9CA3AF" size={24} />
                  </TouchableOpacity>
                </View>
                <Text className="text-neutral-400 mt-1">
                  Please select a reason for rejecting this offer
                </Text>
              </View>

              {/* Offer Quick Summary */}
              <View className="p-4 bg-neutral-800/50 border-b border-neutral-700">
                <View className="flex-row justify-between items-center">
                  <Text className="text-neutral-300 text-sm">
                    {offer.seller?.name || 'Seller'}'s Offer
                  </Text>
                  <Text className="text-white font-semibold">
                    €{offer.pricePerUnit.toFixed(2)} × {offer.quantity} {offer.unit}
                  </Text>
                </View>
              </View>

              <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
                <View className="p-6">
                  <Text className="text-white font-semibold mb-4">Select a reason:</Text>
                  
                  <View className="space-y-3">
                    {REJECT_REASONS.map((reason) => (
                      <TouchableOpacity
                        key={reason.id}
                        onPress={() => handleReasonSelect(reason)}
                        className={`p-4 rounded-lg border ${
                          selectedReason?.id === reason.id
                            ? 'bg-red-500/20 border-red-500/50'
                            : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <Text className={`font-medium ${
                              selectedReason?.id === reason.id ? 'text-red-400' : 'text-white'
                            }`}>
                              {reason.label}
                            </Text>
                            <Text className={`text-sm mt-1 ${
                              selectedReason?.id === reason.id ? 'text-red-300' : 'text-neutral-400'
                            }`}>
                              {reason.description}
                            </Text>
                            {reason.requiresMessage && (
                              <View className="flex-row items-center mt-2">
                                <MessageSquare size={14} color="#FBBF24" />
                                <Text className="text-yellow-400 text-xs ml-1">Message required</Text>
                              </View>
                            )}
                          </View>
                          {selectedReason?.id === reason.id && (
                            <View className="ml-3">
                              <CheckCircle size={20} color="#EF4444" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Message Input for Selected Reason */}
                  {selectedReason?.requiresMessage && (
                    <View className="mt-6">
                      <Text className="text-white font-semibold mb-3">
                        Additional details {selectedReason.requiresMessage ? '(required)' : '(optional)'}
                      </Text>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder={`Please provide more details about ${selectedReason.label.toLowerCase()}...`}
                        placeholderTextColor="#6B7280"
                        className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-white min-h-20"
                        multiline
                        textAlignVertical="top"
                      />
                      {selectedReason.requiresMessage && !message.trim() && (
                        <Text className="text-red-400 text-sm mt-2">
                          Please provide additional details for this reason
                        </Text>
                      )}
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
                  >
                    <Text className="text-white font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleContinue}
                    disabled={!selectedReason || (selectedReason?.requiresMessage && !message.trim())}
                    className={`flex-1 rounded-lg py-3 items-center justify-center ${
                      selectedReason && (!selectedReason.requiresMessage || message.trim())
                        ? 'bg-red-500'
                        : 'bg-neutral-600'
                    }`}
                    style={
                      selectedReason && (!selectedReason.requiresMessage || message.trim())
                        ? {
                            shadowColor: '#EF4444',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 4,
                          }
                        : undefined
                    }
                  >
                    <Text className="text-white font-bold">Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {step === 'confirm' && selectedReason && (
            <>
              {/* Confirmation Header */}
              <View className="p-6 border-b border-neutral-700">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-bold text-white">Confirm Rejection</Text>
                  <TouchableOpacity onPress={handleClose}>
                    <X color="#9CA3AF" size={24} />
                  </TouchableOpacity>
                </View>
                <Text className="text-neutral-400 mt-1">Review your rejection details</Text>
              </View>

              <View className="p-6">
                {/* Rejection Summary */}
                <View className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <View className="flex-row items-start mb-3">
                    <AlertTriangle size={20} color="#EF4444" />
                    <Text className="text-red-400 font-semibold ml-2 flex-1">
                      Rejecting offer from {offer.seller?.name || 'Seller'}
                    </Text>
                  </View>
                  
                  <View className="ml-7">
                    <Text className="text-red-300 font-medium mb-1">Reason:</Text>
                    <Text className="text-red-300 text-sm">{selectedReason.label}</Text>
                    
                    {message.trim() && (
                      <>
                        <Text className="text-red-300 font-medium mt-3 mb-1">Additional details:</Text>
                        <Text className="text-red-200 text-sm">{message}</Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Offer Details */}
                <View className="bg-neutral-800/50 rounded-lg p-4 mb-6 border border-neutral-700">
                  <Text className="text-neutral-300 font-medium mb-3">Offer being rejected:</Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-neutral-400">Price</Text>
                      <Text className="text-white">€{offer.pricePerUnit.toFixed(2)} per {offer.unit}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-neutral-400">Quantity</Text>
                      <Text className="text-white">{offer.quantity} {offer.unit}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-neutral-400">Total Value</Text>
                      <Text className="text-white font-semibold">
                        €{(offer.pricePerUnit * offer.quantity).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Important Notice */}
                <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <View className="flex-row items-start">
                    <AlertTriangle size={16} color="#FBBF24" />
                    <Text className="text-yellow-300 text-sm ml-2 flex-1">
                      The seller will be notified of your rejection and the reason provided. 
                      This action cannot be undone.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Final Action Buttons */}
              <View className="p-6 border-t border-neutral-700">
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setStep('select')}
                    className="flex-1 bg-neutral-700 rounded-lg py-3 items-center justify-center"
                  >
                    <Text className="text-white font-semibold">Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={isLoading}
                    className="flex-1 bg-red-500 rounded-lg py-3 items-center justify-center"
                    style={{
                      shadowColor: '#EF4444',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <View className="flex-row items-center">
                      <X size={18} color="#FFFFFF" />
                      <Text className="text-white font-bold ml-2">
                        {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {step === 'success' && (
            <View className="p-8 items-center">
              <Animated.View
                style={{
                  transform: [{
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.1],
                    })
                  }]
                }}
                className="w-20 h-20 bg-red-500/20 rounded-full items-center justify-center mb-6"
              >
                <X size={40} color="#EF4444" />
              </Animated.View>
              
              <Text className="text-white font-bold text-xl text-center mb-2">
                Offer Rejected
              </Text>
              
              <Text className="text-red-400 text-center mb-4">
                The seller has been notified of your decision
              </Text>
              
              <Text className="text-neutral-400 text-sm text-center">
                Your rejection reason has been sent to help improve future offers. 
                You can continue browsing other offers.
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};