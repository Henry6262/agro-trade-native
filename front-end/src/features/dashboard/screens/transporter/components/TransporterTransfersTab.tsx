import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Truck,
  DollarSign,
  CheckCircle,
  Weight,
  MapPin,
  Route,
  Clock,
  User,
  Calendar,
  Navigation,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { MetricCard } from '../../components/MetricCard';
import { TransferStageIndicator } from '../../components/TransferStageIndicator';
import { MapDrawer } from '../maps/components/MapDrawer';
import { MapOffer } from '../maps/types';
import { BaseComponentProps } from '@shared/types';
import transportService, {
  TransportJob,
  TransportPickupPoint,
  TransportDeliveryPoint,
  TransporterPerformance,
} from '@services/transportService';
import { format } from 'date-fns';
import { useAuthStore } from '@stores/auth.store';

interface TransporterTransfersTabProps extends BaseComponentProps {
  id?: string;
}

const DEFAULT_COORDS = { lat: 42.6977, lng: 23.3219 };

const stageIndexFromStatus = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'ASSIGNED':
      return 0;
    case 'STARTED':
      return 1;
    case 'IN_TRANSIT':
      return 2;
    case 'COMPLETED':
      return 3;
    default:
      return 0;
  }
};

const stageDefinitions = [
  { name: 'Assigned', description: 'Job assigned & awaiting pickup', icon: User },
  { name: 'Started', description: 'Driver en route to pickup', icon: Truck },
  { name: 'In Transit', description: 'Cargo picked up, en route to delivery', icon: Route },
  { name: 'Completed', description: 'Delivery confirmed', icon: CheckCircle },
];

export const TransporterTransfersTab: React.FC<TransporterTransfersTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const transporterIdFromStore = useAuthStore((state) => state.user?.id);
  const resolvedTransporterId = id ?? transporterIdFromStore;
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [performance, setPerformance] = useState<TransporterPerformance | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<MapOffer | null>(null);
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const fetchData = async (effectiveId?: string) => {
    try {
      setLoading(true);
      const jobList = await transportService.getMyJobs();
      setJobs(jobList);

      const idToUse = effectiveId ?? resolvedTransporterId;
      if (idToUse) {
        try {
          const perf = await transportService.getTransporterPerformance(idToUse);
          setPerformance(perf);
        } catch (perfError) {
          console.warn('Failed to load transporter performance', perfError);
        }
      }
    } catch (error) {
      console.error('Failed to load transfer data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(resolvedTransporterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTransporterId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(resolvedTransporterId);
  };

  const activeJobs = useMemo(() => jobs.filter((job) => job.status !== 'COMPLETED'), [jobs]);

  const completedJobs = useMemo(() => jobs.filter((job) => job.status === 'COMPLETED'), [jobs]);

  const totalEarnings = useMemo(() => {
    const amounts = completedJobs
      .map((job) => job.transportRequest?.maxBudget)
      .filter((value): value is number => typeof value === 'number');
    if (!amounts.length) return '—';
    const sum = amounts.reduce((acc, value) => acc + value, 0);
    return currencyFormatter.format(sum);
  }, [completedJobs, currencyFormatter]);

  const toLocationLabel = (point?: TransportPickupPoint | TransportDeliveryPoint) =>
    point?.address?.split(',')[0] || (point as TransportPickupPoint)?.sellerName || 'Location';

  const handleViewRoute = (job: TransportJob) => {
    const pickupPoint = job.transportRequest?.pickupPoints?.[0];
    const deliveryPoint = job.transportRequest?.deliveryPoint;

    const mapOffer: MapOffer = {
      id: job.id,
      quantity: job.transportRequest?.totalWeight ?? 0,
      pickup: {
        coordinates: {
          latitude: pickupPoint?.lat ?? DEFAULT_COORDS.lat,
          longitude: pickupPoint?.lng ?? DEFAULT_COORDS.lng,
        },
        address: {
          street: pickupPoint?.address || 'Pickup Location',
          city: pickupPoint?.sellerName || '',
          state: '',
          country: '',
        },
        name: pickupPoint?.address || 'Pickup',
        type: 'pickup',
      },
      delivery: {
        coordinates: {
          latitude: deliveryPoint?.lat ?? DEFAULT_COORDS.lat,
          longitude: deliveryPoint?.lng ?? DEFAULT_COORDS.lng,
        },
        address: {
          city: deliveryPoint?.address || 'Delivery Location',
          state: '',
          country: '',
        },
        name: deliveryPoint?.address || 'Delivery',
        type: 'delivery',
      },
      deadline: job.estimatedArrival ? new Date(job.estimatedArrival) : new Date(),
      status: (job.status?.toLowerCase() ?? 'assigned') as any,
      estimatedValue: job.transportRequest?.maxBudget ?? 0,
      productType:
        job.transportRequest?.tradeOperation?.buyListing?.product?.name || 'Transport Job',
    };

    setSelectedOffer(mapOffer);
    setIsMapDrawerOpen(true);
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#34D399" />
        <Text className="text-gray-400 mt-4">Loading transfers...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-black"
        showsVerticalScrollIndicator={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4 space-y-4">
          {/* Stats */}
          <View className="flex-row flex-wrap -mx-1">
            <View className="w-1/2 px-1 mb-2">
              <MetricCard
                title="TOTAL EARNED"
                value={totalEarnings}
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
                value={activeJobs.length.toString()}
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
                value={completedJobs.length.toString()}
                icon={CheckCircle}
                gradient="from-purple-500/10 to-purple-600/5"
                borderColor="border-purple-500/20"
                iconColor="#A78BFA"
                valueColor="text-purple-400"
              />
            </View>
            <View className="w-1/2 px-1 mb-2">
              <MetricCard
                title="ON-TIME RATE"
                value={performance ? `${Math.round(performance.onTimeDeliveryRate ?? 0)}%` : '--'}
                icon={Clock}
                gradient="from-yellow-500/10 to-yellow-600/5"
                borderColor="border-yellow-500/20"
                iconColor="#FCD34D"
                valueColor="text-yellow-400"
              />
            </View>
          </View>

          {/* Transfers */}
          <View className="mt-4">
            <View className="flex-row items-center mb-3">
              <Truck size={20} color="#34D399" />
              <Text className="text-lg font-semibold text-green-400 ml-2">MY ACTIVE TRANSFERS</Text>
            </View>

            {jobs.length === 0 ? (
              <View className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
                <Truck
                  size={48}
                  color="#6B7280"
                  style={{ alignSelf: 'center', marginBottom: 12 }}
                />
                <Text className="text-gray-400 text-center">No transport jobs yet</Text>
                <Text className="text-gray-500 text-center text-sm mt-2">
                  Submit bids to secure your first transport assignment.
                </Text>
              </View>
            ) : (
              jobs.map((job) => {
                const pickupPoint = job.transportRequest?.pickupPoints?.[0];
                const deliveryPoint = job.transportRequest?.deliveryPoint;
                const pickupLabel = toLocationLabel(pickupPoint);
                const deliveryLabel = toLocationLabel(deliveryPoint);
                const product =
                  job.transportRequest?.tradeOperation?.buyListing?.product?.name ||
                  'Transport Job';
                const quantity = job.transportRequest?.totalWeight
                  ? `${job.transportRequest.totalWeight} tons`
                  : '—';
                const stageIndex = stageIndexFromStatus(job.status);

                return (
                  <View key={job.id} className="border border-neutral-700 rounded-lg p-4 mb-3">
                    <View className="flex-row justify-between items-start mb-4">
                      <View>
                        <Text className="text-lg font-semibold text-white">{product}</Text>
                        <View className="flex-row items-center mt-2">
                          <View className="flex-row items-center mr-4">
                            <Weight size={16} color="#9CA3AF" />
                            <Text className="text-neutral-400 ml-1">{quantity}</Text>
                          </View>
                          <View className="flex-row items-center mr-4">
                            <Route size={16} color="#9CA3AF" />
                            <Text className="text-neutral-400 ml-1">
                              {job.transportRequest?.estimatedDistance
                                ? `${Math.round(job.transportRequest.estimatedDistance)} km`
                                : '—'}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Text className="text-neutral-500">ETA:</Text>
                            <Text className="text-green-400 font-medium ml-1">
                              {job.estimatedArrival
                                ? format(new Date(job.estimatedArrival), 'MMM dd, HH:mm')
                                : 'TBD'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Badge className="bg-blue-500/20 border border-blue-500/40">
                        <Text className="text-xs text-blue-300">
                          {job.status?.replace('_', ' ') || 'ASSIGNED'}
                        </Text>
                      </Badge>
                    </View>

                    <View className="flex-row items-center mb-3">
                      <MapPin size={16} color="#60A5FA" />
                      <Text className="text-white font-semibold ml-2 flex-1" numberOfLines={1}>
                        {pickupLabel}
                      </Text>
                      <Text className="text-neutral-500 mx-2">→</Text>
                      <MapPin size={16} color="#FCD34D" />
                      <Text className="text-white font-semibold ml-2 flex-1" numberOfLines={1}>
                        {deliveryLabel}
                      </Text>
                    </View>

                    <TransferStageIndicator currentStage={stageIndex} stages={stageDefinitions} />

                    <View className="flex-row mt-4 space-x-2">
                      <TouchableOpacity className="flex-1" onPress={() => handleViewRoute(job)}>
                        <View className="border border-blue-500/40 rounded-lg py-2 items-center justify-center">
                          <Navigation size={16} color="#60A5FA" />
                          <Text className="text-blue-400 text-sm mt-1">VIEW ROUTE</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-1" disabled>
                        <View className="border border-neutral-700 rounded-lg py-2 items-center justify-center">
                          <Calendar size={16} color="#9CA3AF" />
                          <Text className="text-neutral-400 text-sm mt-1">SCHEDULE</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

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
