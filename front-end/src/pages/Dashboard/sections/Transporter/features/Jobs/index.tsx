import React, { useCallback } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import type { BaseComponentProps } from '@shared/types';
import { useTransporterJobs } from './hooks';
import {
  TransporterJobList,
  TransporterJobsRefreshButton,
  TransporterJobsSummaryGrid,
} from './components';

interface TransporterActiveJobsTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterActiveJobsTab: React.FC<TransporterActiveJobsTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const {
    displayJobs,
    summary,
    isLoading,
    isRefreshing,
    actionJobId,
    errorMessage,
    refresh,
    startJob,
    completePickup,
    completeDelivery,
  } = useTransporterJobs();

  const handleStartJob = useCallback(
    async (jobId: string) => {
      const result = await startJob(jobId);
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.success ? 'Transport job started' : 'Failed to start job'
      );
    },
    [startJob]
  );

  const handleCompletePickup = useCallback(
    async (jobId: string) => {
      const result = await completePickup(jobId);
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.success ? 'Pickup completed' : 'Failed to complete pickup'
      );
    },
    [completePickup]
  );

  const handleCompleteDelivery = useCallback(
    async (jobId: string) => {
      const result = await completeDelivery(jobId);
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.success ? 'Delivery completed' : 'Failed to complete delivery'
      );
    },
    [completeDelivery]
  );

  return (
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <View className="p-4 space-y-4">
        <TransporterJobsRefreshButton refreshing={isRefreshing} onRefresh={refresh} />
        {errorMessage && <Text className="text-red-400 text-center text-sm">{errorMessage}</Text>}
        <TransporterJobsSummaryGrid summary={summary} />
        <View className="mt-4">
          <TransporterJobList
            jobs={displayJobs}
            isLoading={isLoading}
            actionJobId={actionJobId}
            onStartJob={handleStartJob}
            onCompletePickup={handleCompletePickup}
            onCompleteDelivery={handleCompleteDelivery}
          />
        </View>
      </View>
    </ScrollView>
  );
};
