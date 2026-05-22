import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingFlowScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding Flow</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    flex: 1,
    justifyContent: 'center',
  },
  text: { color: '#fff', fontSize: 20 },
});
