import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, ScrollView } from 'react-native';
import { X, User } from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import type { FleetDriver } from '../types';
import { useAssignDriver } from '../hooks';

interface AssignDriverModalProps {
  visible: boolean;
  onClose: () => void;
  truckId: string;
  truckLicensePlate: string;
  availableDrivers: FleetDriver[];
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  visible,
  onClose,
  truckId,
  truckLicensePlate,
  availableDrivers,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const assignDriverMutation = useAssignDriver();

  const handleAssign = async () => {
    if (!selectedDriverId) return;

    await assignDriverMutation.mutateAsync({ truckId, driverId: selectedDriverId });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-neutral-900 rounded-t-3xl max-h-[70%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-neutral-800">
            <Text className="text-xl font-bold text-white">Assign Driver</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView className="flex-1">
            <View className="p-6">
              <Text className="text-gray-400 text-sm mb-4">
                Select a driver to assign to {truckLicensePlate}
              </Text>

              {availableDrivers.length === 0 ? (
                <View className="bg-gray-800/50 rounded-lg p-6 items-center">
                  <User size={32} color="#6B7280" />
                  <Text className="text-gray-400 text-center mt-2">
                    No available drivers. All drivers are currently assigned.
                  </Text>
                </View>
              ) : (
                <View>
                  {availableDrivers.map((driver) => (
                    <TouchableOpacity
                      key={driver.id}
                      onPress={() => setSelectedDriverId(driver.id)}
                      className={`mb-3 p-4 rounded-lg border ${
                        selectedDriverId === driver.id
                          ? 'bg-blue-600/20 border-blue-600'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text
                            className={`font-semibold mb-1 ${
                              selectedDriverId === driver.id ? 'text-blue-400' : 'text-white'
                            }`}
                          >
                            {driver.name}
                          </Text>
                          <Text className="text-gray-400 text-sm">CDL: {driver.license}</Text>
                          <Text className="text-gray-500 text-xs">
                            {driver.experienceYears} years experience
                          </Text>
                        </View>
                        {selectedDriverId === driver.id && (
                          <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center">
                            <View className="w-2 h-2 rounded-full bg-white" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-neutral-800">
            <Button
              variant="gradient"
              className="bg-gradient-to-r from-blue-600 to-blue-700"
              onPress={handleAssign}
              disabled={!selectedDriverId || assignDriverMutation.isPending}
            >
              <Text className="text-white font-semibold">
                {assignDriverMutation.isPending ? 'Assigning...' : 'Assign Driver'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};
