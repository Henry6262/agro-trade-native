import React from 'react';
import { FlatList, RefreshControl, View, Text } from 'react-native';
import { JobListViewProps } from '@features/dashboard/screens/inspector/types/index';
import { JobCard } from './JobCard';

export const JobListView: React.FC<JobListViewProps> = ({
  jobs,
  onJobSelect,
  onRefresh,
  isRefreshing = false,
}) => {
  const renderJob = ({ item }: { item: any }) => (
    <View testID="job-list-item" className="px-4 py-2">
      <JobCard
        job={item}
        onPress={() => onJobSelect?.(item)}
        showAcceptButton={true}
        onAccept={(jobId) => {
          const job = jobs.find((j) => j.id === jobId);
          if (job) onJobSelect?.(job);
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
