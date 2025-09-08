import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  Weight,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Calendar,
  Award,
  Target,
} from 'lucide-react-native';

import { Card, CardContent } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';

interface SellerOffersTabProps {
  id?: string;
}

export default function SellerOffersTab({ id }: SellerOffersTabProps = {}) {
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);

  const earningsData = {
    totalOffers: 23,
    acceptedThisMonth: 8,
    pendingOffers: 5,
    averageOfferValue: 18500,
    topRequestedProduct: 'Premium Wheat',
    conversionRate: 34.8,
  };

  const incomingOffers = [
    {
      id: 'IO001',
      product: 'Premium Wheat',
      quantity: 45,
      offeredPricePerTon: 295,
      totalValue: 13275,
      buyer: 'Global Grain Corp',
      buyerLocation: 'New York, NY',
      buyerFlag: '🇺🇸',
      adminNote: 'Urgent order for premium wheat. Client willing to pay above market rate for quality assurance.',
      deadline: '2025-01-26',
      responseTime: '18 hours',
      estimatedProfit: 675,
      qualityRequirements: ['Organic', 'Non-GMO', 'Protein 15%+'],
      status: 'pending',
    },
    {
      id: 'IO002',
      product: 'Soybeans',
      quantity: 60,
      offeredPricePerTon: 365,
      totalValue: 21900,
      buyer: 'EuroFeed Solutions',
      buyerLocation: 'Hamburg, Germany',
      buyerFlag: '🇩🇪',
      adminNote: 'Export opportunity to European market. Premium pricing for certified organic soybeans.',
      deadline: '2025-01-28',
      responseTime: '2 days',
      estimatedProfit: 900,
      qualityRequirements: ['Organic', 'EU Certified', 'Protein 18%'],
      status: 'pending',
    },
    {
      id: 'IO003',
      product: 'Corn Grain',
      quantity: 80,
      offeredPricePerTon: 225,
      totalValue: 18000,
      buyer: 'MidWest Feed Co',
      buyerLocation: 'Chicago, IL',
      buyerFlag: '🇺🇸',
      adminNote: 'Regular bulk order for animal feed production. Consistent monthly demand expected.',
      deadline: '2025-01-30',
      responseTime: '3 days',
      estimatedProfit: 1200,
      qualityRequirements: ['Grade A', 'Moisture < 14%'],
      status: 'pending',
    },
    {
      id: 'IO004',
      product: 'Premium Rice',
      quantity: 35,
      offeredPricePerTon: 420,
      totalValue: 14700,
      buyer: 'Asian Imports Ltd',
      buyerLocation: 'Singapore',
      buyerFlag: '🇸🇬',
      adminNote: 'High-quality long grain rice for Southeast Asian market. Export documentation required.',
      deadline: '2025-02-01',
      responseTime: '4 days',
      estimatedProfit: 850,
      qualityRequirements: ['Long Grain', 'Premium Grade', 'Export Quality'],
      status: 'pending',
    },
  ];

  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      default:
        return 'bg-neutral-500';
    }
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white">Incoming Offers</Text>
            <Text className="text-neutral-400">Review and respond to buyer requests</Text>
          </View>

          {/* Stats Cards - Responsive Grid */}
          <View className={`${isMobile ? 'flex-row flex-wrap' : 'flex-row justify-between gap-2'} mb-6`}>
            {/* Total Offers */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <Target color="#22c55e" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Total</Text>
                  <Text className="text-lg font-bold text-white">{earningsData.totalOffers}</Text>
                  <Text className="text-xs text-green-400">This Month</Text>
                </View>
              </CardContent>
            </Card>

            {/* Pending Offers */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <Clock color="#fb923c" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Pending</Text>
                  <Text className="text-lg font-bold text-white">{earningsData.pendingOffers}</Text>
                  <Text className="text-xs text-orange-400">Awaiting</Text>
                </View>
              </CardContent>
            </Card>

            {/* Accepted */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <CheckCircle color="#60a5fa" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Accepted</Text>
                  <Text className="text-lg font-bold text-white">{earningsData.acceptedThisMonth}</Text>
                  <Text className="text-xs text-blue-400">
                    {earningsData.conversionRate}% rate
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Average Value */}
            <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
              <CardContent className="p-3">
                <View className="items-center">
                  <DollarSign color="#8b5cf6" size={20} />
                  <Text className="text-xs text-neutral-400 mt-1">Avg Value</Text>
                  <Text className="text-lg font-bold text-white">
                    ${(earningsData.averageOfferValue / 1000).toFixed(1)}k
                  </Text>
                  <Text className="text-xs text-purple-400">Per Offer</Text>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Offers List */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold text-white">Active Offers</Text>
              <TouchableOpacity>
                <Badge className="bg-orange-500 text-white px-3 py-1 rounded">
                  <Text className="text-white text-sm">{earningsData.pendingOffers} Pending</Text>
                </Badge>
              </TouchableOpacity>
            </View>

            {incomingOffers.map((offer) => (
              <Card
                key={offer.id}
                className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30 mb-4"
              >
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View>
                      <Text className="text-lg font-semibold text-white">{offer.product}</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight color="#fb923c" size={16} />
                          <Text className="text-white font-medium text-sm">{offer.quantity} tons</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign color="#fb923c" size={16} />
                          <Text className="text-white font-medium text-sm">${offer.offeredPricePerTon}/ton</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-orange-500/20 px-2 py-1 rounded">
                          <Text className="text-orange-300 text-xs">Total:</Text>
                          <Text className="text-orange-400 font-bold text-sm">
                            ${offer.totalValue.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Badge className="bg-orange-500 text-white px-2 py-1 rounded flex-row items-center gap-1">
                      <Clock color="#ffffff" size={12} />
                      <Text className="text-white text-xs">{offer.responseTime}</Text>
                    </Badge>
                  </View>

                  <View className="mb-4">
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Buyer:</Text>
                      <Text className="text-white font-medium">{offer.buyer}</Text>
                      <View className="flex-row items-center gap-1">
                        <MapPin color="#9ca3af" size={12} />
                        <Text className="text-neutral-400 text-sm">
                          {offer.buyerFlag} {offer.buyerLocation}
                        </Text>
                      </View>
                    </View>
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Quality Requirements:</Text>
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {offer.qualityRequirements.map((req, index) => (
                          <Badge
                            key={index}
                            className="text-xs border-orange-400 text-orange-300 border px-2 py-1 rounded"
                          >
                            {req}
                          </Badge>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Estimated Profit Highlight */}
                  <View className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-green-400 text-sm">Estimated Profit</Text>
                      <Text className="text-green-400 font-bold text-lg">
                        +${offer.estimatedProfit}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                    <Text className="text-neutral-400 text-sm">Admin Note:</Text>
                    <Text className="text-neutral-300 mt-1 text-sm">{offer.adminNote}</Text>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex-row items-center justify-center gap-2">
                      <CheckCircle color="#ffffff" size={16} />
                      <Text className="text-white">Accept Offer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-transparent border border-red-500 text-red-400 hover:bg-red-500/10 py-2 px-3 rounded">
                      <X color="#ef4444" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-transparent border border-orange-500 text-orange-400 hover:bg-orange-500/10 py-2 px-3 rounded">
                      <DollarSign color="#fb923c" size={16} />
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
        {/* Bottom Padding for Navigation */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}