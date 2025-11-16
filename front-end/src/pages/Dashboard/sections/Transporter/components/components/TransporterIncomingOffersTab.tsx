import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
  RefreshCw,
  Truck,
} from 'lucide-react-native';
import { Button } from '@shared/components/Button';
import { Badge } from '@shared/components/Badge';
import { MetricCard } from '../../components/MetricCard';
import { BaseComponentProps } from '@shared/types';
import { MapDrawer } from '../maps/components/MapDrawer';
import { MapOffer } from '../maps/types';
import transportService, {
  TransportRequest,
  TransportBid,
  TransportPickupPoint,
  TransportDeliveryPoint,
} from '@services/transportService';
import { format } from 'date-fns';

interface TransporterIncomingOffersTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterIncomingOffersTab: React.FC<TransporterIncomingOffersTabProps> = ({
  id,
  testID,
  accessibilityLabel,
}) => {
  const [selectedOffer, setSelectedOffer] = useState<MapOffer | null>(null);
  const [isMapDrawerOpen, setIsMapDrawerOpen] = useState(false);
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [myBids, setMyBids] = useState<TransportBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingBid, setSubmittingBid] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    [],
  );

  // Fetch transport requests on mount
  useEffect(() => {
    loadTransportRequests();
  }, []);

  const loadTransportRequests = async () => {
    try {
      setLoading(true);
      const [requests, bids] = await Promise.all([
        transportService.getAvailableRequests(),
        transportService.getMyBids(),
      ]);
      setTransportRequests(requests);
      setMyBids(bids);
    } catch (error) {
      console.error('Failed to load transport requests:', error);
      Alert.alert('Error', 'Failed to load transport requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransportRequests();
    setRefreshing(false);
  };

  const handleSubmitBid = async (requestId: string) => {
    try {
      setSubmittingBid(requestId);
      
      // For now, submit a basic bid - in production, you'd show a modal for bid details
      const bidData = {
        transportRequestId: requestId,
        bidAmount: 3500, // Mock amount - would come from user input
        estimatedDuration: 24, // hours
        vehicleType: 'FLATBED',
        vehicleCapacity: 40, // tons
      };

      await transportService.submitBid(bidData);
      Alert.alert('Success', 'Your bid has been submitted successfully');
      await loadTransportRequests();
    } catch (error) {
      console.error('Failed to submit bid:', error);
      Alert.alert('Error', 'Failed to submit bid');
    } finally {
      setSubmittingBid(null);
    }
  };

  const handleViewRoute = (request: TransportRequest) => {
    const pickupPoint: TransportPickupPoint | undefined = request.pickupPoints?.[0];
    const deliveryPoint: TransportDeliveryPoint | undefined = request.deliveryPoint;

    const mapOffer: MapOffer = {
      id: request.id,
      quantity: request.totalWeight,
      pickup: {
        coordinates: {
          latitude: pickupPoint?.lat ?? 42.6977,
          longitude: pickupPoint?.lng ?? 23.3219,
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
          latitude: deliveryPoint?.lat ?? 42.1354,
          longitude: deliveryPoint?.lng ?? 24.7453,
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
      estimatedValue: request.maxBudget || 5000,
      productType:
        request.tradeOperation?.buyListing?.product?.name || 'Agricultural Goods',
    };

    setSelectedOffer(mapOffer);
    setIsMapDrawerOpen(true);
  };

  const getUrgencyColor = (urgency: string | undefined) => {
    switch ((urgency || '').toUpperCase()) {
      case 'HIGH':
        return 'text-red-400';
      case 'STANDARD':
        return 'text-yellow-400';
      case 'LOW':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const hasBidOnRequest = (requestId: string) => {
    return myBids.some(bid => bid.transportRequestId === requestId);
  };

  // Filter out requests we've already bid on if needed
  const availableRequests = transportRequests.filter(
    (r) => r.status?.toUpperCase() === 'OPEN',
  );

  return (
    <>
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
          <RefreshCw size={18} color={refreshing ? "#6B7280" : "#60A5FA"} />
          <Text className={`ml-2 ${refreshing ? 'text-gray-500' : 'text-blue-400'}`}>
            {refreshing ? 'Refreshing...' : 'Refresh Requests'}
          </Text>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-1">
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="AVAILABLE"
              value={availableRequests.length.toString()}
              icon={Package}
              gradient="from-yellow-500/10 to-yellow-600/5"
              borderColor="border-yellow-500/20"
              iconColor="#FCD34D"
              valueColor="text-yellow-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="MY BIDS"
              value={myBids.length.toString()}
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
              value={availableRequests
                .filter((r) => r.urgencyLevel?.toUpperCase() === 'HIGH')
                .length.toString()}
              icon={AlertTriangle}
              gradient="from-red-500/10 to-red-600/5"
              borderColor="border-red-500/20"
              iconColor="#EF4444"
              valueColor="text-red-400"
            />
          </View>
          <View className="w-1/2 px-1 mb-2">
            <MetricCard
              title="STANDARD"
              value={availableRequests
                .filter((r) => r.urgencyLevel?.toUpperCase() === 'STANDARD')
                .length.toString()}
              icon={Truck}
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
            <Text className="text-lg font-semibold text-yellow-400 ml-2">TRANSPORT REQUESTS</Text>
          </View>

          {loading ? (
            <View className="p-8">
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text className="text-gray-400 text-center mt-4">Loading transport requests...</Text>
            </View>
          ) : availableRequests.length === 0 ? (
            <View className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
              <Truck size={48} color="#6B7280" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text className="text-gray-400 text-center">No transport requests available</Text>
              <Text className="text-gray-500 text-center text-sm mt-2">Check back later for new opportunities</Text>
            </View>
          ) : (
            availableRequests.map((request) => {
              const alreadyBid = hasBidOnRequest(request.id);
              const urgencyColor = getUrgencyColor(request.urgencyLevel);
              const lowestBidDisplay = request.lowestBid
                ? currencyFormatter.format(request.lowestBid)
                : 'None';
              const pricePerKmDisplay =
                request.lowestBid && request.estimatedDistance
                  ? `${currencyFormatter.format(
                      request.lowestBid / Math.max(request.estimatedDistance, 1),
                    )}/km`
                  : '--';
              
              return (
                <View
                  key={request.id}
                  className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-lg p-6 mb-3 mx-2"
                >
                  {/* Header - Request Info */}
                  <View className="mb-3">
                    {/* Request Number and Status */}
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-white font-bold">Request #{request.requestNumber}</Text>
                      <Badge 
                        text={request.urgencyLevel} 
                        className={`${urgencyColor} bg-gray-800/50`}
                      />
                    </View>

                    {/* Key Metrics Row */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <Weight size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 font-semibold ml-1">{request.totalWeight} tons</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MapPin size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 font-semibold ml-1">
                          {request.pickupPoints?.length || 1} pickup(s)
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Calendar size={16} color="#9CA3AF" />
                        <Text className="text-gray-400 font-semibold ml-1">
                          {request.biddingDeadline
                            ? format(new Date(request.biddingDeadline), 'MMM dd')
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Financial Info */}
                    <View className="flex-row mb-4">
                      <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-3 mr-2">
                        <Text className="text-xs text-green-400 mb-1">MAX BUDGET</Text>
                        <Text className="text-lg font-bold text-green-400">
                          {request.maxBudget
                            ? currencyFormatter.format(request.maxBudget)
                            : 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mr-2">
                      <Text className="text-xs text-blue-400 mb-1">BIDS</Text>
                      <Text className="text-lg font-bold text-blue-400">
                        {request.bidsCount || 0}
                      </Text>
                    </View>
                      <View className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <Text className="text-xs text-yellow-400 mb-1">LOWEST BID</Text>
                        <View className="flex-row items-baseline justify-between">
                          <Text className="text-lg font-bold text-yellow-400">
                            {lowestBidDisplay}
                          </Text>
                          <Text className="text-xs text-yellow-300 font-medium">
                            {pricePerKmDisplay}
                          </Text>
                        </View>
                      </View>
                    </View>

                  {/* Status Info */}
                  {alreadyBid && (
                    <View className="mb-3 bg-blue-500/10 border border-blue-500/20 rounded p-2">
                      <Text className="text-sm text-blue-400 text-center">You have already submitted a bid</Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="flex-row items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/50 flex-1 mr-2"
                      onPress={() => handleViewRoute(request)}
                    >
                      <MapPin size={14} color="#60A5FA" />
                      <Text className="text-blue-400 ml-1">View Route</Text>
                    </Button>
                    
                    {!alreadyBid ? (
                      <Button
                        size="sm"
                        variant="gradient"
                        className="bg-gradient-to-r from-green-600 to-green-700 flex-1"
                        onPress={() => handleSubmitBid(request.id)}
                        disabled={submittingBid === request.id}
                      >
                        {submittingBid === request.id ? (
                          <>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text className="ml-1 text-white">Submitting...</Text>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} color="#FFFFFF" />
                            <Text className="ml-1 text-white">SUBMIT BID</Text>
                          </>
                        )}
                      </Button>
                    ) : (
                      <View className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg py-2">
                        <Text className="text-gray-500 text-center text-sm">Bid Submitted</Text>
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
