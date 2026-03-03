import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { MapPin, Shield, User, Trash2, MoreVertical } from 'lucide-react-native';
import { Badge } from '@shared/components/Badge';
import type { FleetTruck } from '../types';
import { useDeleteTruck, useUnassignDriver } from '../hooks';

interface TruckCardProps {
  truck: FleetTruck;
  onAssignDriver?: (truckId: string) => void;
}

export const TruckCard: React.FC<TruckCardProps> = ({ truck, onAssignDriver }) => {
  const [showActions, setShowActions] = useState(false);
  const deleteTruckMutation = useDeleteTruck();
  const unassignDriverMutation = useUnassignDriver();

  const handleDelete = () => {
    Alert.alert('Delete Truck', `Are you sure you want to delete ${truck.licensePlate}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTruckMutation.mutate(truck.id),
      },
    ]);
  };

  const handleUnassignDriver = () => {
    Alert.alert(
      'Unassign Driver',
      'Are you sure you want to unassign the driver from this truck?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          onPress: () => unassignDriverMutation.mutate(truck.id),
        },
      ]
    );
  };

  return (
    <View className="bg-gray-50/60 border border-gray-200 rounded-lg p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold">{truck.model}</Text>
          <Text className="text-gray-400 text-sm">{truck.licensePlate}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Badge
            className={
              truck.status === 'available'
                ? 'text-green-400 bg-green-500/10'
                : 'text-yellow-400 bg-yellow-500/10'
            }
          >
            {truck.status === 'available' ? 'Available' : 'Assigned'}
          </Badge>
          <TouchableOpacity onPress={() => setShowActions(!showActions)}>
            <MoreVertical size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {showActions && (
        <View className="flex-row gap-2 mb-2">
          {truck.status === 'available' && onAssignDriver && (
            <TouchableOpacity
              onPress={() => onAssignDriver(truck.id)}
              className="flex-1 bg-blue-600/20 border border-blue-600 rounded-lg py-2 px-3"
            >
              <Text className="text-blue-400 text-sm text-center">Assign Driver</Text>
            </TouchableOpacity>
          )}
          {truck.driver && (
            <TouchableOpacity
              onPress={handleUnassignDriver}
              className="flex-1 bg-orange-600/20 border border-orange-600 rounded-lg py-2 px-3"
            >
              <Text className="text-orange-400 text-sm text-center">Unassign</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-600/20 border border-red-600 rounded-lg py-2 px-3"
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <Text className="text-gray-600 text-sm mb-2">Capacity: {truck.capacityTons} tons</Text>
      <View className="flex-row items-center mb-2">
        <MapPin size={14} color="#60A5FA" />
        <Text className="text-gray-600 text-sm ml-2">{truck.location}</Text>
      </View>
      {truck.driver && (
        <View className="flex-row items-center mb-1">
          <User size={14} color="#FDE68A" />
          <Text className="text-gray-600 text-sm ml-2">{truck.driver}</Text>
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
};
