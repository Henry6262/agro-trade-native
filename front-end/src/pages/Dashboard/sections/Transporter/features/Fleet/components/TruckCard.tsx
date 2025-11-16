import React from 'react';
import { View, Text } from 'react-native';
import { MapPin, Shield, User } from 'lucide-react-native';
import { Badge } from '@shared/components/Badge';
import type { FleetTruck } from '../types';

interface TruckCardProps {
  truck: FleetTruck;
}

export const TruckCard: React.FC<TruckCardProps> = ({ truck }) => (
  <View className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 mb-3">
    <View className="flex-row items-center justify-between mb-2">
      <View>
        <Text className="text-white font-semibold">{truck.model}</Text>
        <Text className="text-gray-400 text-sm">{truck.licensePlate}</Text>
      </View>
      <Badge
        text={truck.status === 'available' ? 'Available' : 'Assigned'}
        className={truck.status === 'available' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'}
      />
    </View>
    <Text className="text-gray-300 text-sm mb-2">Capacity: {truck.capacityTons} tons</Text>
    <View className="flex-row items-center mb-2">
      <MapPin size={14} color="#60A5FA" />
      <Text className="text-gray-300 text-sm ml-2">{truck.location}</Text>
    </View>
    {truck.driver && (
      <View className="flex-row items-center mb-1">
        <User size={14} color="#FDE68A" />
        <Text className="text-gray-300 text-sm ml-2">{truck.driver}</Text>
      </View>
    )}
    {truck.assignment && (
      <Text className="text-xs text-gray-400">Assignment: {truck.assignment}</Text>
    )}
    {truck.verified && (
      <View className="flex-row items-center mt-2">
        <Shield size={14} color="#34D399" />
        <Text className="text-green-400 text-xs ml-2">Verified</Text>
      </View>
    )}
  </View>
);
