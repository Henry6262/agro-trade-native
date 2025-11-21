import React from 'react';
import { View } from 'react-native';
import { MetricCard } from '../../../components/MetricCard';
import { Package, CheckCircle, Timer } from 'lucide-react-native';
import type { TransportOfferSummary } from '../types';

interface OffersSummaryGridProps {
  summary: TransportOfferSummary;
}

export const OffersSummaryGrid: React.FC<OffersSummaryGridProps> = ({ summary }) => (
  <View className="flex-row flex-wrap -mx-1">
    <View className="w-1/2 px-1 mb-2">
      <MetricCard
        title="PENDING"
        value={String(summary.totalPending)}
        icon={Package}
        gradient="from-orange-500/10 to-orange-500/5"
        borderColor="border-orange-500/20"
        iconColor="#fb923c"
        valueColor="text-orange-400"
      />
    </View>
    <View className="w-1/2 px-1 mb-2">
      <MetricCard
        title="VERIFIED"
        value={String(summary.verifiedCount)}
        icon={CheckCircle}
        gradient="from-green-500/10 to-green-500/5"
        borderColor="border-green-500/20"
        iconColor="#34d399"
        valueColor="text-green-400"
      />
    </View>
    <View className="w-full px-1 mb-2">
      <MetricCard
        title="EARLIEST DEADLINE"
        value={
          summary.earliestDeadline ? new Date(summary.earliestDeadline).toLocaleDateString() : 'N/A'
        }
        icon={Timer}
        gradient="from-yellow-500/10 to-yellow-500/5"
        borderColor="border-yellow-500/20"
        iconColor="#fbbf24"
        valueColor="text-yellow-400"
      />
    </View>
  </View>
);
