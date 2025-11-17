import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { Card, CardContent } from '../../../../../../shared/components/Card';
import { Badge } from '../../../../../../shared/components/Badge';
import { BuyerRequestCard } from '../../../../../../shared/components/BuyerRequestCard';
import type { BuyerRequest } from '../types';

interface RequestsListProps {
  requests: BuyerRequest[];
  onOpenOffers: (request: BuyerRequest) => void;
}

export const RequestsList: React.FC<RequestsListProps> = ({ requests, onOpenOffers }) => (
  <View className="space-y-4">
    {requests.map((request) => (
      <Card key={request.id} className="bg-neutral-900 border-neutral-800 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-bold text-lg">{request.product}</Text>
              <Text className="text-neutral-400 text-sm">{request.deliveryLocation}</Text>
            </View>
            <Badge className="bg-blue-500/20 text-blue-300">{request.status}</Badge>
          </View>

          <BuyerRequestCard
            request={{
              id: request.id,
              product: request.product,
              quantity: request.quantity,
              unit: request.unit,
              budget: request.maxPricePerUnit ?? undefined,
              deliveryLocation: request.deliveryLocation,
              qualityRequirements: request.qualityRequirements,
              createdAt: request.created,
              offers: request.offers,
              bestOffer: request.bestOffer ?? undefined,
              status: request.status,
            }}
            onViewOffers={() => onOpenOffers(request)}
          />

          <View className="flex-row justify-between text-sm text-neutral-400 mt-2">
            <Text>Requested {format(new Date(request.created), 'MMM dd, yyyy')}</Text>
            <Text>{request.offers} offers</Text>
          </View>
        </CardContent>
      </Card>
    ))}
  </View>
);
