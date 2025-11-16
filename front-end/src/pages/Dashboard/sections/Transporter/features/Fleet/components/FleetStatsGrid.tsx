import React from 'react';
import { View } from 'react-native';
import { Truck, CheckCircle, Route, Shield } from 'lucide-react-native';
import { MetricCard } from '../../../components/MetricCard';
import type { FleetSummary } from '../types';

interface FleetStatsGridProps {
  summary: FleetSummary;
}

export const FleetStatsGrid: React.FC<FleetStatsGridProps> = ({ summary }) => {
  const cards = [
    {
      title: 'TOTAL TRUCKS',
      value: summary.totalTrucks.toString(),
      icon: Truck,
      gradient: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      iconColor: '#60A5FA',
      valueColor: 'text-blue-400',
    },
    {
      title: 'AVAILABLE',
      value: summary.availableTrucks.toString(),
      icon: CheckCircle,
      gradient: 'from-green-500/10 to-green-600/5',
      borderColor: 'border-green-500/20',
      iconColor: '#34D399',
      valueColor: 'text-green-400',
    },
    {
      title: 'IN TRANSIT',
      value: summary.inTransitTrucks.toString(),
      icon: Route,
      gradient: 'from-yellow-500/10 to-yellow-600/5',
      borderColor: 'border-yellow-500/20',
      iconColor: '#FCD34D',
      valueColor: 'text-yellow-400',
    },
    {
      title: 'VERIFIED',
      value: summary.verifiedTrucks.toString(),
      icon: Shield,
      gradient: 'from-purple-500/10 to-purple-600/5',
      borderColor: 'border-purple-500/20',
      iconColor: '#A78BFA',
      valueColor: 'text-purple-400',
    },
  ];

  return (
    <View className="flex-row flex-wrap -mx-1">
      {cards.map((card) => (
        <View key={card.title} className="w-1/2 px-1 mb-2">
          <MetricCard {...card} />
        </View>
      ))}
    </View>
  );
};
