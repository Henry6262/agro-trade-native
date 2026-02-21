import React from 'react';
import { View, Text } from 'react-native';
import { MapPin, Weight, Calendar, Package, Truck, CheckCircle, Navigation } from 'lucide-react-native';
import { Badge } from '@shared/components/Badge';
import type { TransfersJobView } from '../types';
import { TransferStageIndicator } from '@features/dashboard/screens/components/TransferStageIndicator';
import { Button } from '@shared/components/Button';

interface TransferJobCardProps {
  job: TransfersJobView;
  onViewRoute: (job: TransfersJobView) => void;
}

export const TransferJobCard: React.FC<TransferJobCardProps> = ({ job, onViewRoute }) => (
  <View className="bg-gray-900/70 border border-gray-800 rounded-lg p-4 space-y-3">
    <View className="flex-row items-center justify-between">
      <View>
        <Text className="text-white font-semibold">Job #{job.jobNumber}</Text>
        <Text className="text-gray-400 text-sm">{job.productName}</Text>
      </View>
      <Badge className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{job.status}</Badge>
    </View>

    <TransferStageIndicator
      currentStage={job.stageIndex}
      stages={[
        { name: 'Assigned', description: 'Awaiting pickup', icon: Package },
        { name: 'Started', description: 'Driver en route', icon: Navigation },
        { name: 'In Transit', description: 'Picked up', icon: Truck },
        { name: 'Completed', description: 'Delivered', icon: CheckCircle },
      ]}
    />

    <View className="flex-row justify-between">
      <View className="flex-row items-center">
        <Weight size={14} color="#FBBF24" />
        <Text className="text-gray-300 text-sm ml-2">{job.totalWeightLabel}</Text>
      </View>
      <Text className="text-gray-300 text-sm">{job.budgetLabel}</Text>
    </View>

    <View className="space-y-2">
      <View className="flex-row items-center">
        <MapPin size={14} color="#60A5FA" />
        <Text className="text-gray-300 text-sm ml-2">{job.pickupLabel}</Text>
      </View>
      <View className="flex-row items-center">
        <MapPin size={14} color="#34D399" />
        <Text className="text-gray-300 text-sm ml-2">{job.deliveryLabel}</Text>
      </View>
    </View>

    {job.etaLabel && (
      <View className="flex-row items-center">
        <Calendar size={14} color="#9CA3AF" />
        <Text className="text-gray-400 text-sm ml-2">ETA: {job.etaLabel}</Text>
      </View>
    )}

    <Button variant="secondary" onPress={() => onViewRoute(job)}>
      View Route
    </Button>
  </View>
);
