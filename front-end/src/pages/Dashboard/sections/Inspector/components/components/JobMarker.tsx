import React from 'react';
import { View, Text } from 'react-native';
import { Package, AlertTriangle, Clock } from 'lucide-react-native';
import { VerificationJob, JobPriority } from '@features/dashboard/screens/inspector/types';

interface JobMarkerProps {
  job: VerificationJob;
  size?: 'small' | 'medium' | 'large';
  zoomLevel?: number;
}

export const JobMarker: React.FC<JobMarkerProps> = ({ job, size = 'medium', zoomLevel = 10 }) => {
  // Calculate responsive size based on zoom level
  const getMarkerSize = () => {
    const baseSize = {
      small: 40,
      medium: 50,
      large: 60,
    }[size];

    // Scale based on zoom level (typical zoom levels 1-20)
    const scaleFactor = Math.max(0.6, Math.min(1.4, zoomLevel / 12));
    return Math.round(baseSize * scaleFactor);
  };

  const getIconSize = () => {
    const markerSize = getMarkerSize();
    return Math.max(16, Math.min(24, markerSize * 0.4));
  };

  const getPriorityConfig = (priority: JobPriority) => {
    switch (priority) {
      case 'HIGH':
        return {
          backgroundColor: '#ef4444', // red-500
          borderColor: '#dc2626', // red-600
          shadowColor: '#ef4444',
          icon: AlertTriangle,
          textColor: '#ffffff',
        };
      case 'MEDIUM':
        return {
          backgroundColor: '#f59e0b', // amber-500
          borderColor: '#d97706', // amber-600
          shadowColor: '#f59e0b',
          icon: Clock,
          textColor: '#ffffff',
        };
      case 'LOW':
        return {
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db', // gray-300
          shadowColor: '#6b7280',
          icon: Package,
          textColor: '#374151', // gray-700
        };
      default:
        return {
          backgroundColor: '#6b7280', // gray-500
          borderColor: '#4b5563', // gray-600
          shadowColor: '#6b7280',
          icon: Package,
          textColor: '#ffffff',
        };
    }
  };

  const markerSize = getMarkerSize();
  const iconSize = getIconSize();
  const config = getPriorityConfig(job.priority);
  const IconComponent = config.icon;

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Main Marker Circle */}
      <View
        style={{
          width: markerSize,
          height: markerSize,
          borderRadius: markerSize / 2,
          backgroundColor: config.backgroundColor,
          borderWidth: 2,
          borderColor: config.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: config.shadowColor,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 8, // Android shadow
        }}
      >
        <IconComponent size={iconSize} color={config.textColor} strokeWidth={2.5} />
      </View>

      {/* Distance Badge */}
      {job.distance && (
        <View
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#ffffff',
            shadowColor: '#000000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '600',
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {job.distance}km
          </Text>
        </View>
      )}

      {/* Marker Pointer/Pin Effect */}
      <View
        style={{
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderTopWidth: 8,
          borderRightWidth: 6,
          borderBottomWidth: 0,
          borderLeftWidth: 6,
          borderTopColor: config.backgroundColor,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          marginTop: -1,
        }}
      />
    </View>
  );
};
