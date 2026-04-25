import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Truck, MapPin, Euro, ArrowRight, Package } from 'lucide-react-native';
import type { TransportOffersRequest } from '../types';
import { GlassCard, GlassButton, GlassBadge, COLORS } from '@design-system';

interface OffersListProps {
  requests: TransportOffersRequest[];
  hasBidOnRequest: (id: string) => boolean;
  submittingBid: string | null;
  onSubmitBid: (id: string) => void;
  onViewRoute: (request: TransportOffersRequest) => void;
}

export const OffersList: React.FC<OffersListProps> = ({
  requests,
  hasBidOnRequest,
  submittingBid,
  onSubmitBid,
  onViewRoute,
}) => {
  if (!requests.length) {
    return (
      <GlassCard tier="subtle" style={styles.emptyCard}>
        <Package size={40} color="rgba(255,255,255,0.05)" />
        <Text style={styles.emptyTitle}>No transport requests</Text>
        <Text style={styles.emptySubtitle}>
          New routes across the logistics network will appear here in real-time.
        </Text>
      </GlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {requests.map((request) => {
        const isSubmitted = hasBidOnRequest(request.id);
        const isSubmitting = submittingBid === request.id;
        
        return (
          <GlassCard key={request.id} tier="medium" style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {request.tradeOperation?.buyListing?.product?.displayName || request.tradeOperation?.buyListing?.product?.name || 'Bulk Grain'}
                </Text>
                <Text style={styles.buyerName}>
                  {request.tradeOperation?.buyListing?.buyer?.name || 'Unknown Buyer'}
                </Text>
              </View>
              <GlassBadge 
                label={request.urgencyLevel || 'STANDARD'} 
                variant={request.urgencyLevel === 'URGENT' ? 'danger' : 'warning'} 
                size="sm" 
              />
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Package size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.metricText}>{request.totalWeight} Tons</Text>
              </View>
              <View style={styles.metric}>
                <Euro size={14} color="#4ADE80" style={{ marginRight: 6 }} />
                <Text style={[styles.metricText, { color: '#4ADE80' }]}>
                   Budget: €{request.maxBudget?.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.routeBox}>
                <View style={styles.routeNode}>
                    <View style={[styles.nodeDot, { backgroundColor: COLORS.accentGreen }]} />
                    <Text style={styles.nodeText} numberOfLines={1}>Multiple Pickup Points</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeNode}>
                    <MapPin size={12} color="#F87171" style={{ marginRight: 6 }} />
                    <Text style={styles.nodeText} numberOfLines={1}>Primary Distribution Center</Text>
                </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity 
                onPress={() => onViewRoute(request)} 
                style={styles.viewRouteBtn}
              >
                <Text style={styles.viewRouteText}>VIEW ROUTE</Text>
              </TouchableOpacity>
              
              <GlassButton 
                label={isSubmitted ? "BID SUBMITTED" : "SUBMIT BID"}
                onPress={() => onSubmitBid(request.id)} 
                disabled={isSubmitted || isSubmitting}
                variant={isSubmitted ? "ghost" : "primary"}
                size="small"
                style={{ flex: 1.5 }}
                leftIcon={isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : null}
              />
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
    actions: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    buyerName: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    card: {
        marginBottom: 16,
    },
    cardHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    container: {
        paddingTop: 4,
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptySubtitle: {
        color: COLORS.textMuted,
        fontSize: 13,
        marginTop: 4,
        textAlign: 'center',
    },
    emptyTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        marginTop: 12,
    },
    metric: {
        alignItems: 'center',
        flexDirection: 'row',
        marginRight: 16,
    },
    metricText: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    metricsRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    nodeDot: {
        borderRadius: 4,
        height: 8,
        marginRight: 8,
        width: 8,
    },
    nodeText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        color: COLORS.textPrimary,
        fontSize: 17,
        fontWeight: '800',
    },
    routeBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
    },
    routeLine: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        height: 12,
        marginLeft: 3,
        marginVertical: 2,
        width: 1,
    },
    routeNode: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    viewRouteBtn: {
        flex: 1,
    },
    viewRouteText: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
