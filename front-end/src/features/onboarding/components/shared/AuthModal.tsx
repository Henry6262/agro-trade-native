import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { X, CheckCircle, User } from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useAuthStore } from '@stores/auth.store';
import { CompanyInfo } from '@services/authService';
import { UserRole } from '@shared/types';
import { ENV } from '@shared/utils/environment';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  userRole: UserRole;
}

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  error?: string;
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnimation = useSharedValue(0);

  React.useEffect(() => {
    focusAnimation.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused, focusAnimation]);

  const containerStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? '#ef4444'
      : interpolate(focusAnimation.value, [0, 1], [0xe5e7eb, 0x3b82f6]);
    
    return {
      borderColor: `#${borderColor.toString(16).padStart(6, '0')}`,
      borderWidth: interpolate(focusAnimation.value, [0, 1], [1, 2]),
    };
  });

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827', marginBottom: 8 }}>
        {label}
        {required && <Text style={{ color: '#ef4444' }}> *</Text>}
      </Text>
      
      <Animated.View style={[containerStyle, { backgroundColor: '#ffffff', borderRadius: 12 }]}>
        <TextInput
          style={{ padding: 16, fontSize: 16, color: '#111827' }}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
        />
      </Animated.View>
      
      {error && (
        <Text style={{ color: '#ef4444', fontSize: 14, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
};

interface OAuthButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  icon: string;
  label: string;
  color: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onPress,
  icon,
  label,
  color,
}) => {
  const pressed = useSharedValue(0);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.95]) }],
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  return (
    <Animated.View style={buttonStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          borderRadius: 12,
          backgroundColor: '#ffffff',
          borderWidth: 2,
          borderColor: color + '30',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
        <Text style={{ color: '#111827', fontWeight: '600', fontSize: 16 }}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onComplete,
  userRole,
}) => {
  const [currentStep, setCurrentStep] = useState<'auth' | 'details' | 'success'>('auth');
  const [authMethod, setAuthMethod] = useState<'oauth' | 'email' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{name: string, email: string}>({ name: '', email: '' });
  
  // Animation values for success screen
  const successFadeAnim = useSharedValue(0);
  const successScaleAnim = useSharedValue(0.3);
  const checkmarkScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  
  // Zustand stores
  const onboardingStore = useOnboardingStore();
  const authStore = useAuthStore();
  
  // Get loading and error states from onboarding store
  const storeIsLoading = onboardingStore.isLoading || onboardingStore.isSubmitting;
  const storeError = onboardingStore.error;
  
  const isProcessing = isLoading || storeIsLoading;
  
  // Step 1: Authentication
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // Step 2: Business Details
  const [businessData, setBusinessData] = useState({
    companyName: '',
    vatNumber: '',
    businessType: '',
    contactNumber: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const slideAnimation = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      slideAnimation.value = withTiming(1, { duration: 300 });
      
      // Check if we have Google auth data
      const googleAuthData = onboardingStore.googleAuthData;
      if (googleAuthData?.isAuthenticated) {
        console.log('Google auth successful, showing success animation:', googleAuthData);
        
        // Store data for success animation
        setSuccessData({
          name: googleAuthData.name || '',
          email: googleAuthData.email || ''
        });
        
        // Clear the Google auth data from store
        onboardingStore.setGoogleAuthData({ name: '', email: '', isAuthenticated: false });
        
        // Show success animation
        setShowSuccess(true);
        setCurrentStep('success');
        
        // Start success animations
        successFadeAnim.value = withTiming(1, { duration: 400 });
        successScaleAnim.value = withSpring(1, { friction: 4, tension: 40 });
        
        setTimeout(() => {
          checkmarkScale.value = withSpring(1, { friction: 3, tension: 40 });
        }, 400);
        
        setTimeout(() => {
          textOpacity.value = withTiming(1, { duration: 400 });
        }, 700);
        
        // Complete after animation
        setTimeout(() => {
          onComplete();
        }, 2500);
      }
    } else {
      slideAnimation.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  React.useEffect(() => {
    if (currentStep === 'details') {
      slideAnimation.value = withTiming(1, { duration: 300 });
    }
  }, [currentStep]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(slideAnimation.value, [0, 1], [500, 0]),
      },
    ],
  }));

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'seller':
        return 'Seller';
      case 'buyer':
        return 'Buyer';
      case 'transport':
        return 'Transport Provider';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'seller':
        return '🌾';
      case 'buyer':
        return '🏭';
      case 'transport':
        return '🚛';
      case 'admin':
        return '👤';
      default:
        return '👤';
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);
    setErrors({});
    
    try {
      if (provider === 'google') {
        // For Google OAuth, we need to redirect to the backend OAuth endpoint
        // The backend expects a GET request to /api/auth/google
        // Add prompt=select_account to force account selection
        const googleOAuthUrl = `${ENV.googleOAuthUrl}?prompt=select_account`;
        
        // In React Native Web, we can use window.location for OAuth redirect
        if (Platform.OS === 'web') {
          // Store onboarding data and modal state before redirecting
          await onboardingStore.saveOnboardingData();
          
          // Store the user role in the onboarding store before OAuth
          onboardingStore.setRole(userRole);
          
          // Redirect to Google OAuth with account selection
          window.location.href = googleOAuthUrl;
        } else {
          // For native platforms, we'd use a WebView or deep linking
          // For now, show a message that OAuth is only available on web
          Alert.alert(
            'OAuth on Mobile', 
            'Google authentication will open in your browser. Please complete the authentication and return to the app.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Continue',
                onPress: async () => {
                  // Store onboarding data before opening browser
                  await onboardingStore.saveOnboardingData();
                  
                  // Open OAuth URL in browser (requires expo-linking or react-native-linking)
                  // For now, we'll just show the URL
                  Alert.alert('OAuth URL', googleOAuthUrl);
                },
              },
            ]
          );
        }
      } else {
        // TODO: Implement Apple and Facebook OAuth
        Alert.alert('Coming Soon', `${provider} authentication will be available soon.`);
      }
    } catch (error: any) {
      console.error(`${provider} authentication failed:`, error);
      const errorMessage = error?.message || `Failed to sign in with ${provider}. Please try again.`;
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAuthForm = () => {
    const newErrors: Record<string, string> = {};

    if (!authData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!authData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!authData.password) {
      newErrors.password = 'Password is required';
    } else if (authData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (authData.password !== authData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBusinessForm = () => {
    const newErrors: Record<string, string> = {};

    if (!businessData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!businessData.vatNumber.trim()) {
      newErrors.vatNumber = 'VAT number is required';
    }

    if (!businessData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignUp = async () => {
    if (!validateAuthForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      // Skip business details - submit directly with minimal info
      const companyInfo: CompanyInfo = {
        companyName: authData.name + "'s Business",
        vatNumber: undefined,
        businessLicense: undefined,
        companyAddress: undefined,
        website: undefined,
        establishedYear: undefined,
      };

      const userInfo = {
        name: authData.name,
        email: authData.email,
        phone: undefined,
      };

      // Submit onboarding data to backend
      await onboardingStore.submitOnboarding(companyInfo, userInfo);
      
      // Success
      Alert.alert(
        'Welcome!', 
        `Your ${getRoleDisplayName()} account has been created successfully!`,
        [{ text: 'Get Started', onPress: onComplete }]
      );
    } catch (error: any) {
      console.error('Sign up failed:', error);
      const errorMessage = error?.message || 'Failed to create account. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!validateBusinessForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      // Prepare company info from business data
      const companyInfo: CompanyInfo = {
        companyName: businessData.companyName,
        vatNumber: businessData.vatNumber || undefined,
        businessLicense: undefined, // Could be added later
        companyAddress: undefined, // Could be added later  
        website: undefined, // Could be added later
        establishedYear: undefined, // Could be added later
      };

      // Prepare user info from auth data
      const userInfo = {
        name: authData.name,
        email: authData.email,
        phone: businessData.contactNumber || undefined,
      };

      // Submit onboarding data to backend
      await onboardingStore.submitOnboarding(companyInfo, userInfo);
      
      // If we get here, registration was successful
      Alert.alert(
        'Welcome!', 
        `Your ${getRoleDisplayName()} account has been created successfully!`,
        [{ text: 'Get Started', onPress: onComplete }]
      );
      
    } catch (error: any) {
      console.error('Complete registration failed:', error);
      const errorMessage = error?.message || 'Failed to complete setup. Please try again.';
      
      // Show more specific error if available
      if (error?.response?.data?.message) {
        Alert.alert('Registration Error', error.response.data.message);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('auth');
    setAuthMethod(null);
    setAuthData({ name: '', email: '', password: '', confirmPassword: '' });
    setBusinessData({ companyName: '', vatNumber: '', businessType: '', contactNumber: '' });
    setErrors({});
    
    // Clear onboarding store errors
    onboardingStore.clearError();
    
    onClose();
  };
  
  // Clear errors when component unmounts or becomes invisible
  React.useEffect(() => {
    if (!visible) {
      onboardingStore.clearError();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
        <Animated.View style={[modalStyle, { flex: 1, maxHeight: '90%' }]}>
          <LinearGradient
            colors={['#f8fafc', '#e2e8f0']}
            style={{ flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <SafeAreaView style={{ flex: 1 }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#e5e7eb'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{getRoleIcon()}</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                    Create Account
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
                  <X size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Global Error Display */}
                {storeError && currentStep !== 'success' && (
                  <View style={{
                    backgroundColor: '#fef2f2',
                    borderWidth: 1,
                    borderColor: '#fecaca',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '500' }}>
                      {storeError}
                    </Text>
                  </View>
                )}

                {/* Success Animation */}
                {currentStep === 'success' && showSuccess && (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
                    <Animated.View
                      style={{
                        opacity: successFadeAnim.value,
                        transform: [{ scale: successScaleAnim.value }],
                        alignItems: 'center',
                      }}
                    >
                      {/* Profile Avatar with Checkmark */}
                      <View style={{ position: 'relative', marginBottom: 32 }}>
                        <View style={{
                          width: 120,
                          height: 120,
                          backgroundColor: '#10b981',
                          borderRadius: 60,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <User size={60} color="white" strokeWidth={2} />
                        </View>
                        <Animated.View
                          style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            transform: [{ scale: checkmarkScale.value }],
                          }}
                        >
                          <View style={{
                            backgroundColor: 'white',
                            borderRadius: 24,
                            padding: 2,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                          }}>
                            <View style={{
                              backgroundColor: '#10b981',
                              borderRadius: 20,
                              padding: 4,
                            }}>
                              <CheckCircle size={32} color="white" strokeWidth={3} />
                            </View>
                          </View>
                        </Animated.View>
                      </View>

                      {/* Success Message */}
                      <Animated.View style={{ opacity: textOpacity.value, alignItems: 'center' }}>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                          Welcome to AgroTrade!
                        </Text>
                        
                        {successData.name && (
                          <Text style={{ fontSize: 20, color: '#374151', marginBottom: 8 }}>
                            Hi, {successData.name}! 👋
                          </Text>
                        )}
                        
                        <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 8 }}>
                          Your profile has been created successfully
                        </Text>
                        
                        {successData.email && (
                          <Text style={{ fontSize: 14, color: '#9ca3af' }}>
                            {successData.email}
                          </Text>
                        )}
                        
                        <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: 8,
                            height: 8,
                            backgroundColor: '#10b981',
                            borderRadius: 4,
                            marginRight: 8,
                          }} />
                          <Text style={{ fontSize: 14, color: '#6b7280' }}>
                            Preparing your dashboard...
                          </Text>
                        </View>
                      </Animated.View>
                    </Animated.View>
                  </View>
                )}

                {currentStep === 'auth' && !showSuccess && (
                  <>
                    <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
                      Create your account to start as a {getRoleDisplayName()}
                    </Text>

                    {!authMethod && (
                      <>
                        {/* OAuth Options */}
                        <View style={{ marginBottom: 32 }}>
                          <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
                            Quick Sign Up
                          </Text>
                          
                          <OAuthButton
                            provider="google"
                            onPress={() => handleOAuthSignIn('google')}
                            icon="🔍"
                            label="Continue with Google"
                            color="#4285f4"
                          />
                          
                          {/* Disabled for now - only Google auth is active
                          <OAuthButton
                            provider="apple"
                            onPress={() => handleOAuthSignIn('apple')}
                            icon="🍎"
                            label="Continue with Apple"
                            color="#000000"
                          />
                          
                          <OAuthButton
                            provider="facebook"
                            onPress={() => handleOAuthSignIn('facebook')}
                            icon="📘"
                            label="Continue with Facebook"
                            color="#1877f2"
                          />
                          */}
                        </View>

                        {/* Divider */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
                          <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
                          <Text style={{ marginHorizontal: 16, color: '#6b7280' }}>or</Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: '#d1d5db' }} />
                        </View>

                        {/* Email Option */}
                        <Button
                          title="Sign up with Email"
                          onPress={() => setAuthMethod('email')}
                          variant="outline"
                          size="large"
                        />
                      </>
                    )}

                    {/* Email Form */}
                    {authMethod === 'email' && (
                      <View>
                        <TouchableOpacity
                          onPress={() => setAuthMethod(null)}
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
                        >
                          <Text style={{ color: '#3b82f6', fontSize: 16 }}>← Back to options</Text>
                        </TouchableOpacity>

                        <FormField
                          label="Full Name"
                          placeholder="Enter your full name"
                          value={authData.name}
                          onChangeText={(text) => setAuthData({ ...authData, name: text })}
                          error={errors.name}
                          required
                        />

                        <FormField
                          label="Email Address"
                          placeholder="Enter your email"
                          value={authData.email}
                          onChangeText={(text) => setAuthData({ ...authData, email: text })}
                          keyboardType="email-address"
                          error={errors.email}
                          required
                        />

                        <FormField
                          label="Password"
                          placeholder="Create a password"
                          value={authData.password}
                          onChangeText={(text) => setAuthData({ ...authData, password: text })}
                          secureTextEntry
                          error={errors.password}
                          required
                        />

                        <FormField
                          label="Confirm Password"
                          placeholder="Confirm your password"
                          value={authData.confirmPassword}
                          onChangeText={(text) => setAuthData({ ...authData, confirmPassword: text })}
                          secureTextEntry
                          error={errors.confirmPassword}
                          required
                        />

                        <Button
                          title={isProcessing ? "Creating Account..." : "Create Account"}
                          onPress={handleEmailSignUp}
                          disabled={isProcessing}
                          variant="primary"
                          size="large"
                        />
                      </View>
                    )}
                  </>
                )}

              </ScrollView>

              {/* Terms and Privacy */}
              <View style={{ padding: 20, paddingTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', lineHeight: 18 }}>
                  By continuing, you agree to our{' '}
                  <Text style={{ color: '#3b82f6' }}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={{ color: '#3b82f6' }}>Privacy Policy</Text>
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};