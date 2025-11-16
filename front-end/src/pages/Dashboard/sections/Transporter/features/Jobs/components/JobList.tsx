import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Package } from 'lucide-react-native';
import type { TransporterJobListProps } from '../types';
import { TransporterJobCard } from './JobCard';

export const TransporterJobList: React.FC<TransporterJobListProps> = ({
  jobs,
  isLoading,
  actionJobId,
  onStartJob,
  onCompletePickup,
  onCompleteDelivery,
}) => {
  if (isLoading) {
    return (
      <View className="p-8">
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text className="text-gray-400 text-center mt-4">Loading active jobs...</Text>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
        <Package size={48} color="#6B7280" style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text className="text-gray-400 text-center">No active transport jobs</Text>
        <Text className="text-gray-500 text-center text-sm mt-2">Submit bids to get transport jobs</Text>
      </View>
    );
  }

  return (
    <View>
      {jobs.map((job) => (
        <TransporterJobCard
          key={job.id}
          job={job}
          actionJobId={actionJobId}
          onStartJob={onStartJob}
          onCompletePickup={onCompletePickup}
          onCompleteDelivery={onCompleteDelivery}
        />
      ))}
    </View>
  );
};
