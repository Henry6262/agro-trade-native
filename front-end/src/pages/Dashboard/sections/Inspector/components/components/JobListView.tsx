import React from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobListViewProps, VerificationJob } from '@features/dashboard/screens/inspector/types';
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
      queryClient.invalidateQueries({ queryKey: ['inspector', 'available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['inspector', 'active-job'] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to accept job. Please try again.';
      Alert.alert('Error', message);
    },
  });

  const renderJob: ListRenderItem<VerificationJob> = ({ item }) => (
    <View style={styles.itemWrap} testID="job-list-item">
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
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>
        {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>No jobs available in this area</Text>
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
          colors={['#4ADE80']}
          tintColor="#4ADE80"
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  itemWrap: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listHeaderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
});
