import React from 'react';
import { Alert, FlatList, RefreshControl, View, Text } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobListViewProps } from '@features/dashboard/screens/inspector/types';
import { inspectionService } from '@services/inspectionService';
import { useAuthStore } from '@stores/auth.store';
import { JobCard } from './JobCard';

export const JobListView: React.FC<JobListViewProps> = ({
  jobs,
  onJobSelect,
  onRefresh,
  isRefreshing = false,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const acceptJobMutation = useMutation({
    mutationFn: (jobId: string) =>
      inspectionService.acceptJob(jobId, {
        inspectorId: user?.id ?? '',
        estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    onSuccess: () => {
      // Refresh available jobs and active job lists
      queryClient.invalidateQueries({ queryKey: ['inspector', 'available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['inspector', 'active-job'] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message ?? 'Failed to accept job. Please try again.'
      );
    },
  });

  const renderJob = ({ item }: { item: any }) => (
    <View testID="job-list-item" className="px-4 py-2">
      <JobCard
        job={item}
        onPress={() => onJobSelect?.(item)}
        showAcceptButton={true}
        onAccept={(jobId) => {
          acceptJobMutation.mutate(jobId);
        }}
      />
    </View>
  );

  const renderHeader = () => (
    <View className="px-4 py-2 bg-gray-50">
      <Text className="text-sm text-gray-600">
        {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-12">
      <Text className="text-gray-500">No jobs available in this area</Text>
    </View>
  );

  return (
    <FlatList
      testID="jobs-flat-list"
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={renderJob}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#16a34a']}
          tintColor="#16a34a"
        />
      }
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
};
