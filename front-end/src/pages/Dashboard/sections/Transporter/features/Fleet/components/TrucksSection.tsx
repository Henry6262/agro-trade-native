import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Truck } from 'lucide-react-native';
import type { FleetTruck } from '../types';
import { TruckCard } from './TruckCard';

interface FleetTrucksSectionProps {
  trucks: FleetTruck[];
  activeTab: 'available' | 'in_transit';
  onTabChange: (tab: 'available' | 'in_transit') => void;
}

export const FleetTrucksSection: React.FC<FleetTrucksSectionProps> = ({
  trucks,
  activeTab,
  onTabChange,
}) => (
  <View>
    <View className="flex-row items-center mb-3">
      <Truck size={20} color="#60A5FA" />
      <Text className="text-lg font-semibold text-blue-300 ml-2">Fleet Trucks</Text>
    </View>
    <View className="flex-row mb-4 rounded-lg overflow-hidden border border-gray-200">
      <TouchableOpacity
        className={`flex-1 py-2 ${activeTab === 'available' ? 'bg-blue-600' : 'bg-gray-50'}`}
        onPress={() => onTabChange('available')}
      >
        <Text className="text-center text-sm font-semibold text-white">Available</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 py-2 ${activeTab === 'in_transit' ? 'bg-blue-600' : 'bg-gray-50'}`}
        onPress={() => onTabChange('in_transit')}
      >
        <Text className="text-center text-sm font-semibold text-white">In Transit</Text>
      </TouchableOpacity>
    </View>
    {trucks.length === 0 ? (
      <View className="bg-gray-50/40 border border-gray-200 rounded-lg p-6">
        <Text className="text-gray-400 text-center">No trucks in this tab</Text>
      </View>
    ) : (
      trucks.map((truck) => <TruckCard key={truck.id} truck={truck} />)
    )}
  </View>
);
