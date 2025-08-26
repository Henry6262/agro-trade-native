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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { X, Check } from 'lucide-react-native';
import { Button } from '../../common/Button';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { useAuthStore } from '../../../store/authStore';
import { authService, CompanyInfo } from '../../../services/authService';
import { UserRole } from '../../../types';
import { APP_CONFIG } from '../../../constants';

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
  const [currentStep, setCurrentStep] = useState<'auth' | 'details'>('auth');
  const [authMethod, setAuthMethod] = useState<'oauth' | 'email' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      // Check if we have Google auth data to pre-fill
      const googleAuthData = onboardingStore.googleAuthData;
      if (googleAuthData?.isAuthenticated) {
        console.log('Pre-filling form with Google auth data:', googleAuthData);
        
        // Pre-fill the auth data
        setAuthData(prev => ({
          ...prev,
          name: googleAuthData.name || '',
          email: googleAuthData.email || '',
        }));
        
        // Skip to business details step since we're already authenticated
        setCurrentStep('details');
        setAuthMethod('oauth');
        
        // Clear the Google auth data from store after using it
        onboardingStore.setGoogleAuthData({ name: '', email: '', isAuthenticated: false });
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
        const apiUrl = APP_CONFIG.API_URL || 'http://localhost:4000/api';
        const googleOAuthUrl = `${apiUrl}/auth/google`;
        
        // In React Native Web, we can use window.location for OAuth redirect
        if (Platform.OS === 'web') {
          // Store onboarding data and modal state before redirecting
          await onboardingStore.saveOnboardingData();
          
          // Store the user role in the onboarding store before OAuth
          onboardingStore.setRole(userRole);
          
          // Redirect to Google OAuth
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
      // For email signup, we'll collect the data and move to details step
      // The actual registration happens in handleComplete with all data
      setCurrentStep('details');
    } catch (error: any) {
      console.error('Email signup preparation failed:', error);
      Alert.alert('Error', 'Failed to proceed. Please try again.');
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
                    {currentStep === 'auth' ? 'Create Account' : 'Business Details'}
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
                {storeError && (
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
                {currentStep === 'auth' && (
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

                {currentStep === 'details' && (
                  <>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 24,
                      padding: 16,
                      backgroundColor: '#dcfce7',
                      borderRadius: 12
                    }}>
                      <Check size={20} color="#16a34a" />
                      <Text style={{ marginLeft: 8, color: '#16a34a', fontWeight: '500' }}>
                        Account created successfully!
                      </Text>
                    </View>

                    <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24, textAlign: 'center' }}>
                      Complete your business profile to get started
                    </Text>

                    <FormField
                      label="Company Name"
                      placeholder="Enter your company name"
                      value={businessData.companyName}
                      onChangeText={(text) => setBusinessData({ ...businessData, companyName: text })}
                      error={errors.companyName}
                      required
                    />

                    <FormField
                      label="VAT Number / Company ID"
                      placeholder="Enter your VAT number or company ID"
                      value={businessData.vatNumber}
                      onChangeText={(text) => setBusinessData({ ...businessData, vatNumber: text })}
                      error={errors.vatNumber}
                      required
                    />

                    <FormField
                      label="Business Type"
                      placeholder="e.g., Agriculture, Manufacturing, Logistics"
                      value={businessData.businessType}
                      onChangeText={(text) => setBusinessData({ ...businessData, businessType: text })}
                    />

                    <FormField
                      label="Contact Number"
                      placeholder="Enter your business phone number"
                      value={businessData.contactNumber}
                      onChangeText={(text) => setBusinessData({ ...businessData, contactNumber: text })}
                      keyboardType="phone-pad"
                      error={errors.contactNumber}
                      required
                    />

                    <Button
                      title={isProcessing ? "Completing Setup..." : "Complete Setup"}
                      onPress={handleComplete}
                      disabled={isProcessing}
                      variant="primary"
                      size="large"
                    />
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