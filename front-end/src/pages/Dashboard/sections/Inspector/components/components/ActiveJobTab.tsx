import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Clock, Package } from 'lucide-react-native';
import { ActiveJobTabProps } from '../types';
import { VerificationForm } from './VerificationForm';

export const ActiveJobTab: React.FC<ActiveJobTabProps> = ({
  activeJob,
  currentLocation,
  onStartVerification,
  onCompleteVerification,
}) => {
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  // Use real current location or fallback to mock
  const inspectorCurrentLocation = currentLocation || {
    latitude: 42.6877,
    longitude: 23.3119,
  };

  if (!activeJob) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Package size={64} color="#9ca3af" />
        <Text className="text-xl font-semibold text-gray-700 mt-4">No Active Job</Text>
        <Text className="text-gray-500 text-center mt-2">
          Accept a job from the Available Jobs tab
        </Text>
      </View>
    );
  }

  const handleStartVerification = () => {
    setShowVerificationForm(true);
    onStartVerification?.();
  };

  const handleSubmitVerification = (result: any) => {
    setShowVerificationForm(false);
    onCompleteVerification?.(result);
  };

  const formatSpecs = (specs: Record<string, any>) => {
    return Object.entries(specs).map(([key, value]) => (
      <Text key={key} className="text-gray-600">
        {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
      </Text>
    ));
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Job Status */}
      <View className="bg-green-50 px-4 py-3 border-b border-green-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-gray-800">
              {activeJob.productDetails.name}
            </Text>
            <Text className="text-sm text-gray-600">{activeJob.location.address}</Text>
          </View>
          <View testID="job-status" className="bg-green-600 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">
              {activeJob.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Map Section */}
      <View testID="job-map" style={{ height: 256 }}>
        <MapView
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: (inspectorCurrentLocation.latitude + activeJob.location.latitude) / 2,
            longitude: (inspectorCurrentLocation.longitude + activeJob.location.longitude) / 2,
            latitudeDelta:
              Math.abs(inspectorCurrentLocation.latitude - activeJob.location.latitude) * 1.5,
            longitudeDelta:
              Math.abs(inspectorCurrentLocation.longitude - activeJob.location.longitude) * 1.5,
          }}
        >
          {/* Inspector Current Location Marker */}
          <Marker coordinate={inspectorCurrentLocation} title="Your Location">
            <View className="bg-blue-500 p-2 rounded-full">
              <Navigation size={20} color="white" />
            </View>
          </Marker>

          {/* Job Destination Marker */}
          <Marker
            coordinate={{
              latitude: activeJob.location.latitude,
              longitude: activeJob.location.longitude,
            }}
            title="Job Location"
          >
            <View className="bg-red-500 p-2 rounded-full">
              <MapPin size={20} color="white" />
            </View>
          </Marker>

          {/* Route Line from Inspector to Job */}
          <Polyline
            testID="route-line"
            coordinates={[
              inspectorCurrentLocation,
              {
                latitude: activeJob.location.latitude,
                longitude: activeJob.location.longitude,
              },
            ]}
            strokeColor="#3b82f6"
            strokeWidth={3}
          />
        </MapView>

        {/* Distance Overlay */}
        <View className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow">
          <Text className="text-sm font-medium">{activeJob.distance || 12.3} km remaining</Text>
        </View>
      </View>

      {/* Job Details */}
      <View className="p-4">
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Product Details</Text>
          <View className="bg-gray-50 p-3 rounded-lg">
            <Text className="font-medium">{activeJob.productDetails.type}</Text>
            <Text className="text-gray-600">
              Quantity: {activeJob.productDetails.quantity} {activeJob.productDetails.unit}
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Claimed Specifications</Text>
          <View className="bg-gray-50 p-3 rounded-lg">
            {formatSpecs(activeJob.productDetails.claimedSpecs)}
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Location</Text>
          <View className="bg-gray-50 p-3 rounded-lg">
            <Text className="font-medium">{activeJob.location.address}</Text>
            <Text className="text-gray-600">
              {activeJob.location.city}, {activeJob.location.region}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <Clock size={16} color="#6b7280" />
          <Text className="text-gray-600 ml-2">
            Estimated duration: {activeJob.estimatedDuration} minutes
          </Text>
        </View>

        {/* Action Button */}
        {activeJob.status === 'ASSIGNED' && (
          <TouchableOpacity
            onPress={handleStartVerification}
            className="bg-green-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Start Verification</Text>
          </TouchableOpacity>
        )}

        {/* Verification Form */}
        {showVerificationForm && (
          <View testID="verification-form" className="mt-4">
            <VerificationForm
              job={activeJob}
              onSubmit={handleSubmitVerification}
              onCancel={() => setShowVerificationForm(false)}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};
