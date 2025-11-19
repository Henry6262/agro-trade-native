import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Map, List, Filter } from 'lucide-react-native';
import { AvailableJobsTabProps, JobPriority } from '../types';
import { JobListView } from './JobListView';
import { JobMapView } from './JobMapView';

export const AvailableJobsTab: React.FC<AvailableJobsTabProps> = ({
  jobs,
  currentLocation,
  onJobSelect,
  onRefresh,
  isRefreshing,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'priority'>('distance');

  // Filter jobs by priority
  const filteredJobs = priorityFilter
    ? jobs.filter((job) => job.priority === priorityFilter)
    : jobs;

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || 0) - (b.distance || 0);
    } else {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder]
      );
    }
  });

  if (jobs.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-xl font-semibold text-gray-700">No Available Jobs</Text>
        <Text className="text-gray-500 text-center mt-2">
          Check back later for new verification assignments
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Controls Bar */}
      <View className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          {/* Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              testID="filter-all"
              onPress={() => setPriorityFilter(null)}
              className={`px-3 py-1 rounded-full mr-2 ${
                !priorityFilter ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <Text className={!priorityFilter ? 'text-white' : 'text-gray-700'}>
                All ({jobs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="filter-high"
              onPress={() => setPriorityFilter('HIGH')}
              className={`px-3 py-1 rounded-full mr-2 ${
                priorityFilter === 'HIGH' ? 'bg-red-500' : 'bg-gray-200'
              }`}
            >
              <Text className={priorityFilter === 'HIGH' ? 'text-white' : 'text-gray-700'}>
                High
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="filter-medium"
              onPress={() => setPriorityFilter('MEDIUM')}
              className={`px-3 py-1 rounded-full mr-2 ${
                priorityFilter === 'MEDIUM' ? 'bg-yellow-500' : 'bg-gray-200'
              }`}
            >
              <Text className={priorityFilter === 'MEDIUM' ? 'text-white' : 'text-gray-700'}>
                Medium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="filter-low"
              onPress={() => setPriorityFilter('LOW')}
              className={`px-3 py-1 rounded-full ${
                priorityFilter === 'LOW' ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            >
              <Text className={priorityFilter === 'LOW' ? 'text-white' : 'text-gray-700'}>Low</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* View Toggle */}
          <View className="flex-row ml-2">
            <TouchableOpacity
              testID="list-toggle"
              onPress={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-green-600' : 'bg-gray-200'} rounded-l-lg`}
            >
              <List size={20} color={viewMode === 'list' ? 'white' : '#4b5563'} />
            </TouchableOpacity>

            <TouchableOpacity
              testID="map-toggle"
              onPress={() => setViewMode('map')}
              className={`p-2 ${viewMode === 'map' ? 'bg-green-600' : 'bg-gray-200'} rounded-r-lg`}
            >
              <Map size={20} color={viewMode === 'map' ? 'white' : '#4b5563'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort Options */}
        <View className="flex-row mt-2">
          <TouchableOpacity
            testID="sort-distance"
            onPress={() => setSortBy('distance')}
            className={`mr-3 ${sortBy === 'distance' ? 'border-b-2 border-green-600' : ''}`}
          >
            <Text
              className={sortBy === 'distance' ? 'text-green-600 font-medium' : 'text-gray-600'}
            >
              Sort by Distance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="sort-priority"
            onPress={() => setSortBy('priority')}
            className={sortBy === 'priority' ? 'border-b-2 border-green-600' : ''}
          >
            <Text
              className={sortBy === 'priority' ? 'text-green-600 font-medium' : 'text-gray-600'}
            >
              Sort by Priority
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        {viewMode === 'list' ? (
          <View testID="jobs-list-view">
            <JobListView
              jobs={sortedJobs}
              onJobSelect={onJobSelect}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />
          </View>
        ) : (
          <View testID="jobs-map-view" className="flex-1">
            <JobMapView
              jobs={sortedJobs}
              currentLocation={
                currentLocation
                  ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
                  : undefined
              }
              onJobSelect={onJobSelect}
            />
          </View>
        )}
      </View>
    </View>
  );
};
