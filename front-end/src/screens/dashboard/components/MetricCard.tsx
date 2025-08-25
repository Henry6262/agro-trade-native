import React from 'react';
import { View, Text } from 'react-native';
import { BaseComponentProps } from '../../../types';

interface MetricCardProps extends BaseComponentProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  gradient?: string;
  borderColor?: string;
  iconColor?: string;
  valueColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  gradient = 'from-blue-500/10 to-blue-600/5',
  borderColor = 'border-blue-500/20',
  iconColor = '#60A5FA',
  valueColor = 'text-blue-400',
  testID,
  accessibilityLabel,
}) => {
  return (
    <View
      className={`bg-gradient-to-br ${gradient} border ${borderColor} rounded-lg p-3`}
      testID={testID}
      accessibilityLabel={accessibilityLabel || `${title}: ${value}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs text-neutral-400 mb-1">
            {title}
          </Text>
          <Text className={`text-lg font-bold ${valueColor}`}>
            {value}
          </Text>
        </View>
        <View className="w-8 h-8 items-center justify-center">
          <Icon size={20} color={iconColor} />
        </View>
      </View>
    </View>
  );
};