import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check } from 'lucide-react-native';
import { Button } from '../../common/Button';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../../../services/authService';
import { UserRole } from '../../../types';
import { APP_CONFIG } from '../../../constants';

interface InlineAuthProps {
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
}) => (
  <View className="mb-4">
    <Text className="text-neutral-300 text-sm mb-2 font-medium">
      {label}{required && <Text className="text-red-400"> *</Text>}
    </Text>
    <TextInput
      className={`bg-neutral-800/50 border border-neutral-600 text-white p-3 rounded-lg text-base ${
        error ? 'border-red-500' : 'border-neutral-600'
      }`}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
    {error && <Text className="text-red-400 text-xs mt-1">{error}</Text>}
  </View>
);

export const InlineAuth: React.FC<InlineAuthProps> = ({
  onClose,
  onComplete,
  userRole,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const { login } = useAuthStore();
  const onboardingStore = useOnboardingStore();
  const { selectedRole, sellerData, buyerData, googleAuthData } = onboardingStore;

  // Pre-fill form with Google auth data if returning from OAuth
  useEffect(() => {
    if (googleAuthData?.isAuthenticated) {
      console.log('Pre-filling form with Google auth data:', googleAuthData);
      
      // Pre-fill the auth data
      setEmail(googleAuthData.email || '');
      
      // Split the name into first and last
      if (googleAuthData.name) {
        const nameParts = googleAuthData.name.split(' ');
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
      }
      
      // Switch to signup mode to complete profile
      setAuthMode('signup');
      
      // Clear the Google auth data from store after using it
      onboardingStore.setGoogleAuthData({ name: '', email: '', isAuthenticated: false });
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (authMode === 'signup') {
      if (!firstName) newErrors.firstName = 'First name is required';
      if (!lastName) newErrors.lastName = 'Last name is required';
      if (!companyName) newErrors.companyName = 'Company name is required';
      if (!phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const response = await authService.login({ email, password });
        await login(email, password);
      } else {
        const response = await authService.register({
          email,
          password,
          name: `${firstName} ${lastName}`,
          role: selectedRole || userRole,
          phone: phoneNumber,
        });
        
        if (response) {
          await login(email, password);
        }
      }

      onComplete();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    setErrors({});
    
    try {
      if (provider === 'google') {
        // For Google OAuth, we need to redirect to the backend OAuth endpoint
        const apiUrl = APP_CONFIG.API_URL;
        const googleOAuthUrl = `${apiUrl}/auth/google`;
        
        // In React Native Web, we can use window.location for OAuth redirect
        if (Platform.OS === 'web') {
          // Store onboarding data and role before redirecting
          await onboardingStore.saveOnboardingData();
          
          // Store the user role in the onboarding store before OAuth
          onboardingStore.setRole(userRole);
          
          // Redirect to Google OAuth
          window.location.href = googleOAuthUrl;
        } else {
          // For native platforms, show a message
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
                  Alert.alert('OAuth URL', googleOAuthUrl);
                },
              },
            ]
          );
        }
      } else {
        // TODO: Implement Microsoft OAuth
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

  return (
    <View className="bg-neutral-900 rounded-lg p-6 mx-4 my-6 border border-neutral-700">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-xl font-semibold">
          {authMode === 'login' ? 'Sign In' : 'Create Account'}
        </Text>
        <TouchableOpacity onPress={onClose} className="p-2">
          <X color="#9CA3AF" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* OAuth Buttons */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            onPress={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="bg-white border border-neutral-300 rounded-lg p-3 flex-row items-center justify-center space-x-2"
          >
            <Text className="text-neutral-900 font-medium">Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOAuthLogin('microsoft')}
            disabled={isLoading}
            className="bg-blue-600 rounded-lg p-3 flex-row items-center justify-center space-x-2"
          >
            <Text className="text-white font-medium">Continue with Microsoft</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-neutral-600" />
          <Text className="text-neutral-400 text-sm mx-4">or</Text>
          <View className="flex-1 h-px bg-neutral-600" />
        </View>

        {/* Form Fields */}
        {authMode === 'signup' && (
          <>
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <FormField
                  label="First Name"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={errors.firstName}
                  required
                />
              </View>
              <View className="flex-1">
                <FormField
                  label="Last Name"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  error={errors.lastName}
                  required
                />
              </View>
            </View>

            <FormField
              label="Company Name"
              placeholder="Your Company"
              value={companyName}
              onChangeText={setCompanyName}
              error={errors.companyName}
              required
            />

            <FormField
              label="Phone Number"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              required
            />
          </>
        )}

        <FormField
          label="Email"
          placeholder="john@company.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
          required
        />

        <FormField
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
          required
        />

        {authMode === 'signup' && (
          <FormField
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
            required
          />
        )}

        {/* Submit Button */}
        <Button
          title={authMode === 'login' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={isLoading}
          className="mt-6 bg-blue-600 hover:bg-blue-700"
          fullWidth
        />

        {/* Toggle Auth Mode */}
        <View className="flex-row justify-center items-center mt-4">
          <Text className="text-neutral-400 text-sm">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity
            onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          >
            <Text className="text-blue-400 text-sm font-medium">
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};