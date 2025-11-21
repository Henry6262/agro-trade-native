import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import type { TradeStage } from '../types';

interface TradeStageTimelineProps {
  currentStage: number;
  stages: TradeStage[];
}

export const TradeStageTimeline: React.FC<TradeStageTimelineProps> = ({ currentStage, stages }) => {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  const progressWidth = isMobile ? Math.min(width * 0.8, 320) : 400;

  return (
    <View
      className={`relative mb-6 ${isMobile ? 'mx-auto' : ''}`}
      style={{ maxWidth: progressWidth }}
    >
      <View className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-700 z-0" />
      <View
        className="absolute top-4 left-4 h-0.5 bg-green-500 z-0"
        style={{ width: (currentStage / (stages.length - 1)) * (progressWidth - 32) }}
      />
      <View className="flex-row justify-between relative z-10">
        {stages.map((stage, index) => {
          const IconComponent = stage.icon;
          const isCompleted = index < currentStage;
          const isCurrent = index === currentStage;
          return (
            <View key={stage.name} className="flex flex-col items-center">
              <View
                className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                  isCompleted ? 'bg-green-500' : isCurrent ? 'bg-yellow-500' : 'bg-neutral-700'
                }`}
              >
                <IconComponent color={isCompleted || isCurrent ? '#ffffff' : '#9CA3AF'} size={16} />
                {isCurrent && (
                  <View className="absolute inset-0 rounded-full bg-yellow-500 opacity-75" />
                )}
              </View>
              <Text
                className={`text-xs text-center mt-2 max-w-16 ${
                  isCompleted
                    ? 'text-green-400'
                    : isCurrent
                      ? 'text-yellow-400'
                      : 'text-neutral-500'
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
};
