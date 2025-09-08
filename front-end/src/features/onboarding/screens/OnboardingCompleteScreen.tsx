import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../stores/auth.store';
import { useOnboardingStore } from '../../../stores/onboarding.store';

type OnboardingCompleteScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OnboardingComplete'
>;

interface Props {
  navigation: OnboardingCompleteScreenNavigationProp;
  route: any;
}

export const OnboardingCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { selectedRole, resetOnboarding } = useOnboardingStore();

  const handleContinue = () => {
    const userRole = selectedRole || user?.role;
    
    // Navigate to dashboard with success animation
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'Main', 
        params: { 
          screen: 'Dashboard',
          params: {
            screen: 'DashboardMain',
            params: {
              userRole: userRole,
              showSuccessAnimation: true
            }
          }
        } 
      }],
    });
    
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

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
      }}>
        <View style={{
          backgroundColor: '#10B981',
          borderRadius: 60,
          padding: 20,
          marginBottom: 32
        }}>
          <CheckCircle size={80} color="white" />
        </View>

        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          marginBottom: 16
        }}>
          Welcome to Agro Trade!
        </Text>

        <Text style={{
          fontSize: 18,
          color: '#9CA3AF',
          textAlign: 'center',
          marginBottom: 40,
          lineHeight: 28,
          maxWidth: 400
        }}>
          {getRoleSpecificMessage()}
        </Text>

        <TouchableOpacity
          onPress={handleContinue}
          style={{
            backgroundColor: '#3B82F6',
            paddingHorizontal: 48,
            paddingVertical: 16,
            borderRadius: 12,
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600'
          }}>
            Go to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};