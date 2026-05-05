import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';
import { CheckCircle } from 'lucide-react-native';
import { useAuthStore } from '@stores/auth.store';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useTourStore } from '@stores/tour.store';
import { GradientBackground, GlassCard, GlassButton, GlassBadge } from '@design-system';

type OnboardingCompleteScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'OnboardingComplete'
>;

interface Props {
  navigation: OnboardingCompleteScreenNavigationProp;
  route: any;
}

/**
 * Normalizes backend role formats to tour role type.
 * Handles different casing and aliases:
 * - 'BUYER', 'buyer' → 'buyer'
 * - 'SELLER', 'seller', 'FARMER', 'farmer' → 'seller'
 * - 'TRANSPORT', 'transport', 'TRANSPORTER', 'transporter' → 'transport'
 */
const normalizeToTourRole = (role: string): 'buyer' | 'seller' | 'transport' | null => {
  const lower = role.toLowerCase();
  if (lower === 'buyer') return 'buyer';
  if (lower === 'seller' || lower === 'farmer') return 'seller';
  if (lower === 'transport' || lower === 'transporter') return 'transport';
  return null;
};

export const OnboardingCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { selectedRole, resetOnboarding } = useOnboardingStore();
  const { startTour } = useTourStore();

  const handleContinue = () => {
    const userRole = selectedRole || user?.role;

    // Trigger character tour on first dashboard entry
    const rawRole = selectedRole || user?.role;
    if (rawRole && !useTourStore.getState().hasSeenTour) {
      const tourRole = normalizeToTourRole(rawRole);
      if (tourRole) {
        startTour(tourRole);
      }
    }

    // Navigate to dashboard with success animation via parent navigator
    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            params: {
              screen: 'Dashboard',
              params: {
                screen: 'DashboardMain',
                params: {
                  userRole: userRole,
                  showSuccessAnimation: true,
                },
              },
            },
          },
        ],
      }) as any
    );

    // Clear onboarding data
    resetOnboarding();
  };

  const getRoleSpecificMessage = () => {
    switch (selectedRole) {
      case 'buyer':
        return "You're all set to start purchasing quality agricultural products!";
      case 'seller':
        return "You're ready to connect with buyers and grow your business!";
      case 'transport':
        return "You're all set to start providing transportation services!";
      default:
        return "You're all set to start using Agro Trade!";
    }
  };

  const getRoleLabel = () => {
    switch (selectedRole) {
      case 'buyer':
        return 'Buyer';
      case 'seller':
        return 'Seller';
      case 'transport':
        return 'Transporter';
      default:
        return 'Member';
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          {/* Glowing checkmark circle */}
          <GlassCard
            tier="strong"
            borderRadius={60}
            style={{
              width: 120,
              height: 120,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              alignSelf: 'center',
              shadowColor: '#4ADE80',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 24,
              elevation: 12,
            }}
            animate
            delay={0}
          >
            <CheckCircle size={64} color="#4ADE80" />
          </GlassCard>

          {/* Title */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {"You're all set!"}
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.65)',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 24,
              maxWidth: 320,
            }}
          >
            {getRoleSpecificMessage()}
          </Text>

          {/* Role badge */}
          <GlassBadge
            label={getRoleLabel()}
            variant="success"
            size="md"
            style={{ marginBottom: 40 }}
          />

          {/* Enter Dashboard button */}
          <View style={{ width: '100%', maxWidth: 400 }}>
            <GlassButton
              label="Enter Dashboard"
              onPress={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};
