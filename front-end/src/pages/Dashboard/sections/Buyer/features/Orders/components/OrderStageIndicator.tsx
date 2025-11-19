import React from 'react';
import { View, Text } from 'react-native';
import { Calendar, Truck, MapPin, CheckCircle } from 'lucide-react-native';

const ORDER_STAGES = [
  { name: 'Scheduled', icon: Calendar },
  { name: 'Traveling', icon: Truck },
  { name: 'Arrived', icon: MapPin },
  { name: 'Delivered', icon: CheckCircle },
];

interface OrderStageIndicatorProps {
  currentStage: number;
}

export const OrderStageIndicator: React.FC<OrderStageIndicatorProps> = ({ currentStage }) => (
  <View className="relative mb-6">
    <View className="absolute top-4 left-8 right-8 h-0.5 bg-neutral-700 z-0" />
    <View
      className="absolute top-4 left-8 h-0.5 bg-blue-500 z-0 transition-all duration-500"
      style={{ width: `${(currentStage / (ORDER_STAGES.length - 1)) * 100}%`, maxWidth: '75%' }}
    />

    <View className="flex-row justify-between relative z-10">
      {ORDER_STAGES.map((stage, index) => {
        const IconComponent = stage.icon;
        const isCompleted = index < currentStage;
        const isCurrent = index === currentStage;

        return (
          <View key={stage.name} className="flex flex-col items-center">
            <View
              className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                isCompleted ? 'bg-blue-500' : isCurrent ? 'bg-yellow-500' : 'bg-neutral-700'
              }`}
            >
              <IconComponent color={isCompleted || isCurrent ? '#ffffff' : '#9CA3AF'} size={16} />
              {isCurrent && (
                <View className="absolute inset-0 rounded-full bg-yellow-500 opacity-75" />
              )}
            </View>
            <Text
              className={`text-xs text-center mt-2 max-w-16 ${
                isCompleted ? 'text-blue-400' : isCurrent ? 'text-yellow-400' : 'text-neutral-500'
              }`}
            >
              {stage.name}
            </Text>
          </View>
        );
      })}
    </View>
  </View>
);
