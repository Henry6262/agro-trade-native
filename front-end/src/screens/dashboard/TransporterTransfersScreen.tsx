import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import {
  Package,
  Truck,
  DollarSign,
  CheckCircle,
  Star,
  Timer,
  AlertTriangle,
  Weight,
  MapPin,
  Calendar,
  Navigation,
  Route,
  Clock,
  Pause,
  Play,
  ArrowLeft,
  User,
} from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { MetricCard } from './components/MetricCard';
import { TransferStageIndicator } from './components/TransferStageIndicator';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { DashboardStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<DashboardStackParamList, 'TransporterTransfers'>;

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

interface ActiveTransfer {
  id: string;
  product: string;
  quantity: string;
  from: string;
  to: string;
  status: 'scheduled' | 'traveling' | 'arrived';
  currentStage: number;
  earnings: string;
  eta: string;
  distance: string;
}

export default function TransporterTransfersScreen() {
  const navigation = useNavigation<NavigationProp>();

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
  ];

  const mockTransfers: ActiveTransfer[] = [
    {
      id: "TR001",
      product: "Wheat",
      quantity: "25 tons",
      from: "Iowa Farm Co.",
      to: "Chicago Terminal",
      status: "traveling",
      currentStage: 2,
      earnings: "$3,200",
      eta: "4h 30m",
      distance: "180 miles",
    },
    {
      id: "TR002",
      product: "Corn",
      quantity: "40 tons",
      from: "Nebraska Harvest",
      to: "Kansas Processing",
      status: "scheduled",
      currentStage: 0,
      earnings: "$4,800",
      eta: "Tomorrow 8:00 AM",
      distance: "220 miles",
    },
    {
      id: "TR003",
      product: "Soybeans",
      quantity: "15 tons",
      from: "Illinois Organic",
      to: "Milwaukee Port",
      status: "arrived",
      currentStage: 3,
      earnings: "$2,400",
      eta: "Ready for pickup",
      distance: "150 miles",
    },
  ];

  const getTransferStages = () => [
    { name: "Assign Driver", description: "Assign driver to truck", icon: User },
    { name: "Traveling", description: "En route to pickup", icon: Truck },
    { name: "Arrived", description: "At pickup location", icon: MapPin },
    { name: "Completed", description: "Delivery completed", icon: CheckCircle },
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
          <Text className="text-xl font-bold text-white">My Transfers</Text>
          <Text className="text-sm text-neutral-400">Manage active transfers and offers</Text>
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
                title="TOTAL EARNED"
                value="$47k"
                icon={DollarSign}
                gradient="from-green-500/10 to-green-600/5"
                borderColor="border-green-500/20"
                iconColor="#34D399"
                valueColor="text-green-400"
              />
            </View>
            <View className="w-1/2 px-1 mb-2">
              <MetricCard
                title="ACTIVE"
                value="3"
                icon={Truck}
                gradient="from-blue-500/10 to-blue-600/5"
                borderColor="border-blue-500/20"
                iconColor="#60A5FA"
                valueColor="text-blue-400"
              />
            </View>
            <View className="w-1/2 px-1 mb-2">
              <MetricCard
                title="COMPLETED"
                value="28"
                icon={CheckCircle}
                gradient="from-purple-500/10 to-purple-600/5"
                borderColor="border-purple-500/20"
                iconColor="#A78BFA"
                valueColor="text-purple-400"
              />
            </View>
            <View className="w-1/2 px-1 mb-2">
              <MetricCard
                title="RATING"
                value="4.8"
                icon={Star}
                gradient="from-yellow-500/10 to-yellow-600/5"
                borderColor="border-yellow-500/20"
                iconColor="#FCD34D"
                valueColor="text-yellow-400"
              />
            </View>
          </View>

          {/* Incoming Offers Section */}
          <View className="mt-4">
            <View className="flex-row items-center mb-3">
              <Package size={20} color="#FCD34D" />
              <Text className="text-lg font-semibold text-yellow-400 ml-2">INCOMING OFFERS</Text>
            </View>

            {mockOffers.map((offer) => (
              <View
                key={offer.id}
                className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-lg p-4 mb-3"
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-gradient-to-br from-yellow-500/30 to-yellow-600/10 rounded-lg items-center justify-center border border-yellow-500/30">
                      <Package size={20} color="#FCD34D" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-white">{offer.product}</Text>
                      <View className="flex-row flex-wrap mt-1">
                        {offer.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-1 mb-1 text-xs border-yellow-500/50"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Badge variant={offer.priority === "high" ? "destructive" : "secondary"} className="mr-2">
                      {offer.priority === "high" && <AlertTriangle size={12} color="#FFFFFF" />}
                      <Text className="text-xs ml-1">DIRECT OFFER</Text>
                    </Badge>
                    <Badge variant="outline" className="border-yellow-500/50">
                      <Timer size={12} color="#FCD34D" />
                      <Text className="text-xs ml-1 text-yellow-400">{offer.timeToRespond}</Text>
                    </Badge>
                  </View>
                </View>

                {/* Admin Note */}
                <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                  <Text className="text-sm text-yellow-300 italic">"{offer.adminNote}"</Text>
                </View>

                {/* Route */}
                <View className="flex-row items-center mb-3">
                  <Text className="text-base">{offer.fromFlag}</Text>
                  <Text className="text-neutral-300 mx-2" numberOfLines={1} ellipsizeMode="tail">{offer.from}</Text>
                  <Text className="text-neutral-500">→</Text>
                  <Text className="text-base mx-2">{offer.toFlag}</Text>
                  <Text className="text-neutral-300" numberOfLines={1} ellipsizeMode="tail">{offer.to}</Text>
                </View>

                {/* Details */}
                <View className="flex-row items-center mb-4">
                  <View className="flex-row items-center mr-4">
                    <Weight size={16} color="#60A5FA" />
                    <Text className="text-neutral-300 ml-1">{offer.quantity}</Text>
                  </View>
                  <View className="flex-row items-center mr-4">
                    <MapPin size={16} color="#34D399" />
                    <Text className="text-neutral-300 ml-1">{offer.distance}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Calendar size={16} color="#FCD34D" />
                    <Text className="text-neutral-300 ml-1">{offer.deadline}</Text>
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

                {/* Distance Info & Actions */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Navigation size={16} color="#60A5FA" />
                    <Text className="text-sm text-neutral-400 ml-2">
                      Distance from you: <Text className="text-blue-400 font-medium">{offer.userDistance}</Text>
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 mr-2"
                      onPress={() => console.log('Decline')}
                    >
                      <Text className="text-red-400">DECLINE</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-500/50 mr-2"
                      onPress={() => console.log('Counter')}
                    >
                      <Text className="text-yellow-400">COUNTER</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="gradient"
                      className="bg-gradient-to-r from-green-600 to-green-700"
                      onPress={() => console.log('Accept')}
                    >
                      <CheckCircle size={14} color="#FFFFFF" />
                      <Text className="ml-1 text-white">ACCEPT</Text>
                    </Button>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Active Transfers Section */}
          <View className="mt-4">
            <View className="flex-row items-center mb-3">
              <Truck size={20} color="#34D399" />
              <Text className="text-lg font-semibold text-green-400 ml-2">MY ACTIVE TRANSFERS</Text>
            </View>

            {mockTransfers.map((transfer) => (
              <View
                key={transfer.id}
                className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 mb-3"
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-lg font-semibold text-white">{transfer.product}</Text>
                    <View className="flex-row items-center mt-2">
                      <View className="flex-row items-center mr-4">
                        <Weight size={16} color="#9CA3AF" />
                        <Text className="text-neutral-400 ml-1">{transfer.quantity}</Text>
                      </View>
                      <View className="flex-row items-center mr-4">
                        <Route size={16} color="#9CA3AF" />
                        <Text className="text-neutral-400 ml-1">{transfer.distance}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-neutral-500">Earnings:</Text>
                        <Text className="text-green-400 font-medium ml-1">{transfer.earnings}</Text>
                      </View>
                    </View>
                  </View>
                  <Badge
                    className={`${
                      transfer.status === "traveling"
                        ? "bg-purple-500"
                        : transfer.status === "arrived"
                        ? "bg-indigo-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {transfer.status === "traveling" && <Truck size={12} color="#FFFFFF" />}
                    {transfer.status === "arrived" && <MapPin size={12} color="#FFFFFF" />}
                    {transfer.status === "scheduled" && <Calendar size={12} color="#FFFFFF" />}
                    <Text className="text-xs text-white ml-1">{transfer.status.toUpperCase()}</Text>
                  </Badge>
                </View>

                {/* Transfer Stage Indicator */}
                <TransferStageIndicator
                  currentStage={transfer.currentStage}
                  stages={getTransferStages()}
                />

                {/* Transfer Details */}
                <View className="flex-row mt-4">
                  <View className="flex-1">
                    <Text className="text-sm text-neutral-400">From:</Text>
                    <Text className="text-white font-medium">{transfer.from}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-neutral-400">To:</Text>
                    <Text className="text-white font-medium">{transfer.to}</Text>
                    <View className="flex-row items-center mt-1">
                      <Clock size={12} color="#9CA3AF" />
                      <Text className="text-neutral-400 ml-1 text-sm">ETA: {transfer.eta}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center justify-center mt-4">
                  {transfer.status === "traveling" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-neutral-600 mr-2"
                      onPress={() => console.log('Update status')}
                    >
                      <Pause size={14} color="#9CA3AF" />
                      <Text className="ml-1 text-neutral-400">UPDATE STATUS</Text>
                    </Button>
                  )}
                  {transfer.status === "scheduled" && (
                    <Button
                      size="sm"
                      variant="gradient"
                      className="bg-gradient-to-r from-green-600 to-green-700 mr-2"
                      onPress={() => console.log('Start journey')}
                    >
                      <Play size={14} color="#FFFFFF" />
                      <Text className="ml-1 text-white">START JOURNEY</Text>
                    </Button>
                  )}
                  {transfer.status === "arrived" && (
                    <Button
                      size="sm"
                      variant="gradient"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 mr-2"
                      onPress={() => console.log('Confirm pickup')}
                    >
                      <CheckCircle size={14} color="#FFFFFF" />
                      <Text className="ml-1 text-white">CONFIRM PICKUP</Text>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => console.log('View details')}
                  >
                    <Text className="text-neutral-400">VIEW DETAILS</Text>
                  </Button>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}