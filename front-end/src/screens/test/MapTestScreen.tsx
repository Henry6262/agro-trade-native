import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseManagementWithMaps } from '../../components/onboarding/base-management/BaseManagementWithMaps';

export const MapTestScreen = () => {
  return (
    <View style={styles.container}>
      <BaseManagementWithMaps />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapTestScreen;