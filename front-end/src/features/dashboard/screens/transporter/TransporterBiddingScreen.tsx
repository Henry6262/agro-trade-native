import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
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
  ArrowLeft,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { Input } from '@shared/components/Input';
import { MetricCard } from '../components/MetricCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DashboardStackParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<DashboardStackParamList, 'TransporterBidding'>;

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
  tags: string[];
}

export default function TransporterBiddingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleVerifyToBid = () => {
    setIsVerified(true);
    setTimeout(() => {
      console.log('Verification complete! You can now place bids.');
    }, 1500);
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
      tags: ["Non-GMO", "Premium Grade"],
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
      tags: ["Organic", "Grade A"],
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
      tags: ["Export Quality", "Premium"],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-neutral-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-white">Transport Bidding</Text>
          <Text className="text-sm text-neutral-400">Place bids on available transport jobs</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
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

          {/* Section Title */}
          <View className="flex-row items-center mt-4">
            <Package size={20} color="#34D399" />
            <Text className="text-lg font-semibold text-green-400 ml-2">LIVE TRANSPORT AUCTIONS</Text>
          </View>

          {/* Job Listings */}
          {mockJobs.map((job) => (
            <View
              key={job.id}
              className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4"
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-green-600/10 rounded-lg items-center justify-center border border-green-500/30">
                    <Package size={20} color="#34D399" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-white">{job.product}</Text>
                    <View className="flex-row flex-wrap mt-1">
                      {job.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="mr-1 mb-1 text-xs border-neutral-600"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Badge
                    variant={job.priority === "urgent" ? "destructive" : job.priority === "high" ? "default" : "secondary"}
                    className="mr-2"
                  >
                    {job.priority === "urgent" && <AlertTriangle size={12} color="#FFFFFF" />}
                    <Text className="text-xs ml-1">{job.priority.toUpperCase()}</Text>
                  </Badge>
                  <Badge variant="outline" className="border-neutral-600">
                    <Timer size={12} color="#9CA3AF" />
                    <Text className="text-xs ml-1 text-neutral-400">{job.timeLeft}</Text>
                  </Badge>
                </View>
              </View>

              {/* Route */}
              <View className="flex-row items-center mb-3">
                <Text className="text-base">{job.fromFlag}</Text>
                <Text className="text-neutral-300 mx-2" numberOfLines={1} ellipsizeMode="tail">{job.from}</Text>
                <Text className="text-neutral-500">→</Text>
                <Text className="text-base mx-2">{job.toFlag}</Text>
                <Text className="text-neutral-300" numberOfLines={1} ellipsizeMode="tail">{job.to}</Text>
              </View>

              {/* Details */}
              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center mr-4">
                  <Weight size={16} color="#60A5FA" />
                  <Text className="text-neutral-300 ml-1">{job.quantity}</Text>
                </View>
                <View className="flex-row items-center mr-4">
                  <MapPin size={16} color="#34D399" />
                  <Text className="text-neutral-300 ml-1">{job.distance}</Text>
                </View>
                <View className="flex-row items-center">
                  <Calendar size={16} color="#FCD34D" />
                  <Text className="text-neutral-300 ml-1">{job.deadline}</Text>
                </View>
              </View>

              {/* Distance & Fuel */}
              <View className="flex-row justify-between mb-3">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-2">
                    <Navigation size={16} color="#60A5FA" />
                    <Text className="text-neutral-400 ml-2">Distance from you:</Text>
                    <Text className="font-semibold text-blue-400 ml-2">{job.userDistance}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Fuel size={16} color="#EF4444" />
                    <Text className="text-neutral-400 ml-2">Est. Fuel:</Text>
                    <Text className="font-semibold text-red-400 ml-2">{job.fuelCost}</Text>
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

              {/* Bid Actions */}
              <View className="flex-row justify-end items-center">
                {selectedBid === job.id ? (
                  <View className="flex-row items-center">
                    <View className="relative mr-2">
                      <DollarSign size={14} color="#9CA3AF" style={{ position: 'absolute', left: 8, top: 10, zIndex: 10 }} />
                      <Input
                        placeholder="2800"
                        value={bidAmount}
                        onChangeText={setBidAmount}
                        keyboardType="numeric"
                        className="w-20 h-8 pl-6 bg-neutral-700 border-neutral-600 text-white text-sm"
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
                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                    onPress={() => setSelectedBid(job.id)}
                    disabled={!isVerified}
                  >
                    <Target size={14} color="#FFFFFF" />
                    <Text className="ml-1 text-white font-semibold">PLACE BID</Text>
                  </Button>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}