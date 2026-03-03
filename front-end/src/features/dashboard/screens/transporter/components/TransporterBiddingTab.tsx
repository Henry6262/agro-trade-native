import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
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
import { GlassCard, GlassBadge, GlassButton, GlassInput } from '../../../../../design-system';
import { BaseComponentProps } from '@shared/types';
import { MapDrawer } from '../maps/components/MapDrawer';
import { MapOffer } from '../maps/types';
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
  const [isVerified] = useState(true);
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
      const request = transportRequests.find((r) => r.id === requestId);
      await transportService.submitBid({
        transportRequestId: requestId,
        tradeOperationId: request?.tradeOperationId || '',
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
      <View style={styles.loadingFull}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.loadingText}>Loading transport requests...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
        }
      >
        <View style={styles.content}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <GlassCard tier="subtle" style={styles.statCard}>
              <Target size={16} color="#60A5FA" />
              <Text style={[styles.statValue, { color: '#60A5FA' }]}>{pendingBids.length}</Text>
              <Text style={styles.statLabel}>ACTIVE BIDS</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <Trophy size={16} color="#4ADE80" />
              <Text style={[styles.statValue, { color: '#4ADE80' }]}>{winRate}</Text>
              <Text style={styles.statLabel}>WIN RATE</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <DollarSign size={16} color="#FCD34D" />
              <Text style={[styles.statValue, { color: '#FCD34D', fontSize: 14 }]}>
                {averageBid}
              </Text>
              <Text style={styles.statLabel}>AVG BID</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <TrendingUp size={16} color="#A78BFA" />
              <Text style={[styles.statValue, { color: '#A78BFA' }]}>{completedJobs}</Text>
              <Text style={styles.statLabel}>COMPLETED</Text>
            </GlassCard>
          </View>

          {/* Verification Banner */}
          {!isVerified && (
            <GlassCard tier="medium" style={styles.verifyBanner}>
              <View style={styles.verifyRow}>
                <Shield size={28} color="#FCD34D" />
                <View style={styles.verifyText}>
                  <Text style={styles.verifyTitle}>Verification Required</Text>
                  <Text style={styles.verifySubtitle}>
                    Complete verification to unlock premium bidding features
                  </Text>
                </View>
              </View>
              <GlassButton
                label="VERIFY NOW"
                onPress={() => Alert.alert('Verification', 'Verification flow coming soon.')}
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={<Zap size={15} color="#FFFFFF" />}
              />
            </GlassCard>
          )}

          {/* Live Transport Auctions */}
          <View style={styles.sectionHeader}>
            <Package size={18} color="#4ADE80" />
            <Text style={styles.sectionTitle}>LIVE TRANSPORT AUCTIONS</Text>
          </View>

          {transportRequests.length === 0 ? (
            <GlassCard tier="subtle" style={styles.emptyCard}>
              <Package size={44} color="rgba(255,255,255,0.25)" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No open requests right now</Text>
              <Text style={styles.emptySubtitle}>
                Pull to refresh or check back later for new opportunities
              </Text>
            </GlassCard>
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
                <GlassCard key={request.id} tier="medium" style={styles.auctionCard}>
                  {/* Header */}
                  <View style={styles.auctionHeader}>
                    <View style={styles.auctionIcon}>
                      <Text style={styles.auctionIconText}>
                        {productName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.auctionTitleWrap}>
                      <Text style={styles.auctionTitle}>
                        {request.requestNumber || productName}
                      </Text>
                      <View style={styles.auctionMeta}>
                        <Weight size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.auctionMetaText}>
                          {request.totalWeight ? `${request.totalWeight} tons` : 'N/A'}
                        </Text>
                        <MapPin size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.auctionMetaText}>
                          {request.estimatedDistance
                            ? `${Math.round(request.estimatedDistance)} km`
                            : '—'}
                        </Text>
                        <Calendar size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.auctionMetaText}>
                          {getTimeRemaining(request.biddingDeadline)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Route Row */}
                  <View style={styles.routeRow}>
                    <Text style={styles.routeIcon}>🚚</Text>
                    <Text style={styles.routeLabel} numberOfLines={1}>
                      {pickupLabel}
                    </Text>
                    <Text style={styles.routeArrow}>→</Text>
                    <Text style={styles.routeIcon}>📦</Text>
                    <Text style={[styles.routeLabel, { flex: 1 }]} numberOfLines={1}>
                      {deliveryLabel}
                    </Text>
                  </View>

                  {/* Separator */}
                  <View style={styles.separator} />

                  {/* Current Bid Box */}
                  <View style={styles.bidInfoRow}>
                    <View style={styles.maxBudgetWrap}>
                      <Navigation size={14} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.maxBudgetText}>
                        Max:{' '}
                        <Text style={styles.maxBudgetValue}>
                          {request.maxBudget ? currencyFormatter.format(request.maxBudget) : '—'}
                        </Text>
                      </Text>
                    </View>
                    <GlassCard tier="subtle" style={styles.currentBidCard} animate={false}>
                      <Text style={styles.currentBidLabel}>CURRENT BID</Text>
                      <Text style={styles.currentBidValue}>{lowestBidDisplay}</Text>
                      <View style={styles.currentBidBottom}>
                        <Text style={styles.currentBidCount}>{totalBids} bids</Text>
                        <Text style={styles.currentBidPerKm}>{pricePerKmDisplay}</Text>
                      </View>
                    </GlassCard>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsCol}>
                    <GlassButton
                      label="View Route"
                      onPress={() => handleViewRoute(request)}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      leftIcon={<MapPin size={14} color="#60A5FA" />}
                    />

                    {selectedBid === request.id ? (
                      <View style={styles.bidInputRow}>
                        <View style={styles.bidInputWrap}>
                          <DollarSign
                            size={14}
                            color="rgba(255,255,255,0.5)"
                            style={styles.bidInputIcon}
                          />
                          <GlassInput
                            placeholder="Bid amount"
                            value={bidAmount}
                            onChangeText={setBidAmount}
                            keyboardType="numeric"
                            containerStyle={styles.bidInputField}
                          />
                        </View>
                        <GlassButton
                          label="BID"
                          onPress={() => handleSubmitBid(request.id)}
                          variant="primary"
                          size="sm"
                          disabled={!isVerified}
                          leftIcon={<Zap size={14} color="#FFFFFF" />}
                          style={styles.bidSubmitBtn}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedBid(null);
                            setBidAmount('');
                          }}
                          style={styles.cancelBidBtn}
                        >
                          <Text style={styles.cancelBidText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <GlassButton
                        label="PLACE BID"
                        onPress={() => handleSelectBid(request)}
                        variant="primary"
                        size="sm"
                        fullWidth
                        disabled={!isVerified || hasBid}
                        leftIcon={<Target size={14} color="#FFFFFF" />}
                      />
                    )}

                    {hasBid && (
                      <Text style={styles.hasBidText}>
                        You already have a pending bid for this request
                      </Text>
                    )}
                  </View>
                </GlassCard>
              );
            })
          )}
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

const styles = StyleSheet.create({
  actionsCol: {
    gap: 10,
  },
  auctionCard: {
    gap: 12,
  },
  auctionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  auctionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.25)',
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  auctionIconText: {
    color: '#4ADE80',
    fontSize: 20,
    fontWeight: '700',
  },
  auctionMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  auctionMetaText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  auctionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  auctionTitleWrap: {
    flex: 1,
    gap: 5,
  },
  bidInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  bidInputField: {
    marginBottom: 0,
  },
  bidInputIcon: {
    left: 12,
    position: 'absolute',
    top: 16,
    zIndex: 10,
  },
  bidInputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bidInputWrap: {
    flex: 1,
    position: 'relative',
  },
  bidSubmitBtn: {
    minWidth: 70,
  },
  cancelBidBtn: {
    padding: 8,
  },
  cancelBidText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  content: {
    gap: 14,
    padding: 16,
  },
  currentBidBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentBidCard: {
    gap: 2,
    minWidth: 120,
  },
  currentBidCount: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  currentBidLabel: {
    color: 'rgba(74,222,128,0.7)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  currentBidPerKm: {
    color: 'rgba(74,222,128,0.6)',
    fontSize: 10,
    fontWeight: '600',
  },
  currentBidValue: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    textAlign: 'center',
  },
  hasBidText: {
    color: '#60A5FA',
    fontSize: 11,
    textAlign: 'center',
  },
  loadingFull: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  maxBudgetText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  maxBudgetValue: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  maxBudgetWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  routeArrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginHorizontal: 2,
  },
  routeIcon: {
    fontSize: 14,
  },
  routeLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '35%',
  },
  routeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  separator: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyBanner: {
    gap: 12,
  },
  verifyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  verifySubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  verifyText: {
    flex: 1,
  },
  verifyTitle: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '700',
  },
});
