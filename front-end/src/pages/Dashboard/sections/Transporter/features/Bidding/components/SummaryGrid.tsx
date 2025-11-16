import React from 'react';
import { View } from 'react-native';
import { Target, Trophy, DollarSign, TrendingUp } from 'lucide-react-native';
import { MetricCard } from '../../components/MetricCard';
import type { TransporterBiddingSummary } from '../types';

interface TransporterBiddingSummaryGridProps {
  summary: TransporterBiddingSummary;
}

export const TransporterBiddingSummaryGrid: React.FC<TransporterBiddingSummaryGridProps> = ({
  summary,
}) => (
  <View className="flex-row flex-wrap -mx-1">
    <View className="w-1/2 px-1 mb-2">
      <MetricCard
        title="ACTIVE BIDS"
        value={summary.activeBids.toString()}
        icon={Target}
        gradient="from-blue-500/10 to-blue-600/5"
        borderColor="border-blue-500/20"
        iconColor="#60A5FA"
        valueColor="text-blue-400"
      />
    </View>
    <View className="w-1/2 px-1 mb-2">
      <MetricCard
        title="WIN RATE"
        value={summary.winRate}
        icon={Trophy}
        gradient="from-green-500/10 to-green-600/5"
        borderColor="border-green-500/20"
        iconColor="#34D399"
        valueColor="text-green-400"
      />
    </View>
    <View className="w-1/2 px-1 mb-2">
      <MetricCard
        title="AVG BID"
        value={summary.averageBid}
        icon={DollarSign}
        gradient="from-yellow-500/10 to-yellow-600/5"
        borderColor="border-yellow-500/20"
        iconColor="#FCD34D"
        valueColor="text-yellow-400"
      />
    </View>
    <View className="w-1/2 px-1 mb-2">
      <MetricCard
        title="COMPLETED JOBS"
        value={summary.completedJobs.toString()}
        icon={TrendingUp}
        gradient="from-purple-500/10 to-purple-600/5"
        borderColor="border-purple-500/20"
        iconColor="#A78BFA"
        valueColor="text-purple-400"
      />
    </View>
  </View>
);
