import React from 'react';
import { View, Text } from 'react-native';
import { Card, CardContent } from '../../../../../../shared/components/Card';
import type { OfferStatCard } from '../types';

interface OfferStatsGridProps {
  cards: OfferStatCard[];
}

export const OfferStatsGrid: React.FC<OfferStatsGridProps> = ({ cards }) => (
  <View className="flex-row justify-between gap-2 mb-6">
    {cards.map((card) => (
      <Card key={card.id} className="bg-neutral-900 border-neutral-700 flex-1">
        <CardContent className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <card.Icon color={card.iconColor} size={24} />
            <Text className="text-2xl font-bold text-white">{card.value}</Text>
          </View>
          <Text className="text-xs text-neutral-400">{card.label}</Text>
          {card.subLabel ? (
            <Text className="text-[10px] text-neutral-500 mt-1">{card.subLabel}</Text>
          ) : null}
        </CardContent>
      </Card>
    ))}
  </View>
);
