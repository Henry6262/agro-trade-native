import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users } from 'lucide-react-native';
import type { FleetDriver } from '../types';
import { DriverCard } from './DriverCard';

interface FleetDriversSectionProps {
  drivers: FleetDriver[];
  activeTab: 'available' | 'assigned';
  onTabChange: (tab: 'available' | 'assigned') => void;
}

export const FleetDriversSection: React.FC<FleetDriversSectionProps> = ({
  drivers,
  activeTab,
  onTabChange,
}) => (
  <View className="mt-6">
    <View className="flex-row items-center mb-3">
      <Users size={20} color="#34D399" />
      <Text className="text-lg font-semibold text-green-300 ml-2">Drivers</Text>
    </View>
    <View className="flex-row mb-4 rounded-lg overflow-hidden border border-gray-200">
      <TouchableOpacity
        className={`flex-1 py-2 ${activeTab === 'available' ? 'bg-green-600' : 'bg-gray-50'}`}
        onPress={() => onTabChange('available')}
      >
        <Text className="text-center text-sm font-semibold text-white">Available</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 py-2 ${activeTab === 'assigned' ? 'bg-green-600' : 'bg-gray-50'}`}
        onPress={() => onTabChange('assigned')}
      >
        <Text className="text-center text-sm font-semibold text-white">Assigned</Text>
      </TouchableOpacity>
    </View>
    {drivers.length === 0 ? (
      <View className="bg-gray-50/40 border border-gray-200 rounded-lg p-6">
        <Text className="text-gray-400 text-center">No drivers in this tab</Text>
      </View>
    ) : (
      drivers.map((driver) => <DriverCard key={driver.id} driver={driver} />)
    )}
  </View>
);
