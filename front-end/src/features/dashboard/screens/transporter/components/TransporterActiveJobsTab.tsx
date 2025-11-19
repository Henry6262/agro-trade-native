import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Navigation,
  Camera,
  AlertCircle,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { MetricCard } from '../../components/MetricCard';
import { BaseComponentProps } from '@shared/types';
import transportService, { TransportJob } from '@services/transportService';
import { format } from 'date-fns';

interface TransporterActiveJobsTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterActiveJobsTab: React.FC<TransporterActiveJobsTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const [activeJobs, setActiveJobs] = useState<TransportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingJob, setUpdatingJob] = useState<string | null>(null);

  useEffect(() => {
    loadActiveJobs();
  }, []);

  const loadActiveJobs = async () => {
    try {
      setLoading(true);
      const jobs = await transportService.getMyJobs();
      setActiveJobs(jobs);
    } catch (error) {
      console.error('Failed to load active jobs:', error);
      Alert.alert('Error', 'Failed to load active jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActiveJobs();
    setRefreshing(false);
  };

  const handleStartJob = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      await transportService.startJob(jobId, {
        actualPickupTime: new Date().toISOString(),
      });
      Alert.alert('Success', 'Transport job started');
      await loadActiveJobs();
    } catch (error) {
      console.error('Failed to start job:', error);
      Alert.alert('Error', 'Failed to start job');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleCompletePickup = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      // In production, you'd show a modal to collect pickup details
      const pickupData = {
        pickupNotes: 'Pickup completed successfully',
        actualWeight: 100,
        pickupPhotos: [],
      };

      await transportService.completePickup(jobId, pickupData);
      Alert.alert('Success', 'Pickup completed');
      await loadActiveJobs();
    } catch (error) {
      console.error('Failed to complete pickup:', error);
      Alert.alert('Error', 'Failed to complete pickup');
    } finally {
      setUpdatingJob(null);
    }
  };

  const handleCompleteDelivery = async (jobId: string) => {
    try {
      setUpdatingJob(jobId);
      // In production, you'd show a modal to collect delivery details
      const deliveryData = {
        deliveryNotes: 'Delivery completed successfully',
        deliveryPhotos: [],
        recipientSignature: 'Signed digitally',
      };

      await transportService.completeDelivery(jobId, deliveryData);
      Alert.alert('Success', 'Delivery completed');
      await loadActiveJobs();
    } catch (error) {
      console.error('Failed to complete delivery:', error);
      Alert.alert('Error', 'Failed to complete delivery');
    } finally {
      setUpdatingJob(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ASSIGNED':
        return 'text-blue-400';
      case 'IN_TRANSIT':
        return 'text-yellow-400';
      case 'DELIVERING':
        return 'text-orange-400';
      case 'COMPLETED':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const activeCount = activeJobs.filter((j) => j.status !== 'COMPLETED').length;
  const inTransitCount = activeJobs.filter((j) => j.status === 'IN_TRANSIT').length;
  const completedToday = activeJobs.filter(
    (j) =>
      j.status === 'COMPLETED' &&
      new Date(j.estimatedArrival || '').toDateString() === new Date().toDateString()
  ).length;

  return (
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <View className="p-4 space-y-4">
        {/* Refresh Button */}
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          className="flex-row items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-4"
        >
          <Navigation size={18} color={refreshing ? '#6B7280' : '#60A5FA'} />
          <Text className={`ml-2 ${refreshing ? 'text-gray-500' : 'text-blue-400'}`}>
            {refreshing ? 'Refreshing...' : 'Refresh Jobs'}
          </Text>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-1">
          <View className="w-1/3 px-1 mb-2">
            <MetricCard
              title="ACTIVE"
              value={activeCount.toString()}
              icon={Truck}
              gradient="from-blue-500/10 to-blue-600/5"
              borderColor="border-blue-500/20"
              iconColor="#60A5FA"
              valueColor="text-blue-400"
            />
          </View>
          <View className="w-1/3 px-1 mb-2">
            <MetricCard
              title="IN TRANSIT"
              value={inTransitCount.toString()}
              icon={Navigation}
              gradient="from-yellow-500/10 to-yellow-600/5"
              borderColor="border-yellow-500/20"
              iconColor="#FCD34D"
              valueColor="text-yellow-400"
            />
          </View>
          <View className="w-1/3 px-1 mb-2">
            <MetricCard
              title="TODAY"
              value={completedToday.toString()}
              icon={CheckCircle}
              gradient="from-green-500/10 to-green-600/5"
              borderColor="border-green-500/20"
              iconColor="#34D399"
              valueColor="text-green-400"
            />
          </View>
        </View>

        {/* Active Jobs Section */}
        <View className="mt-4">
          <View className="flex-row items-center mb-3">
            <Truck size={20} color="#60A5FA" />
            <Text className="text-lg font-semibold text-blue-400 ml-2">ACTIVE TRANSPORT JOBS</Text>
          </View>

          {loading ? (
            <View className="p-8">
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text className="text-gray-400 text-center mt-4">Loading active jobs...</Text>
            </View>
          ) : activeJobs.length === 0 ? (
            <View className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
              <Package
                size={48}
                color="#6B7280"
                style={{ alignSelf: 'center', marginBottom: 12 }}
              />
              <Text className="text-gray-400 text-center">No active transport jobs</Text>
              <Text className="text-gray-500 text-center text-sm mt-2">
                Submit bids to get transport jobs
              </Text>
            </View>
          ) : (
            activeJobs.map((job) => {
              const statusColor = getStatusColor(job.status);
              const pickupsCompleted = job.pickupsCompleted ?? [];
              const pickupPointsTotal = job.transportRequest?.pickupPoints?.length ?? 1;
              const totalWeight = job.transportRequest?.totalWeight ?? 'N/A';

              return (
                <View
                  key={job.id}
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/5 border border-blue-500/30 rounded-lg p-6 mb-3 mx-2"
                >
                  {/* Header - Job Info */}
                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-white font-bold">Job #{job.jobNumber}</Text>
                      <Badge text={job.status} className={`${statusColor} bg-gray-800/50`} />
                    </View>

                    {/* Job Details */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <Package size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 ml-1">{totalWeight} tons</Text>
                      </View>
                      {job.estimatedArrival && (
                        <View className="flex-row items-center">
                          <Clock size={16} color="#9CA3AF" />
                          <Text className="text-gray-400 ml-1">
                            ETA: {format(new Date(job.estimatedArrival), 'MMM dd, HH:mm')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Progress Info */}
                  <View className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-400 text-sm">Pickups Completed</Text>
                      <Text className="text-white font-semibold">
                        {pickupsCompleted.length} / {pickupPointsTotal}
                      </Text>
                    </View>
                    {job.currentLocation && (
                      <View className="flex-row items-center">
                        <MapPin size={14} color="#60A5FA" />
                        <Text className="text-blue-400 text-sm ml-1">
                          {job.currentLocation.address || 'Location updating...'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons based on status */}
                  <View className="flex-row items-center justify-between">
                    {job.status === 'ASSIGNED' && (
                      <Button
                        size="sm"
                        variant="gradient"
                        className="bg-gradient-to-r from-green-600 to-green-700 flex-1"
                        onPress={() => handleStartJob(job.id)}
                        disabled={updatingJob === job.id}
                      >
                        {updatingJob === job.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Truck size={14} color="#FFFFFF" />
                            <Text className="ml-1 text-white">START JOB</Text>
                          </>
                        )}
                      </Button>
                    )}

                    {job.status === 'IN_TRANSIT' && !job.allPickupsComplete && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/50 flex-1"
                        onPress={() => handleCompletePickup(job.id)}
                        disabled={updatingJob === job.id}
                      >
                        {updatingJob === job.id ? (
                          <ActivityIndicator size="small" color="#FCD34D" />
                        ) : (
                          <>
                            <Camera size={14} color="#FCD34D" />
                            <Text className="text-yellow-400 ml-1">COMPLETE PICKUP</Text>
                          </>
                        )}
                      </Button>
                    )}

                    {job.status === 'IN_TRANSIT' && job.allPickupsComplete && (
                      <Button
                        size="sm"
                        variant="gradient"
                        className="bg-gradient-to-r from-green-600 to-green-700 flex-1"
                        onPress={() => handleCompleteDelivery(job.id)}
                        disabled={updatingJob === job.id}
                      >
                        {updatingJob === job.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <CheckCircle size={14} color="#FFFFFF" />
                            <Text className="ml-1 text-white">COMPLETE DELIVERY</Text>
                          </>
                        )}
                      </Button>
                    )}

                    {job.status === 'COMPLETED' && (
                      <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg py-2">
                        <Text className="text-green-400 text-center text-sm">Job Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
};
