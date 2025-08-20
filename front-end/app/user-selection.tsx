import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';

type UserRole = 'seller' | 'buyer' | 'transport';

const roleData = [
  {
    id: 'seller',
    title: 'Seller',
    description: 'I want to sell agricultural products',
    icon: '🌾',
    color: '#10b981',
    features: [
      'List your products',
      'Manage inventory',
      'Track orders',
      'Analytics dashboard'
    ]
  },
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'I want to buy agricultural products',
    icon: '🛒',
    color: '#3b82f6',
    features: [
      'Browse products',
      'Compare prices',
      'Track deliveries',
      'Secure payments'
    ]
  },
  {
    id: 'transport',
    title: 'Transport',
    description: 'I provide transport services',
    icon: '🚚',
    color: '#f59e0b',
    features: [
      'Manage fleet',
      'Accept deliveries',
      'Route optimization',
      'Real-time tracking'
    ]
  }
];

export default function UserSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    
    // Navigate to respective flow
    switch (selectedRole) {
      case 'seller':
        router.push('/seller/onboarding');
        break;
      case 'buyer':
        router.push('/buyer/onboarding');
        break;
      case 'transport':
        router.push('/transport/onboarding');
        break;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <LinearGradient
        colors={['#f8fafc', '#e2e8f0']}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40, marginTop: 20 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
              Welcome to AgroTrade
            </Text>
            <Text style={{ fontSize: 18, color: '#6b7280', textAlign: 'center', maxWidth: 400 }}>
              Choose your role to get started with a personalized experience
            </Text>
          </View>

          {/* Role Cards */}
          <View style={{ flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center' }}>
            {roleData.map((role) => (
              <TouchableOpacity
                key={role.id}
                onPress={() => handleRoleSelect(role.id as UserRole)}
                style={{
                  backgroundColor: selectedRole === role.id ? role.color : '#ffffff',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                  borderWidth: 2,
                  borderColor: selectedRole === role.id ? role.color : '#e5e7eb',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 40, marginRight: 16 }}>{role.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 24, 
                      fontWeight: 'bold', 
                      color: selectedRole === role.id ? '#ffffff' : '#111827',
                      marginBottom: 4 
                    }}>
                      {role.title}
                    </Text>
                    <Text style={{ 
                      fontSize: 16, 
                      color: selectedRole === role.id ? '#ffffff' : '#6b7280' 
                    }}>
                      {role.description}
                    </Text>
                  </View>
                </View>
                
                {/* Features */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                  {role.features.map((feature, index) => (
                    <View 
                      key={index}
                      style={{
                        backgroundColor: selectedRole === role.id ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ 
                        fontSize: 14, 
                        color: selectedRole === role.id ? '#ffffff' : '#4b5563' 
                      }}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Continue Button */}
          <View style={{ paddingVertical: 20 }}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!selectedRole}
              style={{
                backgroundColor: selectedRole ? '#111827' : '#e5e7eb',
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                maxWidth: 400,
                width: '100%',
                alignSelf: 'center',
              }}
            >
              <Text style={{ 
                color: selectedRole ? '#ffffff' : '#9ca3af', 
                fontSize: 18, 
                fontWeight: '600' 
              }}>
                Continue as {selectedRole ? roleData.find(r => r.id === selectedRole)?.title : '...'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}