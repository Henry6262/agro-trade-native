import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Users, MapPin, Trash2, MoreVertical } from 'lucide-react-native';
import { Badge } from '@shared/components/Badge';
import type { FleetDriver } from '../types';
import { useDeleteDriver } from '../hooks';

interface DriverCardProps {
  driver: FleetDriver;
}

export const DriverCard: React.FC<DriverCardProps> = ({ driver }) => {
  const [showActions, setShowActions] = useState(false);
  const deleteDriverMutation = useDeleteDriver();

  const handleDelete = () => {
    Alert.alert('Delete Driver', `Are you sure you want to delete ${driver.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDriverMutation.mutate(driver.id),
      },
    ]);
  };

  return (
    <View className="bg-gray-900/40 border border-gray-700 rounded-lg p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-semibold flex-1">{driver.name}</Text>
        <View className="flex-row items-center gap-2">
          <Badge
            text={driver.status === 'available' ? 'Available' : 'Assigned'}
            className={
              driver.status === 'available'
                ? 'text-green-400 bg-green-500/10'
                : 'text-orange-400 bg-orange-500/10'
            }
          />
          <TouchableOpacity onPress={() => setShowActions(!showActions)}>
            <MoreVertical size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {showActions && (
        <View className="flex-row gap-2 mb-2">
          <TouchableOpacity
            onPress={handleDelete}
            className="flex-1 bg-red-600/20 border border-red-600 rounded-lg py-2 px-3"
          >
            <Text className="text-red-400 text-sm text-center">Delete Driver</Text>
          </TouchableOpacity>
        </View>
      )}

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
};
