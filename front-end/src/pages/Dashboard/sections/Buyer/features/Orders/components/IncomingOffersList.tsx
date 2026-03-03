import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, DollarSign, Calendar } from 'lucide-react-native';
import { Card, CardContent } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';
import type { BuyerIncomingOffer } from '../types';

interface IncomingOffersListProps {
  offers: BuyerIncomingOffer[];
}

export const IncomingOffersList: React.FC<IncomingOffersListProps> = ({ offers }) => (
  <View className="space-y-4">
    {offers.map((offer) => (
      <Card key={offer.id} className="bg-white border-gray-100 rounded-2xl">
        <CardContent className="p-5 space-y-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-900 font-semibold text-lg">{offer.product}</Text>
              <Text className="text-gray-500 text-sm">
                {offer.sellerFlag} {offer.seller} • {offer.sellerLocation}
              </Text>
            </View>
            <Badge className="bg-green-500/20 text-green-300">New Offer</Badge>
          </View>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-gray-500">Quantity</Text>
              <Text className="text-white font-semibold">{offer.quantity} tons</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500">Price/ton</Text>
              <Text className="text-gray-900 font-semibold">${offer.offeredPricePerTon}</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500">Total</Text>
              <Text className="text-gray-900 font-semibold">
                ${offer.totalValue.toLocaleString()}
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {offer.qualityOffered.map((quality) => (
              <Badge key={quality} variant="secondary" className="text-xs">
                {quality}
              </Badge>
            ))}
          </View>
          <View className="flex-row justify-between items-center text-sm">
            <View className="flex-row items-center text-gray-600">
              <Calendar size={14} color="#93c5fd" />
              <Text className="text-gray-600 ml-2">Delivery {offer.deliveryDate}</Text>
            </View>
            <View className="flex-row items-center text-gray-600">
              <DollarSign size={14} color="#fbbf24" />
              <Text className="text-gray-600 ml-2">{offer.responseTime} response</Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm">{offer.adminNote}</Text>
          <View className="flex-row gap-3">
            <Button variant="secondary" className="flex-1">
              View Details
            </Button>
            <Button className="flex-1">Accept Offer</Button>
          </View>
        </CardContent>
      </Card>
    ))}
  </View>
);
