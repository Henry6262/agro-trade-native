import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function TransportOnboarding() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f59e0b' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>🚚</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 }}>
          Welcome, Transport Provider!
        </Text>
        <Text style={{ fontSize: 18, color: '#ffffff', textAlign: 'center', marginBottom: 40, opacity: 0.9 }}>
          Connect with farmers and buyers to provide reliable transport services
        </Text>
        
        <View style={{ width: '100%', maxWidth: 400 }}>
          <TouchableOpacity
            onPress={() => router.push('/transport/fleet')}
            style={{
              backgroundColor: '#ffffff',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#f59e0b', fontSize: 18, fontWeight: '600' }}>
              Manage Your Fleet
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, opacity: 0.9 }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}