import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Check,
  X,
  AlertTriangle,
  DollarSign,
  Package,
  Truck,
  MapPin,
  Calendar,
  Star,
  Award,
  Shield,
  Info,
} from 'lucide-react-native';

import { Offer } from '../types';

interface AcceptOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer: Offer | null;
  buyerRequest: any;
  onConfirm: (offerId: string, notes?: string) => void;
  isLoading?: boolean;
}

export const AcceptOfferModal: React.FC<AcceptOfferModalProps> = ({
  visible,
  onClose,
  offer,
  buyerRequest,
  onConfirm,
  isLoading = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [step, setStep] = useState<'review' | 'confirm' | 'success'>('review');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setStep('review');
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

  const calculateTotalValue = () => {
    return (offer.pricePerUnit * offer.quantity).toLocaleString();
  };

  const calculateSavings = () => {
    if (!buyerRequest?.maxPricePerUnit) return null;
    const maxTotal = buyerRequest.maxPricePerUnit * offer.quantity;
    const offerTotal = offer.pricePerUnit * offer.quantity;
    const savings = maxTotal - offerTotal;
    return savings > 0 ? savings : null;
  };

  const getRiskAssessment = () => {
    const risks = [];
    const warnings = [];
    
    // Price risk
    if (buyerRequest?.maxPricePerUnit && offer.pricePerUnit > buyerRequest.maxPricePerUnit) {
      risks.push({
        type: 'price',
        message: `Price exceeds your maximum by €${(offer.pricePerUnit - buyerRequest.maxPricePerUnit).toFixed(2)}`,
        severity: 'high'
      });
    }
    
    // Quantity risk
    if (buyerRequest?.quantity && offer.quantity < buyerRequest.quantity) {
      const shortage = buyerRequest.quantity - offer.quantity;
      warnings.push({
        type: 'quantity',
        message: `Quantity is ${shortage} ${offer.unit} less than requested`,
        severity: 'medium'
      });
    }
    
    // Delivery risk
    if (offer.deliveryTerms?.deliveryTime > 14) {
      warnings.push({
        type: 'delivery',
        message: `Delivery time is ${offer.deliveryTerms.deliveryTime} days`,
        severity: 'low'
      });
    }
    
    // Seller verification
    if (!offer.seller?.verified) {
      warnings.push({
        type: 'seller',
        message: 'Seller is not verified on the platform',
        severity: 'medium'
      });
    }
    
    return { risks, warnings };
  };

  const handleConfirm = () => {
    if (step === 'review') {
      setStep('confirm');
    } else if (step === 'confirm') {
      onConfirm(offer.id, notes.trim() || undefined);
      setStep('success');
      
      // Auto-close after success animation
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    if (step === 'success') return; // Prevent closing during success
    onClose();
    setStep('review');
    setNotes('');
  };

  const savings = calculateSavings();
  const totalValue = calculateTotalValue();
  const { risks, warnings } = getRiskAssessment();

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
          {step === 'review' && (
            <>
              {/* Header */}
              <View className="p-6 border-b border-neutral-700">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-bold text-white">Accept Offer</Text>
                  <TouchableOpacity onPress={handleClose}>
                    <X color="#9CA3AF" size={24} />
                  </TouchableOpacity>
                </View>
                <Text className="text-neutral-400 mt-1">Review the offer details before accepting</Text>
              </View>

              <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
                <View className="p-6">
                  {/* Seller Info */}
                  <View className="bg-neutral-800 rounded-lg p-4 mb-4 border border-neutral-700">
                    <View className="flex-row items-center mb-3">
                      <Text className="text-white font-semibold text-lg flex-1">
                        {offer.seller?.businessName || offer.seller?.name || 'Seller'}
                      </Text>
                      {offer.seller?.verified && (
                        <View className="bg-green-500/20 p-1 rounded-full">
                          <Shield size={16} color="#10B981" />
                        </View>
                      )}
                    </View>
                    
                    <View className="space-y-2">
                      {offer.seller?.location && (
                        <View className="flex-row items-center">
                          <MapPin size={14} color="#10B981" />
                          <Text className="text-neutral-300 text-sm ml-2">
                            {offer.seller.location.city}, {offer.seller.location.country}
                          </Text>
                        </View>
                      )}
                      
                      {offer.seller?.rating && (
                        <View className="flex-row items-center">
                          <Star size={14} color="#FBBF24" fill="#FBBF24" />
                          <Text className="text-yellow-400 text-sm ml-2">
                            {offer.seller.rating.toFixed(1)} rating
                          </Text>
                          {offer.seller?.reviewCount && (
                            <Text className="text-neutral-400 text-sm ml-1">
                              ({offer.seller.reviewCount} reviews)
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Offer Summary */}
                  <View className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 mb-4 border border-green-500/30">
                    <Text className="text-green-400 font-semibold mb-3">Offer Summary</Text>
                    
                    <View className="space-y-3">
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <DollarSign size={16} color="#10B981" />
                          <Text className="text-neutral-300 ml-2">Price per unit</Text>
                        </View>
                        <Text className="text-white font-semibold">€{offer.pricePerUnit.toFixed(2)}</Text>
                      </View>
                      
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Package size={16} color="#10B981" />
                          <Text className="text-neutral-300 ml-2">Quantity</Text>
                        </View>
                        <Text className="text-white font-semibold">{offer.quantity} {offer.unit}</Text>
                      </View>
                      
                      {offer.deliveryTerms && (
                        <View className="flex-row justify-between items-center">
                          <View className="flex-row items-center">
                            <Truck size={16} color="#10B981" />
                            <Text className="text-neutral-300 ml-2">Delivery</Text>
                          </View>
                          <Text className="text-white font-semibold">{offer.deliveryTerms.deliveryTime} days</Text>
                        </View>
                      )}
                      
                      <View className="border-t border-green-500/20 pt-3">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-green-300 font-semibold">Total Value</Text>
                          <Text className="text-green-400 font-bold text-lg">€{totalValue}</Text>
                        </View>
                        
                        {savings && (
                          <View className="flex-row justify-between items-center mt-1">
                            <Text className="text-green-300 text-sm">You save</Text>
                            <Text className="text-green-400 font-semibold">€{savings.toLocaleString()}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Risk Assessment */}
                  {(risks.length > 0 || warnings.length > 0) && (
                    <View className="mb-4">
                      {risks.map((risk, index) => (
                        <View key={index} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-2">
                          <View className="flex-row items-start">
                            <AlertTriangle size={16} color="#EF4444" />
                            <Text className="text-red-400 text-sm ml-2 flex-1">{risk.message}</Text>
                          </View>
                        </View>
                      ))}
                      
                      {warnings.map((warning, index) => (
                        <View key={index} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2">
                          <View className="flex-row items-start">
                            <Info size={16} color="#FBBF24" />
                            <Text className="text-yellow-400 text-sm ml-2 flex-1">{warning.message}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Terms Notice */}
                  <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                    <View className="flex-row items-start">
                      <Info size={16} color="#3B82F6" />
                      <Text className="text-blue-300 text-xs ml-2 flex-1">
                        By accepting this offer, you agree to the seller's terms and conditions. 
                        Payment will be processed according to the platform's payment policy.
                      </Text>
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
                  >
                    <Text className="text-white font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleConfirm}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg py-3 items-center justify-center"
                    style={{
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-white font-bold">Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Confirmation Header */}
              <View className="p-6 border-b border-neutral-700">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-bold text-white">Confirm Acceptance</Text>
                  <TouchableOpacity onPress={handleClose}>
                    <X color="#9CA3AF" size={24} />
                  </TouchableOpacity>
                </View>
                <Text className="text-neutral-400 mt-1">Final step to accept the offer</Text>
              </View>

              <View className="p-6">
                {/* Final Confirmation */}
                <View className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-6 mb-6 border border-green-500/40 items-center">
                  <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-4">
                    <Check size={32} color="#10B981" />
                  </View>
                  
                  <Text className="text-white font-bold text-lg text-center mb-2">
                    Accept Offer from {offer.seller?.name}
                  </Text>
                  
                  <Text className="text-green-400 font-bold text-2xl text-center">
                    €{totalValue}
                  </Text>
                  
                  <Text className="text-neutral-300 text-center mt-2">
                    {offer.quantity} {offer.unit} at €{offer.pricePerUnit.toFixed(2)} per {offer.unit.toLowerCase()}
                  </Text>
                </View>

                {/* Important Notice */}
                <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <View className="flex-row items-start">
                    <AlertTriangle size={20} color="#FBBF24" />
                    <View className="ml-3 flex-1">
                      <Text className="text-yellow-400 font-semibold mb-1">Important</Text>
                      <Text className="text-yellow-300 text-sm">
                        Once you confirm, this acceptance is binding. Make sure you have 
                        reviewed all terms and are ready to proceed with the transaction.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Final Action Buttons */}
              <View className="p-6 border-t border-neutral-700">
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setStep('review')}
                    className="flex-1 bg-neutral-700 rounded-lg py-3 items-center justify-center"
                  >
                    <Text className="text-white font-semibold">Back</Text>
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
                      <Check size={18} color="#FFFFFF" />
                      <Text className="text-white font-bold ml-2">
                        {isLoading ? 'Confirming...' : 'Confirm & Accept'}
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
                className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6"
              >
                <Check size={40} color="#10B981" />
              </Animated.View>
              
              <Text className="text-white font-bold text-xl text-center mb-2">
                Offer Accepted!
              </Text>
              
              <Text className="text-green-400 text-center mb-4">
                Your acceptance has been sent to the seller
              </Text>
              
              <Text className="text-neutral-400 text-sm text-center">
                You'll receive a confirmation email and the seller will be notified. 
                Check your dashboard for updates.
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};