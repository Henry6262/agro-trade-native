import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { Button } from '../../components/common/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { OnboardingStackParamList } from '../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'AccountCreation'>;

interface OAuthButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  icon: string;
  label: string;
  color: string;
  delay: number;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onPress,
  icon,
  label,
  color,
  delay,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const pressed = useSharedValue(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 500 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale, opacity]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: interpolate(pressed.value, [0, 1], [1, 0.95]) },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  };

  return (
    <Animated.View style={buttonStyle} className="mb-3">
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="w-full"
      >
        <View 
          className="flex-row items-center justify-center p-4 rounded-xl border-2 shadow-sm"
          style={{ 
            backgroundColor: '#ffffff',
            borderColor: color + '30'
          }}
        >
          <Text className="text-2xl mr-3">{icon}</Text>
          <Text className="text-gray-900 font-semibold text-base">
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

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
      : interpolateColor(
          focusAnimation.value,
          [0, 1],
          ['#e5e7eb', '#3b82f6']
        );
    
    return {
      borderColor,
      borderWidth: interpolate(focusAnimation.value, [0, 1], [1, 2]),
    };
  });

  return (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-900 mb-2">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      
      <Animated.View style={containerStyle} className="bg-white rounded-xl shadow-sm">
        <TextInput
          className="p-4 text-base text-gray-900"
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
        <Text className="text-red-500 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
};

export const AccountCreationScreen: React.FC<Props> = ({ navigation }) => {
  const { selectedRole, completeOnboarding } = useOnboardingStore();

  const [authMethod, setAuthMethod] = useState<'oauth' | 'email' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentOpacity.value = withTiming(1, { duration: 800 });
  }, [headerOpacity, contentOpacity]);

  React.useEffect(() => {
    if (authMethod === 'email') {
      formOpacity.value = withTiming(1, { duration: 600 });
    } else {
      formOpacity.value = withTiming(0, { duration: 400 });
    }
  }, [authMethod, formOpacity]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: interpolate(formOpacity.value, [0, 1], [20, 0]) }],
  }));

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);
    
    try {
      // TODO: Implement actual OAuth integration
      // For now, simulate OAuth success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful OAuth response
      Alert.alert(
        'OAuth Success',
        `Successfully signed in with ${provider}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              completeOnboarding();
              navigation.navigate('OnboardingComplete');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // TODO: Implement actual email sign-up
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      completeOnboarding();
      navigation.navigate('OnboardingComplete');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = () => {
    switch (selectedRole) {
      case 'seller':
        return 'Seller';
      case 'buyer':
        return 'Buyer';
      case 'transport':
        return 'Transport Provider';
      default:
        return 'User';
    }
  };

  const getRoleIcon = () => {
    switch (selectedRole) {
      case 'seller':
        return '🌾';
      case 'buyer':
        return '🏭';
      case 'transport':
        return '🚛';
      default:
        return '👤';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <OnboardingProgress />
        </View>

        {/* Title Section */}
        <Animated.View style={headerStyle} className="px-6 py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Create Your Account
          </Text>
          <Text className="text-base text-gray-600 leading-6 mb-4">
            You're almost done! Create your account to start as a {getRoleDisplayName()}
          </Text>

          {/* Role Summary */}
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">{getRoleIcon()}</Text>
              <View>
                <Text className="text-lg font-semibold text-gray-900">
                  {getRoleDisplayName()}
                </Text>
                <Text className="text-gray-600">
                  Your onboarding profile is ready
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Animated.View style={contentStyle} className="px-6">
            {!authMethod && (
              <>
                {/* OAuth Options */}
                <View className="mb-8">
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Sign Up
                  </Text>
                  
                  <OAuthButton
                    provider="google"
                    onPress={() => handleOAuthSignIn('google')}
                    icon="🔍"
                    label="Continue with Google"
                    color="#4285f4"
                    delay={0}
                  />
                  
                  <OAuthButton
                    provider="apple"
                    onPress={() => handleOAuthSignIn('apple')}
                    icon="🍎"
                    label="Continue with Apple"
                    color="#000000"
                    delay={100}
                  />
                  
                  <OAuthButton
                    provider="facebook"
                    onPress={() => handleOAuthSignIn('facebook')}
                    icon="📘"
                    label="Continue with Facebook"
                    color="#1877f2"
                    delay={200}
                  />
                </View>

                {/* Divider */}
                <View className="flex-row items-center mb-8">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-4 text-gray-500">or</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                {/* Email Option */}
                <Button
                  title="Sign up with Email"
                  onPress={() => setAuthMethod('email')}
                  variant="outline"
                  size="large"
                  className="w-full"
                />
              </>
            )}

            {/* Email Form */}
            {authMethod === 'email' && (
              <Animated.View style={formStyle}>
                <View className="mb-6">
                  <TouchableOpacity
                    onPress={() => setAuthMethod(null)}
                    className="flex-row items-center mb-4"
                  >
                    <Text className="text-blue-600 text-base">← Back to options</Text>
                  </TouchableOpacity>
                  
                  <Text className="text-lg font-semibold text-gray-900 mb-4">
                    Create Account with Email
                  </Text>
                </View>

                <FormField
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  error={errors.name}
                  required
                />

                <FormField
                  label="Email Address"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  error={errors.email}
                  required
                />

                <FormField
                  label="Password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                  error={errors.password}
                  required
                />

                <FormField
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  secureTextEntry
                  error={errors.confirmPassword}
                  required
                />

                <FormField
                  label="Phone Number"
                  placeholder="Enter your phone number (optional)"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />

                <Button
                  title={isLoading ? "Creating Account..." : "Create Account"}
                  onPress={handleEmailSignUp}
                  disabled={isLoading}
                  variant="primary"
                  size="large"
                  className="w-full"
                />
              </Animated.View>
            )}

            {/* Terms and Privacy */}
            <View className="mt-8">
              <Text className="text-sm text-gray-600 text-center leading-5">
                By continuing, you agree to our{' '}
                <Text className="text-blue-600">Terms of Service</Text>
                {' '}and{' '}
                <Text className="text-blue-600">Privacy Policy</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};