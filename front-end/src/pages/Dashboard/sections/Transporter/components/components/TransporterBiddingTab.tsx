import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Package,
  Target,
  Trophy,
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
  Weight,
  MapPin,
  Calendar,
  Navigation,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { Input } from '@shared/components/Input';
import { MetricCard } from '../../components/MetricCard';
import { BaseComponentProps } from '@shared/types';
import { MapDrawer } from '@pages/Dashboard/sections/Transporter/features/maps/components/MapDrawer';
import { MapOffer } from '@pages/Dashboard/sections/Transporter/features/maps/types';
import { useAuthStore } from '@stores/auth.store';
import transportService, {
  TransportBid,
  TransportDeliveryPoint,
  TransportPickupPoint,
  TransportRequest,
  TransporterPerformance,
} from '@services/transportService';

interface TransporterBiddingTabProps extends BaseComponentProps {
  id?: string;
}

const DEFAULT_COORDS = {
  lat: 42.6977,
  lng: 23.3219,
};

export const TransporterBiddingTab: React.FC<TransporterBiddingTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const user = useAuthStore((state) => state.user);
  const transporterId = user?.id;

  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isVerified] = useState(true); // Placeholder until verification flow is wired
  const [selectedOffer, setSelectedOffer] = useState<MapOffer | null>(null);
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [myBids, setMyBids] = useState<TransportBid[]>([]);
  const [performance, setPerformance] = useState<TransporterPerformance | null>(null);
  const [loading, setLoading] = useState(false);
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

  const resolvedTransporterId = id ?? transporterId;

  const fetchData = async (idParam?: string) => {
    try {
      setLoading(true);
      const [requests, bids] = await Promise.all([
        transportService.getAvailableRequests(),
        transportService.getMyBids(),
      ]);

      setTransportRequests(requests);
      setMyBids(bids);

      const effectiveId = idParam ?? resolvedTransporterId;
      if (effectiveId) {
        try {
          const stats = await transportService.getTransporterPerformance(effectiveId);
          setPerformance(stats);
        } catch (perfError) {
          console.warn('Failed to load transporter performance', perfError);
        }
      }
    } catch (error) {
      console.error('Error fetching transport data:', error);
      Alert.alert('Error', 'Failed to load transport requests');
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

  const handleSubmitBid = async (requestId: string) => {
    const amount = parseFloat(bidAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return;
    }

    try {
      await transportService.submitBid({
        transportRequestId: requestId,
        tradeOperationId:
          transportRequests.find((request) => request.id === requestId)?.tradeOperationId ?? '',
        bidAmount: amount,
        estimatedDuration: 24,
        vehicleType: 'FLATBED',
      });

      Alert.alert('Success', 'Bid submitted successfully');
      setBidAmount('');
      setSelectedBid(null);
      fetchData(transporterId);
    } catch (error) {
      console.error('Failed to submit bid:', error);
      Alert.alert('Error', 'Failed to submit bid');
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const hasBidOnRequest = (requestId: string) =>
    myBids.some((bid) => bid.transportRequestId === requestId && bid.status === 'PENDING');

  const toLocationLabel = (point?: TransportPickupPoint | TransportDeliveryPoint) =>
    point?.address?.split(',')[0] || (point as TransportPickupPoint)?.sellerName || 'Location';

  const handleViewRoute = (request: TransportRequest) => {
    const pickupPoint: TransportPickupPoint | undefined = request.pickupPoints?.[0];
    const deliveryPoint: TransportDeliveryPoint | undefined = request.deliveryPoint;

    const mapOffer: MapOffer = {
      id: request.id,
      quantity: request.totalWeight,
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
      deadline: new Date(request.biddingDeadline),
      status: 'pending',
      estimatedValue: request.maxBudget ?? 0,
      productType: request.tradeOperation?.buyListing?.product?.name || 'Agricultural Goods',
    };

    setSelectedOffer(mapOffer);
    setIsMapDrawerOpen(true);
  };

  const pendingBids = useMemo(() => myBids.filter((bid) => bid.status === 'PENDING'), [myBids]);

  const acceptedBids = useMemo(() => myBids.filter((bid) => bid.status === 'ACCEPTED'), [myBids]);

  const winRate = useMemo(() => {
    if (myBids.length === 0) return '0%';
    return `${Math.round((acceptedBids.length / myBids.length) * 100)}%`;
  }, [acceptedBids.length, myBids.length]);

  const averageBid = useMemo(() => {
    if (myBids.length === 0) return currencyFormatter.format(0);
    const total = myBids.reduce((sum, bid) => sum + (bid.bidAmount ?? 0), 0);
    return currencyFormatter.format(total / myBids.length);
  }, [currencyFormatter, myBids]);

  const completedJobs = performance?.completedJobs ?? 0;

  const handleSelectBid = (request: TransportRequest) => {
    setSelectedBid(request.id);
    if (request.lowestBid) {
      setBidAmount(Math.ceil(request.lowestBid + 50).toString());
    } else {
      setBidAmount('');
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#34D399" />
        <Text className="text-gray-400 mt-4">Loading transport requests...</Text>
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
          {/* Stats Grid */}
          <View className="flex-row flex-wrap -mx-1">
            <View className="w-1/2 px-1 mb-2">
              <MetricCard
                title="ACTIVE BIDS"
                value={pendingBids.length.toString()}
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
                value={winRate}
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
                value={averageBid}
                icon={DollarSign}
                gradient="from-yellow-500/10 to-yellow-600/5"
                borderColor="border-yellow-500/20"
                iconColor="#FCD34D"
                valueColor="text-yellow-400"
              />
            </View>
            <View className="w-1/2 px-1 mb-2">
              <MetricCard
                title="COMPLETED JOBS"
                value={completedJobs.toString()}
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
                    <Text className="text-sm text-neutral-300">
                      Complete verification to unlock premium bidding features
                    </Text>
                  </View>
                </View>
                <Button
                  onPress={() => Alert.alert('Verification', 'Verification flow coming soon.')}
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
              <Text className="text-lg font-semibold text-green-400 ml-2">
                LIVE TRANSPORT AUCTIONS
              </Text>
            </View>

            {transportRequests.length === 0 ? (
              <View className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
                <Package
                  size={48}
                  color="#6B7280"
                  style={{ alignSelf: 'center', marginBottom: 12 }}
                />
                <Text className="text-gray-400 text-center">No open requests right now</Text>
                <Text className="text-gray-500 text-center text-sm mt-2">
                  Pull to refresh or check back later for new opportunities
                </Text>
              </View>
            ) : (
              transportRequests.map((request) => {
                const productName =
                  request.tradeOperation?.buyListing?.product?.name || 'Agricultural Goods';
                const pickupPoint: TransportPickupPoint | undefined = request.pickupPoints?.[0];
                const deliveryPoint: TransportDeliveryPoint | undefined = request.deliveryPoint;
                const pickupLabel = toLocationLabel(pickupPoint);
                const deliveryLabel = toLocationLabel(deliveryPoint);
                const lowestBidDisplay = request.lowestBid
                  ? currencyFormatter.format(request.lowestBid)
                  : 'No bids yet';
                const pricePerKmDisplay =
                  request.lowestBid && request.estimatedDistance
                    ? `${currencyFormatter.format(
                        request.lowestBid / Math.max(request.estimatedDistance, 1)
                      )}/km`
                    : '--';
                const totalBids = request.bidsCount ?? 0;
                const hasBid = hasBidOnRequest(request.id);

                return (
                  <View
                    key={request.id}
                    className="border border-neutral-700 rounded-lg p-6 mb-3 mx-2"
                  >
                    {/* Header */}
                    <View className="mb-3">
                      <View className="flex-row items-start mb-3">
                        <View className="w-12 h-12 bg-gradient-to-br from-green-500/30 to-green-600/10 rounded-lg items-center justify-center border border-green-500/30">
                          <Text className="text-xl">{productName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="font-bold text-white mb-2">
                            {request.requestNumber || productName}
                          </Text>
                          <View className="flex-row items-center space-x-4">
                            <View className="flex-row items-center">
                              <Weight size={14} color="#9CA3AF" />
                              <Text className="text-gray-400 text-sm ml-1">
                                {request.totalWeight ? `${request.totalWeight} tons` : 'N/A'}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <MapPin size={14} color="#9CA3AF" />
                              <Text className="text-gray-400 text-sm ml-1">
                                {request.estimatedDistance
                                  ? `${Math.round(request.estimatedDistance)} km`
                                  : '—'}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <Calendar size={14} color="#9CA3AF" />
                              <Text className="text-gray-400 text-sm ml-1">
                                {getTimeRemaining(request.biddingDeadline)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View className="flex-row items-center mb-3" style={{ minHeight: 24 }}>
                        <Text className="text-base">🚚</Text>
                        <Text
                          className="text-white font-bold mx-1"
                          numberOfLines={1}
                          style={{ maxWidth: '35%' }}
                        >
                          {pickupLabel}
                        </Text>
                        <Text className="text-neutral-500 mx-1">→</Text>
                        <Text className="text-base">📦</Text>
                        <Text className="text-white font-bold mx-1 flex-1" numberOfLines={1}>
                          {deliveryLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Pricing */}
                    <View className="flex-row justify-between mb-3">
                      <View className="flex-1 mr-4">
                        <View className="flex-row items-center mb-2">
                          <Navigation size={16} color="#9CA3AF" />
                          <Text className="text-neutral-400 ml-2">
                            Max budget:{' '}
                            <Text className="text-gray-400 font-medium">
                              {request.maxBudget
                                ? currencyFormatter.format(request.maxBudget)
                                : '—'}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      <View className="bg-gradient-to-br from-green-500/10 to-transparent rounded-lg p-3 border border-green-500/20">
                        <Text className="text-xs text-green-400 font-medium">CURRENT BID</Text>
                        <Text className="text-2xl font-bold text-green-400">
                          {lowestBidDisplay}
                        </Text>
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">{totalBids} bids</Text>
                          <Text className="text-xs text-green-300 font-medium">
                            {pricePerKmDisplay}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Actions */}
                    <View className="space-y-2">
                      <View className="flex-row items-center justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 flex-1"
                          onPress={() => handleViewRoute(request)}
                        >
                          <MapPin size={14} color="#60A5FA" />
                          <Text className="text-blue-400 ml-1">View Route</Text>
                        </Button>
                      </View>

                      <View className="flex-row justify-center items-center">
                        {selectedBid === request.id ? (
                          <View className="flex-row items-center w-full">
                            <View className="relative mr-2 flex-1">
                              <DollarSign
                                size={14}
                                color="#9CA3AF"
                                style={{ position: 'absolute', left: 8, top: 10, zIndex: 10 }}
                              />
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
                              onPress={() => handleSubmitBid(request.id)}
                            >
                              <Zap size={14} color="#FFFFFF" />
                              <Text className="ml-1 text-white font-semibold">BID</Text>
                            </Button>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedBid(null);
                                setBidAmount('');
                              }}
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
                            onPress={() => handleSelectBid(request)}
                            disabled={!isVerified || hasBid}
                          >
                            <Target size={14} color="#FFFFFF" />
                            <Text className="ml-1 text-white font-semibold">PLACE BID</Text>
                          </Button>
                        )}
                      </View>

                      {hasBid && (
                        <Text className="text-xs text-blue-400 text-center">
                          You already have a pending bid for this request
                        </Text>
                      )}
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
