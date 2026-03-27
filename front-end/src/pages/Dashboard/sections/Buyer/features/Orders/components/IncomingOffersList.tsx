import React from 'react';
import { View, Text } from 'react-native';
import { DollarSign, Calendar, Clock } from 'lucide-react-native';
import { Card, CardContent } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';
import type { BuyerIncomingOffer } from '../types';

interface IncomingOffersListProps {
  offers: BuyerIncomingOffer[];
}

const OfferCard = React.memo(({ offer }: { offer: BuyerIncomingOffer }) => (
  <Card className="bg-white border-gray-100 rounded-2xl">
    <CardContent className="p-5 gap-3">
      {/* Header: product + badge */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-gray-900 font-semibold text-lg" numberOfLines={1}>
            {offer.product}
          </Text>
          <Text className="text-gray-500 text-sm" numberOfLines={1}>
            {offer.sellerFlag ? `${offer.sellerFlag} ` : ''}{offer.seller} • {offer.sellerLocation}
          </Text>
        </View>
        <Badge className="bg-green-500/20 text-green-600">New Offer</Badge>
      </View>

      {/* Metrics row */}
      <View className="flex-row justify-between">
        <View>
          <Text className="text-xs text-gray-500">Quantity</Text>
          <Text className="text-gray-900 font-semibold">{offer.quantity} tons</Text>
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

      {/* Quality badges */}
      {offer.qualityOffered.length > 0 && (
        <View className="flex-row flex-wrap">
          {offer.qualityOffered.map((quality) => (
            <Badge
              key={quality}
              variant="secondary"
              className="text-xs mr-2 mb-2"
            >
              {quality}
            </Badge>
          ))}
        </View>
      )}

      {/* Delivery + response time + deadline */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Calendar size={14} color="#93c5fd" />
          <Text className="text-gray-600 text-xs ml-1">Delivery {offer.deliveryDate}</Text>
        </View>
        <View className="flex-row items-center">
          <DollarSign size={14} color="#fbbf24" />
          <Text className="text-gray-600 text-xs ml-1">{offer.responseTime} response</Text>
        </View>
      </View>

      {/* Deadline */}
      <View className="flex-row items-center">
        <Clock size={14} color="#f87171" />
        <Text className="text-red-400 text-xs ml-1">Deadline: {offer.deadline}</Text>
      </View>

      {/* Admin note (conditional) */}
      {!!offer.adminNote && (
        <Text className="text-gray-500 text-sm">{offer.adminNote}</Text>
      )}

      {/* CTAs */}
      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1">
          View Details
        </Button>
        <Button className="flex-1">Accept Offer</Button>
      </View>
    </CardContent>
  </Card>
));

OfferCard.displayName = 'OfferCard';

export const IncomingOffersList: React.FC<IncomingOffersListProps> = ({ offers }) => {
  if (offers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-gray-400 text-sm">No incoming offers at the moment.</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </View>
  );
};
