import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, Platform, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, ShoppingBag, Truck, LogIn } from 'lucide-react-native';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useAuthStore } from '../../store/authStore';
import { LottieRoleCard } from '../../components/onboarding/LottieRoleCard';
import { authService, GoogleAuthResponse } from '../../services/authService';
import { APP_CONFIG } from '../../constants';

type RoleSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RoleSelection'
>;

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RoleSelectionScreenNavigationProp>();
  const { setRole } = useOnboardingStore();
  const { login } = useAuthStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | 'transport' | null>(null);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert('Notice', message);
    }
  };

  const roleCards = [
    {
      id: 'buyer' as const,
      title: 'Buyer',
      animation: require('../../assets/animations/buyer.json'),
      color: '#3B82F6',
      gradient: ['#3B82F6', '#1E40AF'],
    },
    {
      id: 'seller' as const,
      title: 'Seller',
      animation: require('../../assets/animations/seller.json'),
      color: '#10B981',
      gradient: ['#10B981', '#065F46'],
    },
    {
      id: 'transport' as const,
      title: 'Transporter',
      animation: require('../../assets/animations/transporter.json'),
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#5B21B6'],
    },
  ];

  const handleRoleSelect = (role: 'buyer' | 'seller' | 'transport') => {
    setRole(role);
    setSelectedRole(role);
    
    // Navigate to the appropriate onboarding flow
    setTimeout(() => {
      switch (role) {
        case 'buyer':
          navigation.navigate('BuyerOnboardingFlow');
          break;
        case 'seller':
          navigation.navigate('SellerOnboardingFlow');
          break;
        case 'transport':
          navigation.navigate('TransporterOnboardingFlow');
          break;
      }
    }, 200);
  };

  const handleExistingUserSignIn = async () => {
    setIsSigningIn(true);
    
    try {
      // For existing users, redirect to Google OAuth without role selection
      const apiUrl = APP_CONFIG.API_URL;
      const googleOAuthUrl = `${apiUrl}/auth/google`;
      
      if (Platform.OS === 'web') {
        // Store current state
        localStorage.setItem('isExistingUserSignIn', 'true');
        
        // Redirect to Google OAuth
        window.location.href = googleOAuthUrl;
      } else {
        Alert.alert(
          'Sign in with Google', 
          'Google authentication will open in your browser. Please complete the authentication and return to the app.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsSigningIn(false),
            },
            {
              text: 'Continue',
              onPress: () => {
                Alert.alert('OAuth URL', googleOAuthUrl);
                setIsSigningIn(false);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Google authentication failed:', error);
      showToast('Failed to sign in with Google. Please try again.');
      setIsSigningIn(false);
    }
  };

  // Check for existing user sign-in result on component mount
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      // Check if we're returning from existing user OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const hasProfile = urlParams.get('hasProfile');
      
      if (token && localStorage.getItem('isExistingUserSignIn') === 'true') {
        localStorage.removeItem('isExistingUserSignIn');
        
        if (hasProfile === 'false') {
          // Show toast that user needs to create an account
          showToast('No account found. Please create a new account by selecting your role below.');
        } else {
          // User has profile, redirect to dashboard
          // This would be handled by the auth flow
          console.log('User authenticated with existing profile');
        }
      }
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView 
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 60,
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          {/* Header - Simplified with just logo */}
          <View style={{ marginBottom: 48, alignItems: 'center' }}>
            <LinearGradient
              colors={['#3B82F6', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 20,
              }}
            >
              <Text style={{
                fontSize: 42,
                fontWeight: 'bold',
                color: 'white',
                textAlign: 'center',
              }}>
                AgroTrade
              </Text>
            </LinearGradient>
          </View>

          {/* Sign In Button for Existing Users - More prominent */}
          <TouchableOpacity
            onPress={handleExistingUserSignIn}
            disabled={isSigningIn}
            style={{
              marginBottom: 32,
            }}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <LogIn size={24} color="white" style={{ marginRight: 12 }} />
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                {isSigningIn ? 'Signing in...' : 'Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 32,
          }}>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
            }} />
            <Text style={{
              color: '#94A3B8',
              marginHorizontal: 16,
              fontSize: 14,
              fontWeight: '500',
            }}>
              OR CREATE NEW ACCOUNT
            </Text>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
            }} />
          </View>

          {/* Role Cards - Compact with Lottie Animations */}
          <View>
            {roleCards.map((card, index) => (
              <LottieRoleCard
                key={card.id}
                id={card.id}
                title={card.title}
                animationSource={card.animation}
                color={card.color}
                gradient={card.gradient}
                isSelected={selectedRole === card.id}
                onPress={() => handleRoleSelect(card.id)}
                delay={index * 100}
              />
            ))}
          </View>

          {/* Footer */}
          <Text style={{
            color: '#64748B',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 32,
            lineHeight: 18,
          }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};