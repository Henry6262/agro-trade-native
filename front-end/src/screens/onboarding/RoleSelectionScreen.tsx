import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, ShoppingBag, Truck } from 'lucide-react-native';
import { useOnboardingStore } from '../../store/onboardingStore';

type RoleSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RoleSelection'
>;

interface RoleCardProps {
  role: 'buyer' | 'seller' | 'transport';
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
  gradientColors: string[];
}

const RoleCard: React.FC<RoleCardProps> = ({
  title,
  description,
  icon,
  onSelect,
  gradientColors,
}) => (
  <TouchableOpacity onPress={onSelect} style={{ marginBottom: 20 }}>
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 12,
        padding: 24,
        minHeight: 180,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View style={{ marginBottom: 12 }}>
        {icon}
      </View>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 20
      }}>
        {description}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
);

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<RoleSelectionScreenNavigationProp>();
  const { setRole } = useOnboardingStore();

  const handleRoleSelect = (role: 'buyer' | 'seller' | 'transport') => {
    setRole(role);
    
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
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <ScrollView 
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: 'center'
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: 12
          }}>
            Welcome to Agro Trade
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#9CA3AF',
            textAlign: 'center',
            marginBottom: 40,
            lineHeight: 24
          }}>
            Choose your role to get started with the platform
          </Text>

          <RoleCard
            role="buyer"
            title="Buyer"
            description="Purchase agricultural products directly from verified sellers at competitive prices"
            icon={<ShoppingBag size={48} color="white" />}
            onSelect={() => handleRoleSelect('buyer')}
            gradientColors={['#3B82F6', '#1E40AF']}
          />

          <RoleCard
            role="seller"
            title="Seller"
            description="List and sell your agricultural products to a wide network of buyers"
            icon={<Users size={48} color="white" />}
            onSelect={() => handleRoleSelect('seller')}
            gradientColors={['#10B981', '#065F46']}
          />

          <RoleCard
            role="transport"
            title="Transporter"
            description="Provide transportation services for agricultural goods and earn competitive rates"
            icon={<Truck size={48} color="white" />}
            onSelect={() => handleRoleSelect('transport')}
            gradientColors={['#8B5CF6', '#5B21B6']}
          />
        </View>
      </ScrollView>
    </View>
  );
};