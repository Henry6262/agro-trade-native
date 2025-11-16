import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Clock, MapPin, Navigation, Package } from 'lucide-react-native';
import type {
  InspectorVerificationJob,
  InspectorVerificationFormValues,
  InspectorLocationCoordinates,
} from '../types';
import { VerificationForm } from './VerificationForm';

interface ActiveJobContentProps {
  job: InspectorVerificationJob | null;
  isLoading: boolean;
  error: string | null;
  currentLocation: InspectorLocationCoordinates | null;
  showVerificationForm: boolean;
  onStartVerification: () => void;
  onCancelVerification: () => void;
  onSubmitVerification: (values: InspectorVerificationFormValues) => void | Promise<void>;
  testID?: string;
  accessibilityLabel?: string;
}

export const ActiveJobContent: React.FC<ActiveJobContentProps> = ({
  job,
  isLoading,
  error,
  currentLocation,
  showVerificationForm,
  onStartVerification,
  onCancelVerification,
  onSubmitVerification,
  testID,
  accessibilityLabel,
}) => {
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-500 mt-4">Loading active job…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-lg font-semibold text-red-500">{error}</Text>
        <Text className="text-gray-500 mt-2 text-center">Please pull to refresh.</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Package size={64} color="#9ca3af" />
        <Text className="text-xl font-semibold text-gray-700 mt-4">No Active Job</Text>
        <Text className="text-gray-500 text-center mt-2">Accept a job from the Available Jobs tab</Text>
      </View>
    );
  }

  const inspectorLocation = currentLocation ?? {
    latitude: job.location.latitude,
    longitude: job.location.longitude,
    address: job.location.address,
  };

  return (
    <ScrollView className="flex-1 bg-white" testID={testID} accessibilityLabel={accessibilityLabel}>
      <View className="bg-green-50 px-4 py-3 border-b border-green-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-gray-800">{job.productDetails.name}</Text>
            <Text className="text-sm text-gray-600">{job.location.address}</Text>
          </View>
          <View className="bg-green-600 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">{job.status.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 256 }}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: (inspectorLocation.latitude + job.location.latitude) / 2,
            longitude: (inspectorLocation.longitude + job.location.longitude) / 2,
            latitudeDelta: Math.abs(inspectorLocation.latitude - job.location.latitude) * 1.5 || 0.2,
            longitudeDelta:
              Math.abs(inspectorLocation.longitude - job.location.longitude) * 1.5 || 0.2,
          }}
        >
          <Marker coordinate={{ latitude: inspectorLocation.latitude, longitude: inspectorLocation.longitude }} title="Your Location">
            <View className="bg-blue-500 p-2 rounded-full">
              <Navigation size={20} color="white" />
            </View>
          </Marker>
          <Marker
            coordinate={{ latitude: job.location.latitude, longitude: job.location.longitude }}
            title="Job Location"
          >
            <View className="bg-red-500 p-2 rounded-full">
              <MapPin size={20} color="white" />
            </View>
          </Marker>
          <Polyline
            coordinates={[
              { latitude: inspectorLocation.latitude, longitude: inspectorLocation.longitude },
              { latitude: job.location.latitude, longitude: job.location.longitude },
            ]}
            strokeColor="#22c55e"
            strokeWidth={3}
          />
        </MapView>
        <View className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow">
          <Text className="text-sm font-medium">{job.distance ?? 12.3} km remaining</Text>
        </View>
      </View>

      <View className="p-4 space-y-4">
        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Product Details</Text>
          <View className="bg-gray-50 p-3 rounded-lg">
            <Text className="font-medium">{job.productDetails.type}</Text>
            <Text className="text-gray-600">
              Quantity: {job.productDetails.quantity} {job.productDetails.unit}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Claimed Specifications</Text>
          <View className="bg-gray-50 p-3 rounded-lg">
            {Object.entries(job.productDetails.claimedSpecs).map(([key, value]) => (
              <Text key={key} className="text-gray-600">
                {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
              </Text>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-700 mb-2">Location</Text>
          <View className="bg-gray-50 p-3 rounded-lg">
            <Text className="font-medium">{job.location.address}</Text>
            <Text className="text-gray-600">
              {job.location.city ?? 'Unknown'}, {job.location.region ?? ''}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Clock size={16} color="#6b7280" />
          <Text className="text-gray-600 ml-2">
            Estimated duration: {job.estimatedDuration ?? 45} minutes
          </Text>
        </View>

        {!showVerificationForm && (
          <TouchableOpacity onPress={onStartVerification} className="bg-green-600 py-3 rounded-lg">
            <Text className="text-white text-center font-semibold">Start Verification</Text>
          </TouchableOpacity>
        )}

        {showVerificationForm && (
          <View className="mt-4">
            <VerificationForm job={job} onSubmit={onSubmitVerification} onCancel={onCancelVerification} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};
