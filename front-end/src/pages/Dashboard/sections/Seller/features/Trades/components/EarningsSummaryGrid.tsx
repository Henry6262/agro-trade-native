import React from 'react';
import { View, Text } from 'react-native';
import { Card, CardContent } from '@shared/components/Card';
import { DollarSign, Calendar, Target, Award } from 'lucide-react-native';
import type { EarningsSummary } from '../types';

interface EarningsSummaryGridProps {
  summary: EarningsSummary;
  isMobile: boolean;
}

export const EarningsSummaryGrid: React.FC<EarningsSummaryGridProps> = ({ summary, isMobile }) => (
  <View className={`${isMobile ? 'flex-row flex-wrap' : 'flex-row justify-between gap-2'} mb-6`}>
    <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
      <CardContent className="p-3">
        <View className="items-center">
          <DollarSign color="#22c55e" size={20} />
          <Text className="text-xs text-neutral-400 mt-1">Total</Text>
          <Text className="text-lg font-bold text-white">
            ${(summary.totalEarnings / 1000).toFixed(0)}k
          </Text>
          <Text className="text-xs text-green-400">+{summary.growthRate}%</Text>
        </View>
      </CardContent>
    </Card>

    <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
      <CardContent className="p-3">
        <View className="items-center">
          <Calendar color="#60a5fa" size={20} />
          <Text className="text-xs text-neutral-400 mt-1">Month</Text>
          <Text className="text-lg font-bold text-white">
            ${(summary.monthlyEarnings / 1000).toFixed(0)}k
          </Text>
          <Text className="text-xs text-blue-400">Jan 2025</Text>
        </View>
      </CardContent>
    </Card>

    <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
      <CardContent className="p-3">
        <View className="items-center">
          <Target color="#8b5cf6" size={20} />
          <Text className="text-xs text-neutral-400 mt-1">Trades</Text>
          <Text className="text-lg font-bold text-white">{summary.completedTrades}</Text>
          <Text className="text-xs text-purple-400">
            ${(summary.averagePerTrade / 1000).toFixed(1)}k avg
          </Text>
        </View>
      </CardContent>
    </Card>

    <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
      <CardContent className="p-3">
        <View className="items-center">
          <Award color="#fb923c" size={20} />
          <Text className="text-xs text-neutral-400 mt-1">Top</Text>
          <Text className="text-sm font-bold text-white">{summary.topProduct}</Text>
          <Text className="text-xs text-orange-400">45%</Text>
        </View>
      </CardContent>
    </Card>
  </View>
);
