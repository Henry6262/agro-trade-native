import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  Package,
  DollarSign,
  CheckCircle,
  Timer,
  AlertTriangle,
  Weight,
  MapPin,
  Calendar,
  Navigation,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { MetricCard } from '../../components/MetricCard';
import { BaseComponentProps } from '@shared/types';
import { MapDrawer } from '../maps/components/MapDrawer';
import { MapOffer } from '../maps/types';

interface TransporterIncomingOffersTabProps extends BaseComponentProps {
  id?: string;
}

interface IncomingOffer {
  id: string;
  product: string;
  quantity: string;
  from: string;
  fromFlag: string;
  to: string;
  toFlag: string;
  distance: string;
  userDistance: string;
  deadline: string;
  offeredPrice: string;
  estimatedFuel: string;
  estimatedProfit: string;
  priority: 'low' | 'medium' | 'high';
  timeToRespond: string;
  tags: string[];
  adminNote: string;
}

export const TransporterIncomingOffersTab: React.FC<TransporterIncomingOffersTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const [selectedOffer, setSelectedOffer] = useState<MapOffer | null>(null);
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);

  const handleViewRoute = (offer: IncomingOffer) => {
    // Convert IncomingOffer to MapOffer format
    const mapOffer: MapOffer = {
      id: offer.id,
      quantity: parseInt(offer.quantity), // Convert "30 tons" to 30
      pickup: {
        coordinates: { 
          latitude: 25.2744 + Math.random() * 0.05, // Mock coordinates
          longitude: 51.5111 + Math.random() * 0.05 
        },
        address: {
          street: 'Farm Road',
          city: offer.from.split(' ')[0],
          state: 'State',
          country: 'USA',
        },
        name: offer.from,
        type: 'pickup',
      },
      delivery: {
        coordinates: { 
          latitude: 25.2854 + Math.random() * 0.05, // Mock coordinates
          longitude: 51.5310 + Math.random() * 0.05 
        },
        address: {
          city: offer.to.split(' ')[0],
          state: 'State',
          country: 'USA',
        },
        name: offer.to,
        type: 'delivery',
      },
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      status: 'pending',
      estimatedValue: parseFloat(offer.offeredPrice.replace(/[$,]/g, '')),
      productType: offer.product.toLowerCase().includes('wheat') ? 'grains' : 
                   offer.product.toLowerCase().includes('soybean') ? 'vegetables' : 'other',
    };
    
    setSelectedOffer(mapOffer);
    setIsMapDrawerOpen(true);
  };

  const mockOffers: IncomingOffer[] = [
    {
      id: "IO001",
      product: "Premium Wheat",
      quantity: "30 tons",
      from: "Iowa Premium Farms",
      fromFlag: "🇺🇸",
      to: "Chicago Grain Terminal",
      toFlag: "🇺🇸",
      distance: "195 mi",
      userDistance: "52 mi",
      deadline: "Oct 5",
      offeredPrice: "$3,800",
      estimatedFuel: "$485",
      estimatedProfit: "$1,200",
      priority: "high",
      timeToRespond: "2d 14h",
      tags: ["Non-GMO", "Premium Grade"],
      adminNote: "Preferred transporter for this route",
    },
    {
      id: "IO002",
      product: "Organic Soybeans",
      quantity: "22 tons",
      from: "Nebraska Organic Co.",
      fromFlag: "🇺🇸",
      to: "Kansas Processing Hub",
      toFlag: "🇺🇸",
      distance: "165 mi",
      userDistance: "38 mi",
      deadline: "Oct 8",
      offeredPrice: "$2,950",
      estimatedFuel: "$380",
      estimatedProfit: "$890",
      priority: "medium",
      timeToRespond: "4d 8h",
      tags: ["Organic", "Export Quality"],
      adminNote: "Long-term partnership opportunity",
    },
    {
      id: "IO003",
      product: "Sweet Corn",
      quantity: "18 tons",
      from: "Missouri Valley Farm",
      fromFlag: "🇺🇸",
      to: "St. Louis Market",
      toFlag: "🇺🇸",
      distance: "120 mi",
      userDistance: "25 mi",
      deadline: "Oct 6",
      offeredPrice: "$2,200",
      estimatedFuel: "$280",
      estimatedProfit: "$720",
      priority: "low",
      timeToRespond: "3d 6h",
      tags: ["Fresh", "Local"],
      adminNote: "Regular route available",
    },
  ];

  return (
    <>
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <View className="p-4 space-y-4">
        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-1">
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="NEW OFFERS"
              value="5"
              icon={Package}
              gradient="from-yellow-500/10 to-yellow-600/5"
              borderColor="border-yellow-500/20"
              iconColor="#FCD34D"
              valueColor="text-yellow-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="AVG PROFIT"
              value="$936"
              icon={DollarSign}
              gradient="from-green-500/10 to-green-600/5"
              borderColor="border-green-500/20"
              iconColor="#34D399"
              valueColor="text-green-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="HIGH PRIORITY"
              value="2"
              icon={AlertTriangle}
              gradient="from-red-500/10 to-red-600/5"
              borderColor="border-red-500/20"
              iconColor="#EF4444"
              valueColor="text-red-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="EXPIRING SOON"
              value="1"
              icon={Timer}
              gradient="from-orange-500/10 to-orange-600/5"
              borderColor="border-orange-500/20"
              iconColor="#F97316"
              valueColor="text-orange-400"
            />
          </View>
        </View>

        {/* Incoming Offers Section */}
        <View className="mt-4">
          <View className="flex-row items-center mb-3">
            <Package size={20} color="#FCD34D" />
            <Text className="text-lg font-semibold text-yellow-400 ml-2">AVAILABLE OFFERS</Text>
          </View>

          {mockOffers.map((offer) => (
            <View
              key={offer.id}
              className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-lg p-6 mb-3 mx-2"
            >
              {/* Header - Route Priority */}
              <View className="mb-3">
                {/* Route Information - Primary Focus - Single Line */}
                <View className="flex-row items-center mb-3" style={{ minHeight: 24 }}>
                  <Text className="text-base">{offer.fromFlag}</Text>
                  <Text className="text-white font-bold mx-1" numberOfLines={1} style={{ maxWidth: '35%' }}>
                    {offer.from.split(' ')[0]}
                  </Text>
                  <Text className="text-neutral-500 mx-1">→</Text>
                  <Text className="text-base">{offer.toFlag}</Text>
                  <Text className="text-white font-bold mx-1 flex-1" numberOfLines={1}>
                    {offer.to.split(' ')[0]}
                  </Text>
                </View>

                {/* Key Metrics Row - Gray Color */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Weight size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 font-semibold ml-1">{offer.quantity}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MapPin size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 font-semibold ml-1">{offer.distance}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Calendar size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 font-semibold ml-1">{offer.deadline}</Text>
                  </View>
                </View>
              </View>

              {/* Financial Breakdown */}
              <View className="flex-row mb-4">
                <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-3 mr-2">
                  <Text className="text-xs text-green-400 mb-1">OFFERED PRICE</Text>
                  <Text className="text-lg font-bold text-green-400">{offer.offeredPrice}</Text>
                </View>
                <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mr-2">
                  <Text className="text-xs text-red-400 mb-1">EST. FUEL</Text>
                  <Text className="text-lg font-bold text-red-400">{offer.estimatedFuel}</Text>
                </View>
                <View className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <Text className="text-xs text-blue-400 mb-1">EST. PROFIT</Text>
                  <Text className="text-lg font-bold text-blue-400">{offer.estimatedProfit}</Text>
                </View>
              </View>

              {/* Driver Distance Info */}
              <View className="mb-3">
                <View className="flex-row items-center">
                  <Navigation size={16} color="#60A5FA" />
                  <Text className="text-sm text-neutral-400 ml-2">
                    Nearest driver: <Text className="text-blue-400 font-medium">{offer.userDistance} away</Text>
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row 1 */}
              <View className="flex-row items-center justify-between mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500/50 flex-1 mr-2"
                  onPress={() => handleViewRoute(offer)}
                >
                  <MapPin size={14} color="#60A5FA" />
                  <Text className="text-blue-400 ml-1">View Route</Text>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-500/50 flex-1"
                  onPress={() => console.log('Counter')}
                >
                  <Text className="text-yellow-400">COUNTER</Text>
                </Button>
              </View>

              {/* Action Buttons Row 2 */}
              <View className="flex-row items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 flex-1 mr-2"
                  onPress={() => console.log('Decline')}
                >
                  <Text className="text-red-400">DECLINE</Text>
                </Button>
                <Button
                  size="sm"
                  variant="gradient"
                  className="bg-gradient-to-r from-green-600 to-green-700 flex-1"
                  onPress={() => console.log('Accept')}
                >
                  <CheckCircle size={14} color="#FFFFFF" />
                  <Text className="ml-1 text-white">ACCEPT</Text>
                </Button>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
    
    {/* Map Drawer - Outside ScrollView for fixed positioning */}
    <MapDrawer
      isOpen={isMapDrawerOpen}
      offer={selectedOffer}
      onClose={() => {
        setIsMapDrawerOpen(false);
        setSelectedOffer(null);
      }}
    />
    </>
  );
};