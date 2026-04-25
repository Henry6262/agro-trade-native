import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  X,
  Users,
  Truck,
  Clock,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  RefreshCw,
} from 'lucide-react-native';
import {
  TradeOperation,
  TradePhase,
  TradeSeller,
  TimelineEvent,
} from '../../../../../types/trade-operations';
import { tradeOperationService } from '@services/tradeOperationService';
import { negotiationService, Negotiation } from '@services/negotiationService';
import { inspectionService, InspectionRequest } from '@services/inspectionService';
import { GlassCard, GlassBadge, GlassButton } from '@design-system';
import { COLORS } from '@design-system';
import {
  getInspectionStatusVariant,
  getNegotiationStatusVariant,
  getPhaseColor,
  getSellerStatusVariant,
  getStatusBadgeVariant,
} from './trade-operation-detail-drawer/helpers';
import { styles } from './trade-operation-detail-drawer/styles';

interface TradeOperationDetailDrawerProps {
  visible: boolean;
  operationId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

type TabKey = 'overview' | 'sellers' | 'negotiations' | 'timeline';

export const TradeOperationDetailDrawer: React.FC<TradeOperationDetailDrawerProps> = ({
  visible,
  operationId,
  onClose,
  onRefresh: _onRefresh,
}) => {
  const [operation, setOperation] = useState<TradeOperation | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const fetchOperationDetails = async (showLoader = true) => {
    if (!operationId) return;

    if (showLoader) setIsLoading(true);
    try {
      const operationData = await tradeOperationService.getTradeOperation(operationId);
      setOperation(operationData as any);

      const negotiationsData = await negotiationService.getTradeNegotiations(operationId);
      setNegotiations(negotiationsData);

      const inspectionsData = await inspectionService.getInspectionsByTradeOperation(operationId);
      setInspections(inspectionsData);
    } catch {
      console.error('Error fetching operation details');
      Alert.alert('Error', 'Failed to load operation details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && operationId) {
      fetchOperationDetails();
      const interval = setInterval(() => {
        fetchOperationDetails(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [visible, operationId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOperationDetails(false);
  };

  const handlePhaseTransition = async (nextPhase: TradePhase) => {
    if (!operation) return;

    Alert.alert(
      'Confirm Phase Change',
      `Move to ${nextPhase.replace('_', ' ').toLowerCase()} phase?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await tradeOperationService.updateTradeOperation(operation.id, { phase: nextPhase });
              await fetchOperationDetails();
              Alert.alert('Success', 'Phase updated successfully');
            } catch {
              Alert.alert('Error', 'Failed to update phase');
            }
          },
        },
      ]
    );
  };

  // ----- Tabs -----
  const TABS: TabKey[] = ['overview', 'sellers', 'negotiations', 'timeline'];

  const renderTabs = () => (
    <View style={styles.tabs}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ----- Overview tab -----
  const renderOverview = () => {
    if (!operation) return null;

    return (
      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={COLORS.accentGreen}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Operation info */}
        <GlassCard tier="subtle" animate={false} style={styles.sectionCard}>
          <View style={styles.opInfoHeader}>
            <View>
              <Text style={styles.opNumber}>{operation.operationNumber}</Text>
              <Text style={styles.opDate}>
                Created {new Date(operation.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <GlassBadge
              label={operation.status}
              variant={getStatusBadgeVariant(operation.status)}
              size="md"
            />
          </View>

          <View style={styles.phaseRow}>
            <Clock size={13} color={COLORS.textMuted} />
            <Text style={[styles.phaseText, { color: getPhaseColor(operation.phase) }]}>
              {' '}
              {operation.phase.replace(/_/g, ' ')}
            </Text>
          </View>
        </GlassCard>

        {/* Buyer info */}
        {operation.buyListing && (
          <GlassCard
            tier="subtle"
            animate={false}
            style={[styles.sectionCard, { borderColor: 'rgba(96,165,250,0.2)' }]}
          >
            <Text style={styles.sectionLabel}>Buyer Details</Text>
            <Text style={styles.fieldPrimary}>
              {operation.buyListing.buyer?.name || 'Unknown Buyer'}
            </Text>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldKey}>Product</Text>
              <Text style={styles.fieldVal}>{operation.buyListing.product?.name}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldKey}>Quantity</Text>
              <Text style={styles.fieldVal}>
                {operation.buyListing.quantity} {operation.buyListing.unit}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldKey}>Max Price</Text>
              <Text style={[styles.fieldVal, { color: COLORS.accentGold }]}>
                €{operation.buyListing.maxPricePerUnit}/unit
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Profit summary */}
        {(operation.estimatedProfit !== undefined || operation.profitMargin !== undefined) && (
          <GlassCard
            tier="subtle"
            animate={false}
            style={[styles.sectionCard, { borderColor: 'rgba(74,222,128,0.2)' }]}
          >
            <View style={styles.sectionHeaderRow}>
              <TrendingUp size={16} color={COLORS.accentGreen} />
              <Text style={[styles.sectionLabel, { color: COLORS.accentGreen, marginLeft: 6 }]}>
                Profit Analysis
              </Text>
            </View>
            <View style={styles.divider} />
            {operation.estimatedProfit !== undefined && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldKey}>Estimated Profit</Text>
                <Text style={[styles.fieldVal, { color: COLORS.accentGold }]}>
                  €{operation.estimatedProfit.toFixed(2)}
                </Text>
              </View>
            )}
            {operation.profitMargin !== undefined && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldKey}>Profit Margin</Text>
                <Text style={[styles.fieldVal, { color: COLORS.accentGreen }]}>
                  {operation.profitMargin.toFixed(1)}%
                </Text>
              </View>
            )}
            {(operation as any).totalPurchaseCost !== undefined && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldKey}>Purchase Cost</Text>
                <Text style={styles.fieldVal}>
                  €{(operation as any).totalPurchaseCost.toFixed(2)}
                </Text>
              </View>
            )}
            {(operation as any).estimatedTransportCost !== undefined && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldKey}>Transport Cost</Text>
                <Text style={[styles.fieldVal, { color: COLORS.info }]}>
                  €{(operation as any).estimatedTransportCost.toFixed(2)}
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Inspection status */}
        {inspections.length > 0 && (
          <GlassCard
            tier="subtle"
            animate={false}
            style={[styles.sectionCard, { borderColor: 'rgba(252,211,77,0.2)' }]}
          >
            <View style={styles.sectionHeaderRow}>
              <CheckCircle size={16} color={COLORS.accentGold} />
              <Text style={[styles.sectionLabel, { color: COLORS.accentGold, marginLeft: 6 }]}>
                Quality Inspections
              </Text>
            </View>
            <View style={styles.divider} />
            {inspections.map((inspection) => (
              <View key={inspection.id} style={styles.inspectionRow}>
                <Text style={styles.inspectionSeller}>
                  {inspection.saleListing?.seller?.name || 'Seller'}
                </Text>
                <GlassBadge
                  label={inspection.status}
                  variant={getInspectionStatusVariant(inspection.status)}
                  size="sm"
                />
              </View>
            ))}
            <GlassButton
              label="Request All Inspections"
              variant="secondary"
              size="sm"
              style={styles.inspectionBtn}
              onPress={async () => {
                if (!operation) return;
                const unverifiedSellers = (operation.sellers || []).filter(
                  (s: TradeSeller) => s.status === 'ACCEPTED' && !s.isVerified
                );
                if (unverifiedSellers.length === 0) {
                  Alert.alert('Info', 'All accepted sellers already have inspection requests');
                  return;
                }
                try {
                  const saleListingIds = unverifiedSellers.map((s: TradeSeller) => s.saleListingId);
                  await inspectionService.requestInspectionsForTrade(
                    operation.id,
                    saleListingIds,
                    'MEDIUM'
                  );
                  Alert.alert(
                    'Success',
                    `Requested inspections for ${unverifiedSellers.length} sellers`
                  );
                  fetchOperationDetails();
                } catch {
                  Alert.alert('Error', 'Failed to request inspections');
                }
              }}
            />
          </GlassCard>
        )}

        {/* Phase actions */}
        <View style={styles.actionButtons}>
          {operation.phase === TradePhase.SELLER_NEGOTIATION && (
            <GlassButton
              label="Proceed to Transport"
              variant="primary"
              size="md"
              fullWidth
              leftIcon={<Truck size={16} color="#fff" />}
              onPress={() => handlePhaseTransition(TradePhase.TRANSPORT_MATCHING)}
            />
          )}
          {operation.phase === TradePhase.TRANSPORT_MATCHING && (
            <GlassButton
              label="Awaiting Transport Bids"
              variant="ghost"
              size="md"
              fullWidth
              leftIcon={<Clock size={16} color={COLORS.textSecondary} />}
              onPress={() => Alert.alert('Info', 'Transport bidding in progress')}
            />
          )}
        </View>
      </ScrollView>
    );
  };

  // ----- Sellers tab -----
  const renderSellers = () => {
    if (!operation?.sellers) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {operation.sellers.map((seller: TradeSeller) => (
          <GlassCard key={seller.id} tier="subtle" animate={false} style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <Text style={styles.sellerName}>
                {(seller as any).seller?.name || `Seller ${seller.sellerId.slice(-4)}`}
              </Text>
              <GlassBadge
                label={seller.status}
                variant={getSellerStatusVariant(seller.status)}
                size="sm"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <Text style={styles.fieldKey}>Quantity</Text>
              <Text style={styles.fieldVal}>
                {seller.requestedQuantity} {seller.unit}
              </Text>
            </View>
            {seller.finalPrice && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldKey}>Agreed Price</Text>
                <Text style={[styles.fieldVal, { color: COLORS.accentGold }]}>
                  €{seller.finalPrice}/unit
                </Text>
              </View>
            )}
            {seller.isVerified && (
              <View style={styles.verifiedRow}>
                <CheckCircle size={13} color={COLORS.accentGreen} />
                <Text style={styles.verifiedText}> Verified</Text>
              </View>
            )}

            <View style={styles.sellerActions}>
              {seller.status === 'INVITED' && (
                <GlassButton
                  label="Send Offer"
                  variant="secondary"
                  size="sm"
                  leftIcon={<MessageSquare size={13} color="#fff" />}
                  onPress={() => Alert.alert('Info', 'Opening negotiation modal...')}
                  style={styles.sellerActionBtn}
                />
              )}
              {seller.status === 'ACCEPTED' && !seller.isVerified && (
                <GlassButton
                  label="Request Inspection"
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle size={13} color="#fff" />}
                  onPress={async () => {
                    try {
                      await inspectionService.createInspectionRequest({
                        tradeOperationId: operation!.id,
                        saleListingId: seller.saleListingId,
                        priority: 'MEDIUM',
                        notes: `Inspection requested for ${(seller as any).seller?.name}`,
                      });
                      Alert.alert('Success', 'Inspection requested successfully');
                      fetchOperationDetails();
                    } catch {
                      Alert.alert('Error', 'Failed to request inspection');
                    }
                  }}
                  style={styles.sellerActionBtn}
                />
              )}
            </View>
          </GlassCard>
        ))}

        {operation.sellers.length === 0 && (
          <View style={styles.emptyTab}>
            <Users size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTabText}>No sellers added yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // ----- Negotiations tab -----
  const renderNegotiations = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {negotiations.map((negotiation) => (
        <GlassCard key={negotiation.id} tier="subtle" animate={false} style={styles.negoCard}>
          <View style={styles.negoHeader}>
            <Text style={styles.negoTitle}>
              {negotiation.type === 'BUYER_OFFER' ? 'Buyer' : 'Seller'} Negotiation
            </Text>
            <GlassBadge
              label={negotiation.status}
              variant={getNegotiationStatusVariant(negotiation.status)}
              size="sm"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldKey}>Offered Price</Text>
            <Text style={[styles.fieldVal, { color: COLORS.accentGold }]}>
              €{negotiation.offeredPrice}/unit
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldKey}>Quantity</Text>
            <Text style={styles.fieldVal}>{negotiation.quantity} units</Text>
          </View>
          {negotiation.message && (
            <Text style={styles.negoMessage}>&quot;{negotiation.message}&quot;</Text>
          )}
          <Text style={styles.negoRound}>Round {negotiation.roundNumber || 1}</Text>

          <View style={styles.negoActions}>
            <GlassButton
              label="View Details"
              variant="ghost"
              size="sm"
              onPress={() => Alert.alert('Info', 'View offer history')}
              style={styles.negoActionBtn}
            />
            {negotiation.status === 'PENDING' && (
              <GlassButton
                label="Respond"
                variant="secondary"
                size="sm"
                onPress={() => Alert.alert('Info', 'Respond to offer')}
                style={styles.negoActionBtn}
              />
            )}
          </View>
        </GlassCard>
      ))}

      {negotiations.length === 0 && (
        <View style={styles.emptyTab}>
          <MessageSquare size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTabText}>No negotiations yet</Text>
        </View>
      )}
    </ScrollView>
  );

  // ----- Timeline tab -----
  const renderTimeline = () => {
    const mockTimeline = operation
      ? ([
          {
            id: '1',
            phase: TradePhase.BUYER_SELECTION,
            timestamp: operation.createdAt,
            description: 'Trade operation created',
            actor: 'System',
          },
          {
            id: '2',
            phase: operation.phase,
            timestamp: (operation as any).updatedAt,
            description: `Phase changed to ${operation.phase.replace(/_/g, ' ').toLowerCase()}`,
            actor: 'Admin',
          },
        ] as TimelineEvent[])
      : [];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {mockTimeline.map((event, index) => (
          <View key={event.id} style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: index === 0 ? COLORS.accentGreen : COLORS.info },
                ]}
              />
              {index < mockTimeline.length - 1 && <View style={styles.timelineLine} />}
            </View>

            <GlassCard tier="subtle" animate={false} style={styles.timelineCard}>
              <Text style={styles.timelineDesc}>{event.description}</Text>
              <Text style={styles.timelineMeta}>
                {new Date(event.timestamp).toLocaleString()} · by {event.actor}
              </Text>
            </GlassCard>
          </View>
        ))}

        {mockTimeline.length === 0 && (
          <View style={styles.emptyTab}>
            <Clock size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTabText}>No timeline events yet</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <GlassCard tier="strong" animate={false} noPadding style={styles.headerCard}>
          <View style={styles.headerInner}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Trade Operation Details</Text>
              {operation && <Text style={styles.headerSub}>{operation.operationNumber}</Text>}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}>
                <RefreshCw size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {renderTabs()}
        </GlassCard>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accentGreen} />
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'sellers' && renderSellers()}
            {activeTab === 'negotiations' && renderNegotiations()}
            {activeTab === 'timeline' && renderTimeline()}
          </View>
        )}
      </View>
    </Modal>
  );
};
