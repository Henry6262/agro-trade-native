import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import {
  Calendar,
  Truck,
  MapPin,
  CheckCircle,
} from 'lucide-react-native';

interface Stage {
  name: string;
  description: string;
  icon: any;
}

interface FixedProgressHeaderProps {
  currentStage: number;
  stages?: Stage[];
}

export const FixedProgressHeader: React.FC<FixedProgressHeaderProps> = ({
  currentStage,
  stages,
}) => {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  const progressWidth = isMobile ? Math.min(width * 0.85, 340) : 420;

  const defaultStages: Stage[] = stages || [
    { name: "Scheduled", description: "Pickup scheduled", icon: Calendar },
    { name: "Traveling", description: "Driver en route", icon: Truck },
    { name: "Arrived", description: "At pickup location", icon: MapPin },
    { name: "Completed", description: "Goods delivered", icon: CheckCircle },
  ];

  return (
    <View 
      className="absolute top-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-700 z-50"
      style={{
        paddingTop: isMobile ? 10 : 16,
        paddingBottom: isMobile ? 10 : 16,
      }}
    >
      <View className="px-4">
        <View className={`relative ${isMobile ? 'mx-auto' : 'mx-auto'}`} style={{ maxWidth: progressWidth }}>
          {/* Progress Bar Background */}
          <View className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-700 z-0" />

          {/* Active Progress Bar */}
          <View
            className="absolute top-4 left-4 h-0.5 bg-green-500 z-0"
            style={{
              width: `${(currentStage / (defaultStages.length - 1)) * (progressWidth - 32)}px`,
            }}
          />

          <View className="flex-row justify-between relative z-10">
            {defaultStages.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = index < currentStage;
              const isCurrent = index === currentStage;

              return (
                <View key={index} className="items-center">
                  <View
                    className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} rounded-full items-center justify-center relative ${
                      isCompleted
                        ? "bg-green-500"
                        : isCurrent
                          ? "bg-yellow-500"
                          : "bg-neutral-700"
                    }`}
                  >
                    <Icon
                      color={isCompleted || isCurrent ? "#ffffff" : "#9CA3AF"}
                      size={isMobile ? 12 : 14}
                    />
                    {isCurrent && (
                      <View className="absolute inset-0 rounded-full bg-yellow-500 opacity-75 animate-pulse" />
                    )}
                  </View>
                  <Text
                    className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} text-center mt-1 ${isMobile ? 'max-w-12' : 'max-w-14'} ${
                      isCompleted
                        ? "text-green-400"
                        : isCurrent
                          ? "text-yellow-400"
                          : "text-neutral-500"
                    }`}
                  >
                    {stage.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

export default FixedProgressHeader;