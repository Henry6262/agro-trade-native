import React, { useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';
import { CheckCircle, User } from 'lucide-react-native';
import { useOnboardingStore } from '../../store/onboardingStore';

interface ProfileCreationSuccessProps {
  onComplete: () => void;
  userName?: string;
  userEmail?: string;
}

export const ProfileCreationSuccess: React.FC<ProfileCreationSuccessProps> = ({
  onComplete,
  userName,
  userEmail,
}) => {
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);
  const checkmarkScale = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  const slideUp = new Animated.Value(50);

  const onboardingStore = useOnboardingStore();

  useEffect(() => {
    // Start animations in sequence
    Animated.sequence([
      // Fade in and scale up the container
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Scale up checkmark with bounce
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      // Fade in success text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Wait 2 seconds then complete
      setTimeout(() => {
        // Clear the Google auth data flag
        onboardingStore.setGoogleAuthData({ name: '', email: '', isAuthenticated: false });
        onComplete();
      }, 2000);
    });
  }, []);

  const { width } = Dimensions.get('window');

  return (
    <View className="flex-1 justify-center items-center bg-gray-900 p-6">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideUp }
          ],
          alignItems: 'center',
          width: Math.min(width * 0.9, 400),
        }}
      >
        {/* Glowing background effect */}
        <View
          className="absolute -inset-20 bg-emerald-500/20 rounded-full"
          style={{
            filter: 'blur(60px)',
          }}
        />

        {/* Main card */}
        <View className="bg-gray-800 rounded-3xl p-10 border border-gray-700 shadow-2xl items-center">
          {/* Profile Avatar with Checkmark */}
          <View className="relative mb-8">
            <View className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full items-center justify-center shadow-xl">
              <User size={60} color="white" strokeWidth={1.5} />
            </View>
            <Animated.View
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                transform: [{ scale: checkmarkScale }],
              }}
              className="bg-white rounded-full p-1 shadow-lg"
            >
              <View className="bg-emerald-500 rounded-full p-1">
                <CheckCircle size={36} color="white" strokeWidth={3} />
              </View>
            </Animated.View>
          </View>

          {/* Success Message */}
          <Animated.View style={{ opacity: textOpacity }} className="items-center">
            <Text className="text-3xl font-bold text-white mb-3">
              Welcome to AgroTrade!
            </Text>
            
            {userName && (
              <Text className="text-xl text-gray-300 mb-2">
                Hi, {userName}! 👋
              </Text>
            )}
            
            <Text className="text-gray-400 text-center mb-2">
              Your profile has been created successfully
            </Text>
            
            {userEmail && (
              <Text className="text-gray-500 text-sm">
                {userEmail}
              </Text>
            )}
            
            <View className="mt-6 flex-row items-center">
              <View className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <Text className="text-gray-400 text-sm ml-2">
                Preparing your dashboard...
              </Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};