/**
 * Sentry Test Button
 *
 * TEMPORARY COMPONENT FOR TESTING SENTRY INTEGRATION
 *
 * Usage: Add this to any screen temporarily to test Sentry:
 *
 * import { SentryTestButton } from '@/components/SentryTestButton';
 *
 * Then add <SentryTestButton /> to your JSX
 *
 * After verifying Sentry works, remove this component.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';

export const SentryTestButton: React.FC = () => {
  const testSentry = () => {
    try {
      // Send a test error to Sentry
      Sentry.captureException(new Error('Test error from AgroTrade - Google Sign-in test'));

      // Add breadcrumb
      Sentry.addBreadcrumb({
        message: 'User clicked test button',
        category: 'ui.click',
        level: 'info',
      });

      // Send a test message
      Sentry.captureMessage('Sentry integration test successful!', 'info');

      Alert.alert(
        'Test Sent!',
        'Check your Sentry dashboard:\nhttps://sentry.io/organizations/agrotrade/issues/\n\nYou should see a test error and message.',
        [{ text: 'OK' }]
      );

      console.log('✅ Sentry test error sent successfully');
    } catch (error) {
      console.error('❌ Failed to send test to Sentry:', error);
      Alert.alert('Error', 'Failed to send test to Sentry. Check console for details.');
    }
  };

  const testCrash = () => {
    Alert.alert(
      'Test App Crash',
      'This will trigger an uncaught error. The app will crash but Sentry will capture it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Crash',
          style: 'destructive',
          onPress: () => {
            // This will cause a crash
            throw new Error('Intentional crash for Sentry testing');
          },
        },
      ]
    );
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: '#9333EA',
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
      }}
    >
      <TouchableOpacity onPress={testSentry}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
          🧪 Test Sentry
        </Text>
      </TouchableOpacity>

      <View style={{ height: 8 }} />

      <TouchableOpacity onPress={testCrash}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
          💥 Test Crash
        </Text>
      </TouchableOpacity>

      <Text style={{ color: 'white', fontSize: 10, marginTop: 8, opacity: 0.8 }}>
        Remove after testing
      </Text>
    </View>
  );
};
