import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Truck, User, X } from 'lucide-react-native';

interface CreationTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'truck' | 'driver') => void;
}

export const CreationTypeSelector: React.FC<CreationTypeSelectorProps> = ({
  visible,
  onClose,
  onSelectType,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        
        <View className="bg-neutral-900 rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-neutral-800">
            <Text className="text-xl font-bold text-white">Add to Fleet</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="p-6">
            <Text className="text-neutral-400 mb-6">
              Choose what you want to add to your fleet
            </Text>

            {/* Truck Option */}
            <TouchableOpacity
              onPress={() => onSelectType('truck')}
              className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-6 mb-4 border border-green-500/30 active:scale-95"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mr-4">
                  <Truck size={32} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white mb-1">
                    Add New Truck
                  </Text>
                  <Text className="text-sm text-neutral-400">
                    Register a new vehicle to your fleet
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Driver Option */}
            <TouchableOpacity
              onPress={() => onSelectType('driver')}
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 mb-4 border border-blue-500/30 active:scale-95"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center mr-4">
                  <User size={32} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white mb-1">
                    Add New Driver
                  </Text>
                  <Text className="text-sm text-neutral-400">
                    Add a driver to operate your vehicles
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};