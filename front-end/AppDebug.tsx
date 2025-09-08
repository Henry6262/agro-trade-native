import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AppDebug() {
  useEffect(() => {
    console.log('=== APP DEBUG: Starting ===');
    
    try {
      // Test imports one by one
      console.log('1. Basic React Native components loaded');
      
      const testImports = async () => {
        try {
          console.log('2. Testing StatusBar from expo-status-bar');
          
          // Test navigation import
          console.log('3. Testing navigation import...');
          const nav = require('./src/navigation/RootNavigator');
          console.log('4. Navigation imported:', nav ? 'SUCCESS' : 'FAILED');
          
          // Test store import
          console.log('5. Testing store import...');
          const store = require('./src/stores/auth.store');
          console.log('6. Store imported:', store ? 'SUCCESS' : 'FAILED');
          
          // Test components
          console.log('7. Testing component import...');
          const scrollFix = require('./src/shared/components/ScrollFix');
          console.log('8. Component imported:', scrollFix ? 'SUCCESS' : 'FAILED');
          
        } catch (error) {
          console.error('Import test failed:', error);
        }
      };
      
      testImports();
      
    } catch (error) {
      console.error('=== APP DEBUG ERROR ===', error);
    }
  }, []);
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Debug Mode
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>
          If you see this screen, basic React Native is working.
        </Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          Check the console logs for import test results.
        </Text>
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0' }}>
          <Text style={{ fontSize: 12 }}>
            Tests running:{'\n'}
            1. Basic components{'\n'}
            2. Expo StatusBar{'\n'}
            3. Navigation{'\n'}
            4. Stores{'\n'}
            5. Custom components
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}