import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Truck, Package, Clock, MapPin, Camera, CheckCircle } from 'lucide-react-native';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';
import type { TransporterJobCardProps } from '../types';

export const TransporterJobCard: React.FC<TransporterJobCardProps> = ({
  job,
  actionJobId,
  onStartJob,
  onCompletePickup,
  onCompleteDelivery,
}) => {
  const isUpdating = actionJobId === job.id;

  return (
    <View className="bg-gradient-to-r from-blue-500/10 to-purple-500/5 border border-blue-500/30 rounded-lg p-6 mb-3 mx-2">
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white font-bold">Job #{job.jobNumber}</Text>
          <Badge className={`${job.statusColorClass} bg-gray-800/50`}>{job.status}</Badge>
        </View>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Package size={16} color="#9CA3AF" />
            <Text className="text-gray-400 ml-1">{job.totalWeightLabel}</Text>
          </View>
          {job.etaLabel && (
            <View className="flex-row items-center">
              <Clock size={16} color="#9CA3AF" />
              <Text className="text-gray-400 ml-1">{job.etaLabel}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-400 text-sm">Pickups Completed</Text>
          <Text className="text-white font-semibold">
            {job.pickupsCompleted} / {job.pickupPointsTotal}
          </Text>
        </View>
        {job.hasLocation && (
          <View className="flex-row items-center">
            <MapPin size={14} color="#60A5FA" />
            <Text className="text-blue-400 text-sm ml-1">{job.currentLocationLabel}</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between gap-x-2">
        {job.canStart && (
          <Button
            size="sm"
            variant="gradient"
            className="bg-gradient-to-r from-green-600 to-green-700 flex-1"
            onPress={() => onStartJob(job.id)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Truck size={14} color="#FFFFFF" />
                <Text className="ml-1 text-white">START JOB</Text>
              </>
            )}
          </Button>
        )}

        {job.canCompletePickup && (
          <Button
            size="sm"
            variant="outline"
            className="border-yellow-500/50 flex-1"
            onPress={() => onCompletePickup(job.id)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FCD34D" />
            ) : (
              <>
                <Camera size={14} color="#FCD34D" />
                <Text className="text-yellow-400 ml-1">COMPLETE PICKUP</Text>
              </>
            )}
          </Button>
        )}

        {job.canCompleteDelivery && (
          <Button
            size="sm"
            variant="gradient"
            className="bg-gradient-to-r from-green-600 to-green-700 flex-1"
            onPress={() => onCompleteDelivery(job.id)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle size={14} color="#FFFFFF" />
                <Text className="ml-1 text-white">COMPLETE DELIVERY</Text>
              </>
            )}
          </Button>
        )}

        {job.isCompleted && (
          <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg py-2">
            <Text className="text-green-400 text-center text-sm">Job Completed</Text>
          </View>
        )}
      </View>
    </View>
  );
};
