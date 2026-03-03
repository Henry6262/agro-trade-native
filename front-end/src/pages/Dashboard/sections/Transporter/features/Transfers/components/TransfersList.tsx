import React from 'react';
import { View, Text } from 'react-native';
import type { TransfersJobView } from '../types';
import { TransferJobCard } from './TransferJobCard';

interface TransfersListProps {
  jobs: TransfersJobView[];
  onViewRoute: (job: TransfersJobView) => void;
}

export const TransfersList: React.FC<TransfersListProps> = ({ jobs, onViewRoute }) => {
  if (!jobs.length) {
    return (
      <View className="bg-gray-50/50 border border-gray-200 rounded-lg p-6 items-center">
        <Text className="text-gray-400 text-center">No transfers found</Text>
        <Text className="text-gray-500 text-center text-sm mt-2">
          New jobs will appear here as they are assigned.
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-3">
      {jobs.map((job) => (
        <TransferJobCard key={job.id} job={job} onViewRoute={onViewRoute} />
      ))}
    </View>
  );
};
