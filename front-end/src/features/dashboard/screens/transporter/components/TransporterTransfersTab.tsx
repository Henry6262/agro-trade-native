import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import {
  Truck,
  DollarSign,
  CheckCircle,
  Star,
  Weight,
  MapPin,
  Route,
  Clock,
  Pause,
  Play,
  User,
  Calendar,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { MetricCard } from '../../components/MetricCard';
import { TransferStageIndicator } from '../../components/TransferStageIndicator';
import { BaseComponentProps } from '@shared/types';

interface TransporterTransfersTabProps extends BaseComponentProps {
  id?: string;
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

export const TransporterTransfersTab: React.FC<TransporterTransfersTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {

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


        {/* Active Transfers Section */}
        <View className="mt-4">
          <View className="flex-row items-center mb-3">
            <Truck size={20} color="#34D399" />
            <Text className="text-lg font-semibold text-green-400 ml-2">MY ACTIVE TRANSFERS</Text>
          </View>

          {mockTransfers.map((transfer) => (
            <View
              key={transfer.id}
              className="border border-neutral-700 rounded-lg p-4 mb-3"
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
                    <View className="flex-row items-center">
                      <Pause size={14} color="#9CA3AF" />
                      <Text className="ml-1 text-neutral-400">UPDATE STATUS</Text>
                    </View>
                  </Button>
                )}
                {transfer.status === "scheduled" && (
                  <Button
                    size="sm"
                    variant="gradient"
                    className="bg-gradient-to-r from-green-600 to-green-700 mr-2"
                    onPress={() => console.log('Start journey')}
                  >
                    <View className="flex-row items-center">
                      <Play size={14} color="#FFFFFF" />
                      <Text className="ml-1 text-white">START JOURNEY</Text>
                    </View>
                  </Button>
                )}
                {transfer.status === "arrived" && (
                  <Button
                    size="sm"
                    variant="gradient"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 mr-2"
                    onPress={() => console.log('Confirm pickup')}
                  >
                    <View className="flex-row items-center">
                      <CheckCircle size={14} color="#FFFFFF" />
                      <Text className="ml-1 text-white">CONFIRM PICKUP</Text>
                    </View>
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
  );
};