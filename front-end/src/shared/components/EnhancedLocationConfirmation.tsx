import React from 'react';
import { View, Text } from 'react-native';

interface EnhancedLocationConfirmationProps {
  location: { latitude: number; longitude: number };
  address?: string;
  onConfirm: () => void;
  onEdit: () => void;
}

export const EnhancedLocationConfirmation: React.FC<EnhancedLocationConfirmationProps> = () => {
  return (
    <View>
      <Text>Location Confirmation (stub)</Text>
    </View>
  );
};
