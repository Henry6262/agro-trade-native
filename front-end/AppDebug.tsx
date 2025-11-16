import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AppDebug() {
  useEffect(() => {
    console.warn('=== APP DEBUG: Starting ===');

    try {
      const testImports = async () => {
        try {
          console.warn('1. Testing StatusBar from expo-status-bar');
          console.warn('2. Testing navigation import...');
          const navModule = await import('./src/navigation/RootNavigator');
          console.warn('Navigation imported:', navModule ? 'SUCCESS' : 'FAILED');

          console.warn('3. Testing store import...');
          const storeModule = await import('./src/stores/auth.store');
          console.warn('Store imported:', storeModule ? 'SUCCESS' : 'FAILED');

          console.warn('4. Testing shared component import...');
          const scrollFixModule = await import('./src/shared/components/ScrollFix');
          console.warn('Component imported:', scrollFixModule ? 'SUCCESS' : 'FAILED');
        } catch (error) {
          console.error('Import test failed:', error);
        }
      };

      void testImports();
    } catch (error) {
      console.error('=== APP DEBUG ERROR ===', error);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Debug Mode</Text>
        <Text style={styles.paragraph}>If you see this screen, basic React Native is working.</Text>
        <Text style={styles.secondaryText}>Check the console logs for import test results.</Text>
        <View style={styles.testList}>
          <Text style={styles.testListText}>
            {[
              'Tests running:',
              '1. Basic components',
              '2. Expo StatusBar',
              '3. Navigation',
              '4. Stores',
              '5. Custom components',
            ].join('\n')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
  },
  safeArea: {
    backgroundColor: '#fff',
    flex: 1,
  },
  secondaryText: {
    color: '#666',
    fontSize: 14,
  },
  testList: {
    backgroundColor: '#f0f0f0',
    marginTop: 20,
    padding: 10,
  },
  testListText: {
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
