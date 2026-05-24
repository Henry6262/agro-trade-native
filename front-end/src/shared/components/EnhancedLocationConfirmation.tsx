import React from 'react';
import { View, Text } from 'react-native';

interface LocationCoords {
  latitude?: number | undefined;
  longitude?: number | undefined;
  address?: string | undefined;
  city?: string | undefined;
  region?: string | undefined;
  country?: string | undefined;
}

interface EnhancedLocationConfirmationProps {
  visible: boolean;
  onClose: () => void;
  location?: LocationCoords;
  initialLocation?: LocationCoords | undefined;
  address?: string;
  onConfirm?: (loc?: LocationCoords) => void;
  onEdit?: () => void;
}

export const EnhancedLocationConfirmation: React.FC<EnhancedLocationConfirmationProps> = () => {
  return (
    <View>
      <Text>Location Confirmation (stub)</Text>
    </View>
  );
};
