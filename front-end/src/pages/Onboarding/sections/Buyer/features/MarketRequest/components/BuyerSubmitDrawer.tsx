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
  StyleSheet,
} from 'react-native';
import { X, ShoppingCart, Check, AlertCircle } from 'lucide-react-native';
import { PrivyAuthNative } from '@pages/Onboarding/components/shared/PrivyAuthNative';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useAuthStore } from '@stores/auth.store';
import { apiClient } from '@services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp as StackNavigationProp } from '@react-navigation/native-stack';
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
  onBack,
}: BuyerSubmitDrawerProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [_requestCreated, setRequestCreated] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const successAnimScale = useRef(new Animated.Value(0)).current;
  const successAnimOpacity = useRef(new Animated.Value(0)).current;

  const { buyerSpecifications } = useOnboardingStore();
  const { isAuthenticated } = useAuthStore();

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
    setShowAuth(false);

    // Wait a moment for auth state to update in store
    setTimeout(() => {
      const currentAuth = useAuthStore.getState();

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
        unit: 'TON' as const,
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

      await apiClient.post('/buyer/listings', buyListingData);

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
          style={[
            styles.contentPad,
            {
              opacity: successAnimOpacity,
              transform: [{ scale: successAnimScale }],
            },
          ]}
        >
          {/* Success State */}
          <View style={styles.successIconWrap}>
            <View style={styles.successIcon}>
              <Check size={48} color="#4ADE80" />
            </View>
            <Text style={styles.successTitle}>Request Submitted!</Text>
            <Text style={styles.mutedText}>
              Your purchase request has been sent to verified sellers
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.mutedSmallText}>What happens next?</Text>
            <Text style={styles.bodyText}>
              • Sellers will review your request{'\n'}• You&apos;ll receive quotes within 24-48
              hours
              {'\n'}• Compare offers and choose the best one
            </Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={() => {
              handleClose();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (showAuth) {
      return (
        <View style={{ flex: 1 }}>
          <PrivyAuthNative onComplete={handleAuthComplete} userRole="buyer" mode="inline" />
        </View>
      );
    }

    // Default state - confirm submission
    return (
      <View style={styles.contentPad}>
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.drawerTitle}>Submit Purchase Request?</Text>
          <Text style={styles.mutedText}>Your request will be sent to verified sellers</Text>
        </View>

        <View style={styles.blueInfoBox}>
          <View style={{ flexDirection: 'row' }}>
            <AlertCircle size={20} color="#60A5FA" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.blueLabel}>Quick Setup</Text>
              <Text style={styles.blueSubtext}>
                {isAuthenticated
                  ? 'Your request will be submitted immediately'
                  : 'Sign in with Google to submit your request'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={isAuthenticated ? handleSubmit : () => setShowAuth(true)}
          style={styles.primaryBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={20} color="white" />
              <Text style={[styles.primaryBtnText, { marginLeft: 8 }]}>
                {isAuthenticated ? 'Submit Request' : 'Sign In & Submit'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleClose} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />

        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateY: slideAnim }],
              minHeight: Dimensions.get('window').height * 0.4,
              maxHeight: Dimensions.get('window').height * 0.8,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <TouchableOpacity onPress={onBack || handleClose} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.dragHandle} />
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: '#4ADE80',
    fontWeight: '600',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    flex: 1,
  },
  blueInfoBox: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    padding: 16,
  },
  blueLabel: {
    color: '#60A5FA',
    fontWeight: '600',
    marginBottom: 4,
  },
  blueSubtext: {
    color: 'rgba(147,197,253,0.8)',
    fontSize: 13,
  },
  bodyText: {
    color: '#FFFFFF',
    lineHeight: 22,
  },
  closeBtn: {
    padding: 8,
  },
  contentPad: {
    padding: 16,
    paddingBottom: 24,
  },
  dragHandle: {
    backgroundColor: 'rgba(74,222,128,0.3)',
    borderRadius: 2,
    height: 4,
    width: 48,
  },
  drawerContainer: {
    backgroundColor: 'rgba(3,15,9,0.97)',
    borderTopColor: 'rgba(74,222,128,0.2)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    elevation: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(74,222,128,0.1)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  drawerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    padding: 16,
  },
  mutedSmallText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 8,
  },
  mutedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 12,
    elevation: 6,
    marginBottom: 12,
    paddingVertical: 16,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryBtnText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderRadius: 50,
    justifyContent: 'center',
    marginBottom: 16,
    padding: 16,
  },
  successIconWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
