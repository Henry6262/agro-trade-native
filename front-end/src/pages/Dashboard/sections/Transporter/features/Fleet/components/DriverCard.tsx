import React from 'react';
import { View, Text } from 'react-native';
import { Users, MapPin } from 'lucide-react-native';
import { Badge } from '@shared/components/Badge';
import type { FleetDriver } from '../types';

interface DriverCardProps {
  driver: FleetDriver;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver }) => (
  <View className="bg-gray-900/40 border border-gray-700 rounded-lg p-4 mb-3">
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-white font-semibold">{driver.name}</Text>
      <Badge
        text={driver.status === 'available' ? 'Available' : 'Assigned'}
        className={driver.status === 'available' ? 'text-green-400 bg-green-500/10' : 'text-orange-400 bg-orange-500/10'}
      />
    </View>
    <Text className="text-gray-300 text-sm">CDL: {driver.license}</Text>
    <Text className="text-gray-400 text-xs mb-2">Experience: {driver.experienceYears} years</Text>
    <View className="flex-row items-center">
      <Users size={14} color="#94A3B8" />
      <Text className="text-gray-400 text-sm ml-2">{driver.phone}</Text>
    </View>
    {driver.assignment && (
      <View className="flex-row items-center mt-1">
        <MapPin size={14} color="#FBBF24" />
        <Text className="text-gray-300 text-sm ml-2">{driver.assignment}</Text>
      </View>
    )}
  </View>
);
