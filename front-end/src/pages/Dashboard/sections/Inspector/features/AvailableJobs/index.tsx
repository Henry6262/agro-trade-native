import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Map, List } from 'lucide-react-native';
import type { BaseComponentProps } from '@shared/types';
import type { VerificationJob } from '@features/dashboard/screens/inspector/types';
import { JobListView } from '../../components/components/JobListView';
import { JobMapView } from '../../components/components/JobMapView';
import { useInspectorAvailableJobs } from './hooks';
import type { InspectorJobPriority } from './types';

interface InspectorAvailableJobsTabProps extends BaseComponentProps {
  onJobSelect?: (job: VerificationJob) => void;
}

export const AvailableJobsTab: React.FC<InspectorAvailableJobsTabProps> = ({
  onJobSelect,
  testID,
  accessibilityLabel,
}) => {
  const {
    displayedJobs,
    viewMode,
    priorityFilter,
    sortBy,
    currentLocation,
    isLoading,
    isRefreshing,
    setViewMode,
    setPriorityFilter,
    setSortBy,
    refresh,
  } = useInspectorAvailableJobs();

  const filterButtons: { label: string; value: InspectorJobPriority | null }[] = [
    { label: `All`, value: null },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' },
  ];

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-8">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-500 mt-4">Loading available jobs…</Text>
      </View>
    );
  }

  if (!displayedJobs.length) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-white">
        <Text className="text-xl font-semibold text-gray-700">No Available Jobs</Text>
        <Text className="text-gray-500 text-center mt-2">
          Check back later for new verification assignments.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" testID={testID} accessibilityLabel={accessibilityLabel}>
      <View className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterButtons.map(({ label, value }) => {
              const isActive = priorityFilter === value;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => setPriorityFilter(value)}
                  className={`px-3 py-1 rounded-full mr-2 ${isActive ? 'bg-green-600' : 'bg-gray-200'}`}
                >
                  <Text className={isActive ? 'text-white font-semibold' : 'text-gray-700'}>
                    {label}
                    {value === null ? ` (${displayedJobs.length})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="flex-row ml-2">
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-green-600' : 'bg-gray-200'} rounded-l-lg`}
            >
              <List size={20} color={viewMode === 'list' ? 'white' : '#4b5563'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('map')}
              className={`p-2 ${viewMode === 'map' ? 'bg-green-600' : 'bg-gray-200'} rounded-r-lg`}
            >
              <Map size={20} color={viewMode === 'map' ? 'white' : '#4b5563'} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row mt-2">
          {[
            { label: 'Sort by Distance', value: 'distance' },
            { label: 'Sort by Priority', value: 'priority' },
          ].map(({ label, value }) => (
            <TouchableOpacity
              key={label}
              onPress={() => setSortBy(value as 'distance' | 'priority')}
              className={`mr-3 ${sortBy === value ? 'border-b-2 border-green-600' : ''}`}
            >
              <Text className={sortBy === value ? 'text-green-600 font-medium' : 'text-gray-600'}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-1">
        {viewMode === 'list' ? (
          <JobListView
            jobs={displayedJobs}
            onJobSelect={onJobSelect}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
          />
        ) : (
          <JobMapView
            jobs={displayedJobs}
            currentLocation={currentLocation ?? undefined}
            onJobSelect={onJobSelect}
          />
        )}
      </View>
    </View>
  );
};

export default AvailableJobsTab;
