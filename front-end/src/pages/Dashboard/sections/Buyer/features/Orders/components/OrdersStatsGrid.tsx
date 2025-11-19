import React from 'react';
import { View, Text } from 'react-native';
import { DollarSign, Calendar, CheckCircle, Award } from 'lucide-react-native';
import { Card, CardContent } from '../../../../../../shared/components/Card';
import type { BuyerStatistics } from '../types';

interface OrdersStatsGridProps {
  stats: BuyerStatistics;
}

export const OrdersStatsGrid: React.FC<OrdersStatsGridProps> = ({ stats }) => (
  <View className="flex-row gap-2 mb-6">
    <Card className="bg-neutral-900 border-neutral-700 flex-1">
      <CardContent className="p-3 items-center">
        <DollarSign color="#60a5fa" size={20} />
        <Text className="text-xs text-neutral-400 mt-1">Total</Text>
        <Text className="text-lg font-bold text-white">
          ${(stats.totalSpent / 1000).toFixed(0)}k
        </Text>
        <Text className="text-xs text-blue-400">-{stats.savingsRate}%</Text>
      </CardContent>
    </Card>
    <Card className="bg-neutral-900 border-neutral-700 flex-1">
      <CardContent className="p-3 items-center">
        <Calendar color="#22c55e" size={20} />
        <Text className="text-xs text-neutral-400 mt-1">Month</Text>
        <Text className="text-lg font-bold text-white">
          ${(stats.monthlySpent / 1000).toFixed(0)}k
        </Text>
        <Text className="text-xs text-green-400">Jan 2025</Text>
      </CardContent>
    </Card>
    <Card className="bg-neutral-900 border-neutral-700 flex-1">
      <CardContent className="p-3 items-center">
        <CheckCircle color="#fbbf24" size={20} />
        <Text className="text-xs text-neutral-400 mt-1">Completed</Text>
        <Text className="text-lg font-bold text-white">{stats.completedOrders}</Text>
        <Text className="text-xs text-yellow-400">Avg ${stats.averagePerOrder}</Text>
      </CardContent>
    </Card>
    <Card className="bg-neutral-900 border-neutral-700 flex-1">
      <CardContent className="p-3 items-center">
        <Award color="#a855f7" size={20} />
        <Text className="text-xs text-neutral-400 mt-1">Top Product</Text>
        <Text className="text-lg font-bold text-white">{stats.topProduct}</Text>
        <Text className="text-xs text-purple-400">Best margin</Text>
      </CardContent>
    </Card>
  </View>
);
