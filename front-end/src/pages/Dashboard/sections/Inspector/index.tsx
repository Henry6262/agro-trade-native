import React, { useState } from 'react';
import type { InspectorDashboardSectionProps } from './types';
import { PermissionGuard } from '../../../../shared/components/PermissionGuard';
import ActiveJobFeature from './features/ActiveJob';
import AvailableJobsFeature from './features/AvailableJobs';

export function InspectorDashboardSection({
  activeTab = 'active',
}: InspectorDashboardSectionProps) {
  const [tab, setTab] = useState<'active' | 'available'>(activeTab);

  return (
    <PermissionGuard requireLocation>
      <View className="flex-1 bg-white">
        <View className="bg-green-600 px-4 py-3">
          <Text className="text-white text-xl font-bold">Inspector Dashboard</Text>
        </View>
        <View className="flex-row bg-gray-100 border-b border-gray-200">
          <TouchableOpacity
            className={`flex-1 py-3 ${tab === 'active' ? 'border-b-2 border-green-600' : ''}`}
            onPress={() => setTab('active')}
          >
            <Text
              className={`text-center font-medium ${tab === 'active' ? 'text-green-600' : 'text-gray-600'}`}
            >
              Active Job
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 ${tab === 'available' ? 'border-b-2 border-green-600' : ''}`}
            onPress={() => setTab('available')}
          >
            <Text
              className={`text-center font-medium ${tab === 'available' ? 'text-green-600' : 'text-gray-600'}`}
            >
              Available Jobs
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1">
          {tab === 'active' ? <ActiveJobFeature /> : <AvailableJobsFeature />}
        </View>
      </View>
    </PermissionGuard>
  );
}
