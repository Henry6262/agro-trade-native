import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.loadingText}>Loading available jobs…</Text>
      </View>
    );
  }

  if (!displayedJobs.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No Available Jobs</Text>
        <Text style={styles.emptySubtitle}>Check back later for new verification assignments.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID} accessibilityLabel={accessibilityLabel}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterButtons.map(({ label, value }) => {
              const isActive = priorityFilter === value;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => setPriorityFilter(value)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {label}
                    {value === null ? ` (${displayedJobs.length})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={[
                styles.viewBtn,
                styles.viewBtnLeft,
                viewMode === 'list' && styles.viewBtnActive,
              ]}
            >
              <List size={20} color={viewMode === 'list' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('map')}
              style={[
                styles.viewBtn,
                styles.viewBtnRight,
                viewMode === 'map' && styles.viewBtnActive,
              ]}
            >
              <Map size={20} color={viewMode === 'map' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sortRow}>
          {[
            { label: 'Sort by Distance', value: 'distance' },
            { label: 'Sort by Priority', value: 'priority' },
          ].map(({ label, value }) => (
            <TouchableOpacity
              key={label}
              onPress={() => setSortBy(value as 'distance' | 'priority')}
              style={[styles.sortBtn, sortBy === value && styles.sortBtnActive]}
            >
              <Text style={[styles.sortBtnText, sortBy === value && styles.sortBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.content}>
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

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  filterChipActive: {
    backgroundColor: '#4ADE80',
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  root: {
    flex: 1,
  },
  sortBtn: {
    marginRight: 12,
    paddingBottom: 6,
    paddingTop: 2,
  },
  sortBtnActive: {
    borderBottomColor: '#4ADE80',
    borderBottomWidth: 2,
  },
  sortBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  sortBtnTextActive: {
    color: '#4ADE80',
    fontWeight: '500',
  },
  sortRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  toolbar: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toolbarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8,
  },
  viewBtnActive: {
    backgroundColor: '#4ADE80',
  },
  viewBtnLeft: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
  },
  viewBtnRight: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    marginLeft: 8,
  },
});
