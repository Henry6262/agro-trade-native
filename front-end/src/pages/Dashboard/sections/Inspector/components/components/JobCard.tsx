import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Package, ChevronRight } from 'lucide-react-native';
import { JobCardProps } from '@features/dashboard/screens/inspector/types/index';
import { JobPriorityBadge } from './JobPriorityBadge';

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onPress,
  onAccept,
  showAcceptButton = false,
  className = '',
}) => {
  const handlePress = () => {
    onPress?.(job);
  };

  const handleAccept = (e: any) => {
    e.stopPropagation();
    onAccept?.(job.id);
  };

  const formatSpecs = () => {
    const specs = Object.entries(job.productDetails.claimedSpecs)
      .slice(0, 2)
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
      .join(' • ');
    return specs;
  };

  return (
    <TouchableOpacity
      testID="job-card"
      onPress={handlePress}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{job.productDetails.name}</Text>
          <Text className="text-sm text-gray-600">
            {job.productDetails.type} • {job.productDetails.quantity} {job.productDetails.unit}
          </Text>
        </View>
        <View testID="priority-badge">
          <JobPriorityBadge priority={job.priority} />
        </View>
      </View>

      {/* Body */}
      <View className="px-4 py-3">
        {/* Location */}
        <View className="flex-row items-start mb-2">
          <MapPin size={16} color="#6b7280" />
          <View className="ml-2 flex-1">
            <Text className="text-sm font-medium text-gray-700">{job.location.address}</Text>
            <Text className="text-xs text-gray-500">
              {job.location.city}, {job.location.region}
            </Text>
          </View>
          <View className="bg-green-100 px-2 py-1 rounded">
            <Text className="text-green-700 text-sm font-medium">{job.distance} km</Text>
          </View>
        </View>

        {/* Specifications Preview */}
        <View className="mb-2">
          <Text className="text-xs text-gray-500">{formatSpecs()}</Text>
        </View>

        {/* Duration */}
        <View className="flex-row items-center">
          <Clock size={14} color="#6b7280" />
          <Text className="text-xs text-gray-600 ml-1">Est. {job.estimatedDuration} min</Text>
        </View>
      </View>

      {/* Footer */}
      {showAcceptButton && (
        <View className="border-t border-gray-200 px-4 py-3">
          <TouchableOpacity
            onPress={handleAccept}
            className="bg-green-600 py-2 rounded-lg flex-row items-center justify-center"
          >
            <Text className="text-white font-medium mr-1">Accept Job</Text>
            <ChevronRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};
