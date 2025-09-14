import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActiveJobTab } from './components/ActiveJobTab';
import { AvailableJobsTab } from './components/AvailableJobsTab';
import { useInspectorStore } from './hooks/useInspectorStore';
import { useVerificationJobs } from './hooks/useVerificationJobs';
import { useLocationTracking } from './hooks/useLocationTracking';
import { PermissionGuard } from '@shared/components/PermissionGuard';
import { mockActiveJob, mockInspectorProfile } from './__mocks__/mockData';

export const InspectorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');
  
  const {
    profile,
    activeJob,
    setProfile,
    setActiveJob,
    acceptJob,
  } = useInspectorStore();

  const { jobs, isLoading, refetch } = useVerificationJobs();
  const { currentLocation, isTracking, error: locationError } = useLocationTracking();

  useEffect(() => {
    // Initialize with mock profile
    setProfile(mockInspectorProfile as any);
  }, []);

  const handleJobSelect = (job: any) => {
    Alert.alert(
      'Accept Job',
      `Do you want to accept the verification job for ${job.productDetails.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: () => {
            acceptJob(job.id);
            setActiveTab('active');
          }
        },
      ]
    );
  };

  const handleStartVerification = () => {
    if (activeJob) {
      const updatedJob = {
        ...activeJob,
        status: 'IN_PROGRESS' as any,
      };
      setActiveJob(updatedJob);
    }
  };

  const handleCompleteVerification = (result: any) => {
    Alert.alert(
      'Verification Complete',
      'The verification has been submitted successfully.',
      [{ text: 'OK', onPress: () => setActiveJob(null) }]
    );
  };

  return (
    <PermissionGuard requireLocation={true}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-green-600 px-4 py-3">
          <Text className="text-white text-xl font-bold">Inspector Dashboard</Text>
          <Text className="text-green-100 text-sm">
            {profile?.employeeId} • {profile?.totalJobsCompleted} jobs completed
            {isTracking && " • 📍 Live"}
          </Text>
        </View>

      {/* Tab Navigation */}
      <View className="flex-row bg-gray-100 border-b border-gray-200">
        <TouchableOpacity
          testID="active-job-tab"
          className={`flex-1 py-3 ${activeTab === 'active' ? 'border-b-2 border-green-600' : ''}`}
          onPress={() => setActiveTab('active')}
        >
          <Text className={`text-center font-medium ${
            activeTab === 'active' ? 'text-green-600' : 'text-gray-600'
          }`}>
            Active Job
            {activeJob && (
              <Text className="text-xs text-green-500"> (1)</Text>
            )}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 py-3 ${activeTab === 'available' ? 'border-b-2 border-green-600' : ''}`}
          onPress={() => setActiveTab('available')}
        >
          <Text className={`text-center font-medium ${
            activeTab === 'available' ? 'text-green-600' : 'text-gray-600'
          }`}>
            Available Jobs
            {jobs.length > 0 && (
              <Text className="text-xs text-gray-500"> ({jobs.length})</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View className="flex-1" testID={`${activeTab === 'active' ? 'active-job-content' : 'available-jobs-content'}`}>
        {activeTab === 'active' ? (
          <ActiveJobTab
            activeJob={activeJob || mockActiveJob as any}
            currentLocation={currentLocation}
            onStartVerification={handleStartVerification}
            onCompleteVerification={handleCompleteVerification}
          />
        ) : (
          <AvailableJobsTab
            jobs={jobs}
            currentLocation={currentLocation}
            onJobSelect={handleJobSelect}
            onRefresh={refetch}
            isRefreshing={isLoading}
          />
        )}
      </View>
      </SafeAreaView>
    </PermissionGuard>
  );
};