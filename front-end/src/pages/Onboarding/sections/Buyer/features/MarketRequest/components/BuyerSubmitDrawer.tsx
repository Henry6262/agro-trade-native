import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { X, ShoppingCart, Check, AlertCircle } from 'lucide-react-native';
import { GoogleAuthNative } from '@pages/Onboarding/components/shared/GoogleAuthNative';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useAuthStore } from '@stores/auth.store';
import { apiClient } from '@services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import PendingListingService from '@services/pendingListingService';

interface BuyerSubmitDrawerProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  specifications: any;
  onComplete?: () => void;
  onBack?: () => void;
}

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function BuyerSubmitDrawer({
  visible,
  onClose,
  productId,
  specifications,
  onComplete,
  onBack,
}: BuyerSubmitDrawerProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestCreated, setRequestCreated] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const successAnimScale = useRef(new Animated.Value(0)).current;
  const successAnimOpacity = useRef(new Animated.Value(0)).current;

  const { buyerSpecifications, selectedRole } = useOnboardingStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      // Check if authentication is needed
      if (!isAuthenticated) {
        setShowAuth(true);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    setShowAuth(false);
    setShowSuccess(false);
    setRequestCreated(false);
    // Reset animations
    successAnimScale.setValue(0);
    successAnimOpacity.setValue(0);
    onClose();
  };

  const handleAuthComplete = async () => {
    console.log('Authentication complete callback triggered');
    setShowAuth(false);

    // Wait a moment for auth state to update in store
    setTimeout(() => {
      const currentAuth = useAuthStore.getState();
      console.log('Auth state after delay:', {
        isAuthenticated: currentAuth.isAuthenticated,
        user: currentAuth.user?.email,
      });

      if (currentAuth.isAuthenticated) {
        handleSubmit();
      } else {
        console.error('Authentication failed - still not authenticated after delay');
      }
    }, 1000);
  };

  const handleSubmit = async () => {
    // Get fresh auth state
    const currentAuth = useAuthStore.getState();
    if (!currentAuth.isAuthenticated) {
      console.log('User not authenticated, showing auth modal');

      // Store the pending buyer listing data before authentication
      const buyerSpec = buyerSpecifications[productId] || specifications;
      const { location } = useOnboardingStore.getState();

      const pendingListing = {
        productId,
        specifications: buyerSpec,
        location,
        timestamp: Date.now(),
      };

      // Save to persistent storage so it survives OAuth redirect
      await PendingListingService.savePendingListing(pendingListing);

      setShowAuth(true);
      return;
    }

    console.log('User is authenticated, proceeding with submission');

    setIsSubmitting(true);
    try {
      const buyerSpec = buyerSpecifications[productId] || specifications;
      const { location } = useOnboardingStore.getState();

      // Parse delivery deadline to ISO string if provided
      let neededBy = null;
      if (buyerSpec.deliveryDeadline) {
        // Parse DD/MM/YYYY format
        const parts = buyerSpec.deliveryDeadline.split('/');
        if (parts.length === 3) {
          const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          neededBy = date.toISOString();
        }
      }

      // Create buy listing DTO matching backend expectations
      const buyListingData = {
        productId,
        quantity: parseFloat(buyerSpec.quantity || '0'),
        unit: 'TON' as const, // Map 'tons' to backend enum 'TON'
        maxPricePerUnit: parseFloat(buyerSpec.pricePerKilo || buyerSpec.maxPrice || '0'),
        neededBy,
        deliveryLocation: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
          city: location?.city,
          region: location?.region,
          country: location?.country,
          address: location?.address,
        },
        specifications: specifications || {},
        notes: buyerSpec.notes,
        status: 'ACTIVE',
      };

      console.log('=== Buy Listing Submission Debug ===');
      console.log('buyerSpec:', buyerSpec);
      console.log('specifications prop:', specifications);
      console.log('specifications keys:', Object.keys(specifications || {}));
      console.log('Final specifications being sent:', buyListingData.specifications);
      console.log('Full buyListingData:', JSON.stringify(buyListingData, null, 2));

      // WORKAROUND: Skip onboarding completely for now
      // The onboarding endpoint expects different data than what we have
      console.log('Skipping onboarding step - proceeding directly to listing creation');

      // Create the buy listing regardless of role
      console.log('Calling /buyer/listings with data:', buyListingData);
      console.log('Auth token present:', !!currentAuth.token);

      const response = await apiClient.post('/buyer/listings', buyListingData);

      console.log('Buy listing created successfully:', response.data);
      setRequestCreated(true);

      // Show success animation
      setShowSuccess(true);
      Animated.parallel([
        Animated.spring(successAnimScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 5,
        }),
        Animated.timing(successAnimOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error: any) {
      console.error('Failed to submit purchase request:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Show error to user
      Alert.alert(
        'Submission Failed',
        error.response?.data?.message || 'Failed to create purchase request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (showSuccess) {
      return (
        <Animated.View
          className="px-4 py-8"
          style={{
            opacity: successAnimOpacity,
            transform: [{ scale: successAnimScale }],
          }}
        >
          {/* Success State */}
          <View className="items-center mb-6">
            <View className="bg-emerald-600/20 p-4 rounded-full mb-4">
              <Check size={48} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-white mb-2">Request Submitted!</Text>
            <Text className="text-gray-400 text-center">
              Your purchase request has been sent to verified sellers
            </Text>
          </View>

          <View className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
            <Text className="text-gray-400 text-sm mb-2">What happens next?</Text>
            <Text className="text-white">
              • Sellers will review your request{'\n'}• You'll receive quotes within 24-48 hours
              {'\n'}• Compare offers and choose the best one
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => {
                handleClose();
                // Navigate to main app (dashboard)
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }}
              className="bg-blue-600 rounded-xl p-4"
            >
              <Text className="text-white font-semibold text-center text-base">
                Go to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    }

    if (showAuth) {
      return (
        <View className="flex-1">
          <GoogleAuthNative onComplete={handleAuthComplete} userRole="buyer" mode="inline" />
        </View>
      );
    }

    // Default state - confirm submission
    return (
      <View className="px-4 py-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white mb-2">Submit Purchase Request?</Text>
          <Text className="text-gray-400">Your request will be sent to verified sellers</Text>
        </View>

        <View className="bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-700/30">
          <View className="flex-row">
            <AlertCircle size={20} color="#60a5fa" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-400 font-semibold mb-1">Quick Setup</Text>
              <Text className="text-blue-300 text-sm">
                {isAuthenticated
                  ? 'Your request will be submitted immediately'
                  : 'Sign in with Google to submit your request'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={isAuthenticated ? handleSubmit : () => setShowAuth(true)}
          className="bg-blue-600 rounded-xl p-4 mb-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center justify-center">
              <ShoppingCart size={20} color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                {isAuthenticated ? 'Submit Request' : 'Sign In & Submit'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClose}
          className="bg-gray-800 rounded-xl p-4 border border-gray-700"
        >
          <Text className="text-gray-400 font-semibold text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/50">
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />

        <Animated.View
          className="bg-gray-900 rounded-t-3xl overflow-hidden"
          style={{
            transform: [{ translateY: slideAnim }],
            minHeight: Dimensions.get('window').height * 0.4,
            maxHeight: Dimensions.get('window').height * 0.8,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
            <TouchableOpacity onPress={onBack || handleClose} className="p-2">
              <Text className="text-blue-400 font-semibold">Back</Text>
            </TouchableOpacity>
            <View className="h-1 w-12 bg-gray-700 rounded-full" />
            <TouchableOpacity onPress={handleClose} className="p-2">
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
}
