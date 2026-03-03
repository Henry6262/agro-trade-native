import React from 'react';
import { View, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Button } from '@shared/components/Button';

interface FleetCreationCardProps {
  onCreate: () => void;
}

export const FleetCreationCard: React.FC<FleetCreationCardProps> = ({ onCreate }) => (
  <View className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
    <View className="flex-row items-center justify-between">
      <View className="flex-1 mr-3">
        <Text className="text-gray-900 font-semibold text-lg">Add Trucks & Drivers</Text>
        <Text className="text-sm text-gray-900/80 mt-1">
          Register new fleet assets to unlock more transport capacity.
        </Text>
      </View>
      <Button
        size="sm"
        variant="gradient"
        className="bg-gradient-to-r from-green-600 to-green-700"
        onPress={onCreate}
      >
        <Plus size={16} color="#FFFFFF" />
        <Text className="ml-1 text-gray-900 font-semibold">Add Fleet</Text>
      </Button>
    </View>
  </View>
);
