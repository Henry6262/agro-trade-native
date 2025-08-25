import React from 'react';
import { View, Text } from 'react-native';
import { User, Truck, MapPin, CheckCircle } from 'lucide-react-native';
import { BaseComponentProps } from '../../../types';

interface TransferStage {
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}

interface TransferStageIndicatorProps extends BaseComponentProps {
  currentStage: number;
  stages?: TransferStage[];
}

export const TransferStageIndicator: React.FC<TransferStageIndicatorProps> = ({
  currentStage,
  stages,
  testID,
  accessibilityLabel,
}) => {
  const defaultStages: TransferStage[] = [
    { name: "Assign Driver", description: "Assign driver to truck", icon: User },
    { name: "Traveling", description: "En route to pickup", icon: Truck },
    { name: "Arrived", description: "At pickup location", icon: MapPin },
    { name: "Completed", description: "Delivery completed", icon: CheckCircle },
  ];

  const stagesList = stages || defaultStages;

  return (
    <View 
      className="relative mb-6"
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Progress Bar Background */}
      <View className="absolute top-4 left-8 right-8 h-0.5 bg-neutral-700 z-0" />

      {/* Active Progress Bar */}
      <View
        className="absolute top-4 left-8 h-0.5 bg-green-500 z-0 transition-all duration-500"
        style={{
          width: `${Math.max(0, Math.min(100, (currentStage / (stagesList.length - 1)) * 100))}%`,
          right: '2rem',
        }}
      />

      <View className="flex-row justify-between relative z-10">
        {stagesList.map((stage, index) => {
          const Icon = stage.icon;
          const isCompleted = index < currentStage;
          const isCurrent = index === currentStage;
          const isUpcoming = index > currentStage;

          const getStageStyles = () => {
            if (isCompleted) {
              return {
                container: 'bg-green-500',
                iconColor: '#FFFFFF',
                textColor: 'text-green-400',
              };
            } else if (isCurrent) {
              return {
                container: 'bg-yellow-500 shadow-lg shadow-yellow-500/50',
                iconColor: '#000000',
                textColor: 'text-yellow-400',
              };
            } else {
              return {
                container: 'bg-neutral-700',
                iconColor: '#9CA3AF',
                textColor: 'text-neutral-500',
              };
            }
          };

          const stageStyles = getStageStyles();

          return (
            <View key={index} className="flex-col items-center">
              <View className="relative">
                <View
                  className={`w-8 h-8 rounded-full flex items-center justify-center relative ${stageStyles.container}`}
                >
                  <Icon size={16} color={stageStyles.iconColor} />
                </View>
                
                {/* Pulsing animation for current stage */}
                {isCurrent && (
                  <View className="absolute inset-0 rounded-full bg-yellow-500 opacity-75 animate-pulse" />
                )}
              </View>
              
              <Text
                className={`text-xs text-center mt-2 max-w-16 ${stageStyles.textColor}`}
                numberOfLines={2}
              >
                {stage.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};