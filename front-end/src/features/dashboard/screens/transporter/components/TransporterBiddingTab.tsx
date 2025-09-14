import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  Package,
  Target,
  Trophy,
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  Timer,
  Weight,
  MapPin,
  Calendar,
  Navigation,
  Fuel,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { Input } from '@shared/components/Input';
import { MetricCard } from '../../components/MetricCard';
import { BaseComponentProps } from '@shared/types';
import { MapDrawer } from '../maps/components/MapDrawer';
import { MapOffer } from '../maps/types';

interface TransporterBiddingTabProps extends BaseComponentProps {
  id?: string;
}

interface JobListing {
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
  currentBid: string;
  totalBids: number;
  timeLeft: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  fuelCost: string;
  profitMargin: string;
}

export const TransporterBiddingTab: React.FC<TransporterBiddingTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<MapOffer | null>(null);
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);

  const handleVerifyToBid = () => {
    setIsVerified(true);
    setTimeout(() => {
      console.log('Verification complete! You can now place bids.');
    }, 1500);
  };

  const handleViewRoute = (job: JobListing) => {
    console.log('handleViewRoute called with job:', job.id);
    // Convert JobListing to MapOffer format
    const mapOffer: MapOffer = {
      id: job.id,
      quantity: parseInt(job.quantity), // Convert "25 tons" to 25
      pickup: {
        coordinates: { 
          latitude: 25.2744 + Math.random() * 0.05, // Mock coordinates
          longitude: 51.5111 + Math.random() * 0.05 
        },
        address: {
          street: 'Farm Road',
          city: job.from.split(' ')[0],
          state: 'State',
          country: 'USA',
        },
        name: job.from,
        type: 'pickup',
      },
      delivery: {
        coordinates: { 
          latitude: 25.2854 + Math.random() * 0.05, // Mock coordinates
          longitude: 51.5310 + Math.random() * 0.05 
        },
        address: {
          city: job.to.split(' ')[0],
          state: 'State',
          country: 'USA',
        },
        name: job.to,
        type: 'delivery',
      },
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      status: 'pending',
      estimatedValue: parseFloat(job.currentBid.replace(/[$,]/g, '')),
      productType: job.product.includes('Wheat') ? 'grains' : 
                   job.product.includes('Corn') ? 'grains' :
                   job.product.includes('Soybean') ? 'vegetables' : 'other',
    };
    
    console.log('Setting mapOffer:', mapOffer);
    setSelectedOffer(mapOffer);
    console.log('Setting isMapDrawerOpen to true');
    setIsMapDrawerOpen(true);
  };

  const mockJobs: JobListing[] = [
    {
      id: "T001",
      product: "🌾 Premium Wheat",
      quantity: "25 tons",
      from: "Iowa Farm Co.",
      fromFlag: "🇺🇸",
      to: "Chicago Grain Terminal",
      toFlag: "🇺🇸",
      distance: "180 mi",
      userDistance: "45 mi",
      deadline: "Sep 29",
      currentBid: "$3,200",
      totalBids: 12,
      timeLeft: "18h 24m",
      priority: "high",
      fuelCost: "$420",
      profitMargin: "28%",
    },
    {
      id: "T002",
      product: "🌽 Organic Corn",
      quantity: "40 tons",
      from: "Nebraska Harvest",
      fromFlag: "🇺🇸",
      to: "Kansas Processing",
      toFlag: "🇺🇸",
      distance: "220 mi",
      userDistance: "120 mi",
      deadline: "Oct 2",
      currentBid: "$4,800",
      totalBids: 8,
      timeLeft: "2d 6h",
      priority: "medium",
      fuelCost: "$580",
      profitMargin: "22%",
    },
    {
      id: "T003",
      product: "🫘 Premium Soybeans",
      quantity: "15 tons",
      from: "Illinois Organic",
      fromFlag: "🇺🇸",
      to: "Milwaukee Port",
      toFlag: "🇺🇸",
      distance: "150 mi",
      userDistance: "28 mi",
      deadline: "Sep 30",
      currentBid: "$2,400",
      totalBids: 15,
      timeLeft: "1d 12h",
      priority: "urgent",
      fuelCost: "$320",
      profitMargin: "35%",
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
              title="ACTIVE BIDS"
              value="8"
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
              value="73%"
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
              value="$2.8k"
              icon={DollarSign}
              gradient="from-yellow-500/10 to-yellow-600/5"
              borderColor="border-yellow-500/20"
              iconColor="#FCD34D"
              valueColor="text-yellow-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="RANK"
              value="#12"
              icon={TrendingUp}
              gradient="from-purple-500/10 to-purple-600/5"
              borderColor="border-purple-500/20"
              iconColor="#A78BFA"
              valueColor="text-purple-400"
            />
          </View>
        </View>

        {/* Verification Banner */}
        {!isVerified && (
          <View className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <Shield size={32} color="#FCD34D" />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-yellow-400">Verification Required</Text>
                  <Text className="text-sm text-neutral-300">Complete verification to unlock premium bidding features</Text>
                </View>
              </View>
              <Button
                onPress={handleVerifyToBid}
                variant="gradient"
                className="bg-gradient-to-r from-yellow-600 to-yellow-700"
              >
                <View className="flex-row items-center">
                  <Zap size={16} color="#000000" />
                  <Text className="ml-2 text-black font-semibold">VERIFY NOW</Text>
                </View>
              </Button>
            </View>
          </View>
        )}

        {/* Live Transport Auctions */}
        <View className="mt-4">
          <View className="flex-row items-center mb-3">
            <Package size={20} color="#34D399" />
            <Text className="text-lg font-semibold text-green-400 ml-2">LIVE TRANSPORT AUCTIONS</Text>
          </View>

          {mockJobs.map((job) => (
            <View
              key={job.id}
              className="border border-neutral-700 rounded-lg p-6 mb-3 mx-2"
            >
              {/* Header - Product and Metrics */}
              <View className="mb-3">
                <View className="flex-row items-start mb-3">
                  {/* Product Image */}
                  <View className="w-12 h-12 bg-gradient-to-br from-green-500/30 to-green-600/10 rounded-lg items-center justify-center border border-green-500/30">
                    <Text className="text-xl">{job.product.split(' ')[0]}</Text>
                  </View>
                  
                  {/* Product Name and Metrics Stacked */}
                  <View className="ml-3 flex-1">
                    {/* Product Name */}
                    <Text className="font-bold text-white mb-2">{job.product.split(' ').slice(1).join(' ')}</Text>
                    
                    {/* Metrics Row - Gray Color */}
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <Weight size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-1">{job.quantity}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MapPin size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-1">{job.distance}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Calendar size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-1">{job.deadline}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Route Information - Single Line */}
                <View className="flex-row items-center mb-3" style={{ minHeight: 24 }}>
                  <Text className="text-base">{job.fromFlag}</Text>
                  <Text className="text-white font-bold mx-1" numberOfLines={1} style={{ maxWidth: '35%' }}>
                    {job.from.split(' ')[0]}
                  </Text>
                  <Text className="text-neutral-500 mx-1">→</Text>
                  <Text className="text-base">{job.toFlag}</Text>
                  <Text className="text-white font-bold mx-1 flex-1" numberOfLines={1}>
                    {job.to.split(' ')[0]}
                  </Text>
                </View>
              </View>


              {/* Driver Distance Info */}
              <View className="flex-row justify-between mb-3">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-2">
                    <Navigation size={16} color="#9CA3AF" />
                    <Text className="text-neutral-400 ml-2">Nearest driver: <Text className="text-gray-400 font-medium">{job.userDistance} away</Text></Text>
                  </View>
                </View>

                {/* Current Bid */}
                <View className="bg-gradient-to-br from-green-500/10 to-transparent rounded-lg p-3 border border-green-500/20">
                  <Text className="text-xs text-green-400 font-medium">CURRENT BID</Text>
                  <Text className="text-2xl font-bold text-green-400">{job.currentBid}</Text>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-neutral-400">{job.totalBids} bids</Text>
                    <Text className="text-xs text-green-300 font-medium">
                      ${(parseInt(job.currentBid.replace("$", "").replace(",", "")) / parseInt(job.distance.replace(" mi", ""))).toFixed(2)}/mi
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="space-y-2">
                {/* View Route Button */}
                <View className="flex-row items-center justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/50 flex-1"
                    onPress={() => handleViewRoute(job)}
                  >
                    <MapPin size={14} color="#60A5FA" />
                    <Text className="text-blue-400 ml-1">View Route</Text>
                  </Button>
                </View>

                {/* Bid Actions */}
                <View className="flex-row justify-center items-center">
                  {selectedBid === job.id ? (
                    <View className="flex-row items-center w-full">
                      <View className="relative mr-2 flex-1">
                        <DollarSign size={14} color="#9CA3AF" style={{ position: 'absolute', left: 8, top: 10, zIndex: 10 }} />
                        <Input
                          placeholder="2800"
                          value={bidAmount}
                          onChangeText={setBidAmount}
                          keyboardType="numeric"
                          className="w-full h-8 pl-6 bg-neutral-700 border-neutral-600 text-white text-sm"
                        />
                      </View>
                      <Button
                        size="sm"
                        variant="gradient"
                        className="bg-gradient-to-r from-green-600 to-green-700 mr-2"
                        disabled={!isVerified}
                        onPress={() => console.log('Place bid')}
                      >
                        <Zap size={14} color="#FFFFFF" />
                        <Text className="ml-1 text-white font-semibold">BID</Text>
                      </Button>
                      <TouchableOpacity
                        onPress={() => setSelectedBid(null)}
                        className="px-2 py-1"
                      >
                        <Text className="text-neutral-400">✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Button
                      size="sm"
                      variant="gradient"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 flex-1"
                      onPress={() => setSelectedBid(job.id)}
                      disabled={!isVerified}
                    >
                      <Target size={14} color="#FFFFFF" />
                      <Text className="ml-1 text-white font-semibold">PLACE BID</Text>
                    </Button>
                  )}
                </View>
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