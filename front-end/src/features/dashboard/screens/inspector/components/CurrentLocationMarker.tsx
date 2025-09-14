import React from 'react';
import { View } from 'react-native';
import { Navigation } from 'lucide-react-native';

interface CurrentLocationMarkerProps {
  size?: 'small' | 'medium' | 'large';
  isMoving?: boolean;
}

export const CurrentLocationMarker: React.FC<CurrentLocationMarkerProps> = ({ 
  size = 'medium',
  isMoving = false 
}) => {
  const getMarkerSize = () => {
    switch (size) {
      case 'small': return 36;
      case 'medium': return 48;
      case 'large': return 60;
      default: return 48;
    }
  };

  const markerSize = getMarkerSize();
  const iconSize = Math.round(markerSize * 0.4);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer pulse ring (animated when moving) */}
      <View
        style={{
          position: 'absolute',
          width: markerSize + 16,
          height: markerSize + 16,
          borderRadius: (markerSize + 16) / 2,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          opacity: isMoving ? 1 : 0.6,
        }}
      />
      
      {/* Middle ring */}
      <View
        style={{
          position: 'absolute',
          width: markerSize + 8,
          height: markerSize + 8,
          borderRadius: (markerSize + 8) / 2,
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
        }}
      />

      {/* Main marker */}
      <View
        style={{
          width: markerSize,
          height: markerSize,
          borderRadius: markerSize / 2,
          backgroundColor: '#3b82f6', // blue-500
          borderWidth: 3,
          borderColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#3b82f6',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 10, // Android shadow
        }}
      >
        <Navigation 
          size={iconSize} 
          color="#ffffff"
          strokeWidth={2.5}
        />
      </View>
    </View>
  );
};