import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Map, List } from 'lucide-react-native';
import { GlassBadge } from '@design-system';
import { AvailableJobsTabProps } from '../types';
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
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No Available Jobs</Text>
        <Text style={styles.emptySubtitle}>Check back later for new verification assignments</Text>
      </View>
    );
  }

  const FilterChip: React.FC<{
    label: string;
    value: string | null;
    count?: number;
    variant?: 'success' | 'warning' | 'danger' | 'muted';
    testID?: string;
  }> = ({ label, value, count, variant = 'muted', testID: tid }) => {
    const isActive = priorityFilter === value;
    return (
      <TouchableOpacity
        testID={tid}
        onPress={() => setPriorityFilter(value)}
        style={styles.chipWrap}
      >
        {isActive ? (
          <GlassBadge
            label={count !== undefined ? `${label} (${count})` : label}
            variant={variant}
            size="sm"
          />
        ) : (
          <GlassBadge
            label={count !== undefined ? `${label} (${count})` : label}
            variant="muted"
            size="sm"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Controls Bar */}
      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            <FilterChip
              testID="filter-all"
              label="All"
              value={null}
              count={jobs.length}
              variant="success"
            />
            <FilterChip testID="filter-high" label="High" value="HIGH" variant="danger" />
            <FilterChip testID="filter-medium" label="Medium" value="MEDIUM" variant="warning" />
            <FilterChip testID="filter-low" label="Low" value="LOW" variant="muted" />
          </ScrollView>

          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              testID="list-toggle"
              onPress={() => setViewMode('list')}
              style={[
                styles.toggleBtn,
                styles.toggleLeft,
                viewMode === 'list' && styles.toggleActive,
              ]}
            >
              <List size={18} color={viewMode === 'list' ? '#4ADE80' : 'rgba(255,255,255,0.4)'} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="map-toggle"
              onPress={() => setViewMode('map')}
              style={[
                styles.toggleBtn,
                styles.toggleRight,
                viewMode === 'map' && styles.toggleActive,
              ]}
            >
              <Map size={18} color={viewMode === 'map' ? '#4ADE80' : 'rgba(255,255,255,0.4)'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortRow}>
          <TouchableOpacity
            testID="sort-distance"
            onPress={() => setSortBy('distance')}
            style={[styles.sortBtn, sortBy === 'distance' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortBy === 'distance' && styles.sortTextActive]}>
              By Distance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="sort-priority"
            onPress={() => setSortBy('priority')}
            style={[styles.sortBtn, sortBy === 'priority' && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortBy === 'priority' && styles.sortTextActive]}>
              By Priority
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {viewMode === 'list' ? (
          <View testID="jobs-list-view" style={styles.content}>
            <JobListView
              jobs={sortedJobs}
              onJobSelect={onJobSelect}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />
          </View>
        ) : (
          <View testID="jobs-map-view" style={styles.content}>
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

const styles = StyleSheet.create({
  chipWrap: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  controls: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  filtersScroll: {
    flex: 1,
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  sortBtn: {
    paddingBottom: 2,
  },
  sortBtnActive: {
    borderBottomColor: '#4ADE80',
    borderBottomWidth: 2,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sortText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  sortTextActive: {
    color: '#4ADE80',
    fontWeight: '600',
  },
  toggleActive: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  toggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    padding: 8,
  },
  toggleLeft: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
  },
  toggleRight: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    marginLeft: 8,
  },
});
