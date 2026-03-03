import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import {
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Weight,
  MapPin,
  Calendar,
  RefreshCw,
  Truck,
} from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../../design-system';
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

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const URGENCY_VARIANT: Record<string, BadgeVariant> = {
  HIGH: 'danger',
  STANDARD: 'warning',
  LOW: 'success',
};

export const TransporterIncomingOffersTab: React.FC<TransporterIncomingOffersTabProps> = ({
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
    []
  );

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
      const request = transportRequests.find((r) => r.id === requestId);
      const bidData = {
        transportRequestId: requestId,
        tradeOperationId: request?.tradeOperationId || '',
        bidAmount: 3500,
        estimatedDuration: 24,
        vehicleType: 'FLATBED',
        vehicleCapacity: 40,
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
      productType: request.tradeOperation?.buyListing?.product?.name || 'Agricultural Goods',
    };

    setSelectedOffer(mapOffer);
    setIsMapDrawerOpen(true);
  };

  const hasBidOnRequest = (requestId: string) => {
    return myBids.some((bid) => bid.transportRequestId === requestId);
  };

  const availableRequests = transportRequests.filter((r) => r.status?.toUpperCase() === 'OPEN');
  const highPriorityCount = availableRequests.filter(
    (r) => r.urgencyLevel?.toUpperCase() === 'HIGH'
  ).length;
  const standardCount = availableRequests.filter(
    (r) => r.urgencyLevel?.toUpperCase() === 'STANDARD'
  ).length;

  return (
    <>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={styles.content}>
          {/* Refresh Button */}
          <GlassButton
            label={refreshing ? 'Refreshing...' : 'Refresh Requests'}
            onPress={handleRefresh}
            variant="secondary"
            size="sm"
            fullWidth
            loading={refreshing}
            leftIcon={<RefreshCw size={16} color="#60A5FA" />}
          />

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <GlassCard tier="subtle" style={styles.statCard}>
              <Package size={16} color="#FCD34D" />
              <Text style={[styles.statValue, { color: '#FCD34D' }]}>
                {availableRequests.length}
              </Text>
              <Text style={styles.statLabel}>AVAILABLE</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <DollarSign size={16} color="#4ADE80" />
              <Text style={[styles.statValue, { color: '#4ADE80' }]}>{myBids.length}</Text>
              <Text style={styles.statLabel}>MY BIDS</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <AlertTriangle size={16} color="#F87171" />
              <Text style={[styles.statValue, { color: '#F87171' }]}>{highPriorityCount}</Text>
              <Text style={styles.statLabel}>HIGH PRI.</Text>
            </GlassCard>
            <GlassCard tier="subtle" style={styles.statCard}>
              <Truck size={16} color="#F97316" />
              <Text style={[styles.statValue, { color: '#F97316' }]}>{standardCount}</Text>
              <Text style={styles.statLabel}>STANDARD</Text>
            </GlassCard>
          </View>

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Package size={18} color="#FCD34D" />
            <Text style={styles.sectionTitle}>TRANSPORT REQUESTS</Text>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text style={styles.loadingText}>Loading transport requests...</Text>
            </View>
          ) : availableRequests.length === 0 ? (
            <GlassCard tier="subtle" style={styles.emptyCard}>
              <Truck size={44} color="rgba(255,255,255,0.25)" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No transport requests available</Text>
              <Text style={styles.emptySubtitle}>Check back later for new opportunities</Text>
            </GlassCard>
          ) : (
            availableRequests.map((request) => {
              const alreadyBid = hasBidOnRequest(request.id);
              const urgency = (request.urgencyLevel || '').toUpperCase();
              const urgencyVariant: BadgeVariant = URGENCY_VARIANT[urgency] ?? 'muted';
              const lowestBidDisplay = request.lowestBid
                ? currencyFormatter.format(request.lowestBid)
                : 'None';
              const pricePerKmDisplay =
                request.lowestBid && request.estimatedDistance
                  ? `${currencyFormatter.format(
                      request.lowestBid / Math.max(request.estimatedDistance, 1)
                    )}/km`
                  : '--';

              return (
                <GlassCard key={request.id} tier="medium" style={styles.requestCard}>
                  {/* Header */}
                  <View style={styles.requestHeader}>
                    <View style={styles.requestHeaderLeft}>
                      <Text style={styles.requestNumber}>Request #{request.requestNumber}</Text>
                      <View style={styles.requestMeta}>
                        <Weight size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.requestMetaText}>{request.totalWeight} tons</Text>
                        <MapPin size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.requestMetaText}>
                          {request.pickupPoints?.length || 1} pickup(s)
                        </Text>
                        <Calendar size={13} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.requestMetaText}>
                          {request.biddingDeadline
                            ? format(new Date(request.biddingDeadline), 'MMM dd')
                            : '—'}
                        </Text>
                      </View>
                    </View>
                    <GlassBadge
                      label={request.urgencyLevel || 'STANDARD'}
                      variant={urgencyVariant}
                    />
                  </View>

                  {/* Separator */}
                  <View style={styles.separator} />

                  {/* Financial Info */}
                  <View style={styles.financeRow}>
                    <GlassCard tier="subtle" style={styles.financeCard} animate={false}>
                      <Text style={styles.financeLabel}>MAX BUDGET</Text>
                      <Text style={[styles.financeValue, { color: '#4ADE80' }]}>
                        {request.maxBudget ? currencyFormatter.format(request.maxBudget) : 'N/A'}
                      </Text>
                    </GlassCard>
                    <GlassCard tier="subtle" style={styles.financeCard} animate={false}>
                      <Text style={styles.financeLabel}>BIDS</Text>
                      <Text style={[styles.financeValue, { color: '#60A5FA' }]}>
                        {request.bidsCount || 0}
                      </Text>
                    </GlassCard>
                    <GlassCard tier="subtle" style={styles.financeCard} animate={false}>
                      <Text style={styles.financeLabel}>LOWEST BID</Text>
                      <Text style={[styles.financeValue, { color: '#FCD34D' }]}>
                        {lowestBidDisplay}
                      </Text>
                      <Text style={styles.pricePerKm}>{pricePerKmDisplay}</Text>
                    </GlassCard>
                  </View>

                  {/* Already bid notice */}
                  {alreadyBid && (
                    <View style={styles.bidSubmittedBanner}>
                      <Text style={styles.bidSubmittedText}>You have already submitted a bid</Text>
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <GlassButton
                      label="View Route"
                      onPress={() => handleViewRoute(request)}
                      variant="secondary"
                      size="sm"
                      style={styles.actionBtnHalf}
                      leftIcon={<MapPin size={14} color="#60A5FA" />}
                    />

                    {!alreadyBid ? (
                      <GlassButton
                        label={submittingBid === request.id ? 'Submitting...' : 'SUBMIT BID'}
                        onPress={() => handleSubmitBid(request.id)}
                        variant="primary"
                        size="sm"
                        style={styles.actionBtnHalf}
                        loading={submittingBid === request.id}
                        leftIcon={<CheckCircle size={14} color="#FFFFFF" />}
                      />
                    ) : (
                      <View style={styles.bidDoneBtn}>
                        <Text style={styles.bidDoneText}>Bid Submitted</Text>
                      </View>
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
  actionBtnHalf: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bidDoneBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  bidDoneText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },
  bidSubmittedBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderColor: 'rgba(96,165,250,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
  },
  bidSubmittedText: {
    color: '#60A5FA',
    fontSize: 13,
  },
  content: {
    gap: 14,
    padding: 16,
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
  financeCard: {
    flex: 1,
    gap: 3,
  },
  financeLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  financeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  financeValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  pricePerKm: {
    color: 'rgba(252,211,77,0.6)',
    fontSize: 10,
    fontWeight: '600',
  },
  requestCard: {
    gap: 12,
  },
  requestHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestHeaderLeft: {
    flex: 1,
    gap: 6,
    marginRight: 12,
  },
  requestMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  requestMetaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  requestNumber: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
    color: '#FCD34D',
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
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
});
