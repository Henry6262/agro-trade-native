import React from 'react';
import { View } from 'react-native';
import { LocationMapPicker, SelectedLocation } from './LocationMapPicker';

// Simple component test to verify it can be imported and used
const TestLocationMapPicker = () => {
  const handleLocationSelect = (location: SelectedLocation) => {
    console.log('Location selected:', location);
  };

  const handleLocationConfirm = (location: SelectedLocation) => {
    console.log('Location confirmed:', location);
  };

  return (
    <View style={{ flex: 1 }}>
      <LocationMapPicker
        title="Test Location Picker"
        onLocationSelect={handleLocationSelect}
        onLocationConfirm={handleLocationConfirm}
        height={400}
        showUserLocation={true}
        showSearchBar={true}
        confirmButtonText="Test Confirm"
      />
    </View>
  );
};

export default TestLocationMapPicker;
