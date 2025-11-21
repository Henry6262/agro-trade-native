import React from 'react';
import { View } from 'react-native';
import { Truck, CheckCircle, DollarSign } from 'lucide-react-native';
import { MetricCard } from '../../../components/MetricCard';
import type { TransfersSummary } from '../types';

interface TransfersStatsGridProps {
  summary: TransfersSummary;
}

export const TransfersStatsGrid: React.FC<TransfersStatsGridProps> = ({ summary }) => (
  <View className="flex-row flex-wrap -mx-1">
    <View className="w-1/3 px-1 mb-2">
      <MetricCard
        title="ACTIVE"
        value={summary.activeJobs.toString()}
        icon={Truck}
        gradient="from-blue-500/10 to-blue-600/5"
        borderColor="border-blue-500/20"
        iconColor="#60A5FA"
        valueColor="text-blue-400"
      />
    </View>
    <View className="w-1/3 px-1 mb-2">
      <MetricCard
        title="COMPLETED"
        value={summary.completedJobs.toString()}
        icon={CheckCircle}
        gradient="from-green-500/10 to-green-600/5"
        borderColor="border-green-500/20"
        iconColor="#34D399"
        valueColor="text-green-400"
      />
    </View>
    <View className="w-1/3 px-1 mb-2">
      <MetricCard
        title="EARNINGS"
        value={summary.totalEarningsLabel}
        icon={DollarSign}
        gradient="from-yellow-500/10 to-yellow-600/5"
        borderColor="border-yellow-500/20"
        iconColor="#FBBF24"
        valueColor="text-yellow-400"
      />
    </View>
  </View>
);
