import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Package, Plus, AlertTriangle, DollarSign, Truck, Calendar } from 'lucide-react-native';

import { useTradeOperations } from './hooks/useTradeOperations';
import { TradeCreationDrawer } from './components/TradeCreationDrawer';
import { TransportMapModal } from './components/TransportMapModal';
import { TradeOperationDetailDrawer } from './components/TradeOperationDetailDrawer';
import { ActiveOperationsTab } from './components/ActiveOperationsTab';
import { OfferModal } from './components/OfferModal';
import { NegotiationManagementScreen } from './components/NegotiationManagementScreen';
import { CounterOfferModal } from './components/CounterOfferModal';
import { GlassCard } from '@design-system';
import { COLORS } from '@design-system';
import type { BuyListing, TradeOperation } from '@services/tradeOperationService';
import { getProductEmoji } from '../../../../shared/utils/productEmoji';

export default function OperationsScreenRefactored() {
  const {
    // Data
    buyListings = [],
    sellListings = [],
    sellListingsHasMore = false,
    tradeOperations = [],
    currentTradeOperation,
    matchingSellers,
    profitCalculation,
    transportEstimate,

    // Loading states
    isLoadingBuyListings,
    isLoadingSellListings,
    isLoadingMoreSellListings = false,
    isLoadingMatchingSellers,
    isCalculatingProfit,
    isEstimatingTransport,
    isSendingOffers,

    // Actions
    loadBuyListings,
    loadSellListings,
    loadMoreSellListings,
    loadTradeOperations,
    createTradeOperation,
    findMatchingSellers,
    selectSellers,
    calculateProfit,
    refreshCurrentTrade,
    estimateTransportCost,
    sendBulkOffers,

    // Error handling
    error,
  } = useTradeOperations();

  // UI State
  const [activeTab, setActiveTab] = useState<'active' | 'create' | 'sellers'>('active');
  const [selectedBuyListing, setSelectedBuyListing] = useState<BuyListing | null>(null);
  const [showCreationDrawer, setShowCreationDrawer] = useState(false);
  const [showTransportMap, setShowTransportMap] = useState(false);
  const [selectedOperation] = useState<TradeOperation | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerModalData, setOfferModalData] = useState<{
    tradeOperationId: string;
    tradeSellerId: string;
  } | null>(null);
  const [showNegotiationManagement, setShowNegotiationManagement] = useState(false);
  const [negotiationOperationId, setNegotiationOperationId] = useState<string | null>(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [counterOfferData, setCounterOfferData] = useState<{
    negotiationId: string;
    currentOffer: { price: number; quantity: number; terms?: string };
    counterOffer?: { price: number; quantity: number; terms?: string; reason?: string };
    sellerName?: string;
  } | null>(null);

  // Load data on mount
  useEffect(() => {
    loadBuyListings();
    loadSellListings();
    loadTradeOperations();
  }, [loadBuyListings, loadSellListings, loadTradeOperations]);

  // Tab Component
  const TabButton = ({
    id,
    label,
    count,
    isActive,
  }: {
    id: 'active' | 'create' | 'sellers';
    label: string;
    count: number;
    isActive: boolean;
  }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(id)}
      style={[styles.tab, isActive && styles.tabActive]}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {label}
        {count > 0 ? ` (${count})` : ''}
      </Text>
    </TouchableOpacity>
  );

  // Render Active Operations
  const renderActiveOperations = () => (
    <ActiveOperationsTab
      onSelectOperation={(operation) => {
        setNegotiationOperationId(operation.id);
        setShowNegotiationManagement(true);
      }}
      onSendOffer={(tradeOperationId, tradeSellerId) => {
        setOfferModalData({ tradeOperationId, tradeSellerId });
        setShowOfferModal(true);
      }}
      onCounterOffer={(negotiationId) => {
        setCounterOfferData({
          negotiationId,
          currentOffer: { price: 0, quantity: 0 },
          sellerName: 'Seller',
        });
        setShowCounterOfferModal(true);
      }}
    />
  );

  // Seller Listings Tab
  const renderSellers = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.tabContent}>
        {/* Header row */}
        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>Available Seller Listings</Text>
          <TouchableOpacity
            onPress={loadSellListings}
            disabled={isLoadingSellListings}
            style={styles.refreshBtn}
          >
            <Text style={styles.refreshText}>
              {isLoadingSellListings ? 'Loading...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoadingSellListings ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.accentGreen} />
            <Text style={styles.stateText}>Loading seller listings...</Text>
          </View>
        ) : sellListings.length === 0 ? (
          <View style={styles.centerState}>
            <Package size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Seller Listings</Text>
            <Text style={styles.stateText}>No seller listings available right now</Text>
          </View>
        ) : (
          <>
            {sellListings.map((listing) => (
              <GlassCard
                key={listing.id}
                tier="medium"
                animate={false}
                style={StyleSheet.flatten([styles.listingCard, styles.darkCard])}
              >
                {/* Product emoji header */}
                <View style={styles.productEmojiRow}>
                  <View style={styles.emojiCircle}>
                    <Text style={styles.emojiText}>{getProductEmoji(listing.product)}</Text>
                  </View>
                  <View style={styles.listingHeaderLeft}>
                    <Text style={styles.listingTitle}>
                      {listing.product?.name || 'Unknown Product'}
                    </Text>
                    <Text style={styles.listingSubtitle}>
                      {listing.seller?.name || 'Unknown Seller'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.qualityBadge,
                      listing.quality === 'premium'
                        ? styles.qualityPremium
                        : listing.quality === 'standard'
                          ? styles.qualityStandard
                          : styles.qualityDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.qualityText,
                        listing.quality === 'premium'
                          ? styles.qualityTextPremium
                          : listing.quality === 'standard'
                            ? styles.qualityTextStandard
                            : styles.qualityTextDefault,
                      ]}
                    >
                      {listing.quality || 'Standard'}
                    </Text>
                  </View>
                </View>

                {/* Categories */}
                {listing.categories && listing.categories.length > 0 && (
                  <View style={styles.tagsRow}>
                    {listing.categories.slice(0, 3).map((cat: string, idx: number) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{cat}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Details */}
                <View style={styles.detailsColumn}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Package size={15} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>
                        {listing.quantity} {listing.unit} available
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <DollarSign size={15} color={COLORS.accentGreen} />
                      <Text style={styles.priceText}>
                        ${listing.askingPrice}/{listing.unit}
                      </Text>
                    </View>
                  </View>
                  {listing.harvestDate && (
                    <View style={styles.detailItem}>
                      <Calendar size={15} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>
                        Harvest: {new Date(listing.harvestDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {listing.location && (
                    <View style={styles.detailItem}>
                      <Truck size={15} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>
                        {listing.location?.city || 'N/A'}, {listing.location?.country || 'N/A'}
                      </Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            ))}
            {sellListingsHasMore && (
              <TouchableOpacity
                onPress={loadMoreSellListings}
                disabled={isLoadingMoreSellListings}
                style={styles.loadMoreBtn}
              >
                {isLoadingMoreSellListings ? (
                  <ActivityIndicator size="small" color={COLORS.accentGreen} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );

  // Create Trade Tab
  const renderCreateTrade = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.tabContent}>
        <Text style={styles.contentTitle}>Available Buy Orders</Text>

        {isLoadingBuyListings ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.accentGreen} />
            <Text style={styles.stateText}>Loading buy orders...</Text>
          </View>
        ) : buyListings.length === 0 ? (
          <View style={styles.centerState}>
            <Package size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Buy Orders</Text>
            <Text style={styles.stateText}>No buy orders available right now</Text>
          </View>
        ) : (
          buyListings.map((listing) => (
            <TouchableOpacity
              key={listing.id}
              onPress={() => {
                setSelectedBuyListing(listing);
                setShowCreationDrawer(true);
              }}
              activeOpacity={0.8}
            >
              <GlassCard
                tier="medium"
                animate={false}
                style={StyleSheet.flatten([styles.listingCard, styles.darkCard])}
              >
                {/* Product emoji header */}
                <View style={styles.productEmojiRow}>
                  <View style={styles.emojiCircle}>
                    <Text style={styles.emojiText}>{getProductEmoji(listing.product)}</Text>
                  </View>
                  <View style={styles.listingHeaderLeft}>
                    <Text style={styles.listingTitle}>
                      {listing.product?.name || 'Unknown Product'}
                    </Text>
                    <Text style={styles.listingSubtitle}>
                      {listing.buyer?.name || 'Unknown Buyer'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.qualityBadge,
                      listing.urgency === 'critical'
                        ? styles.urgencyCritical
                        : listing.urgency === 'high'
                          ? styles.urgencyHigh
                          : styles.urgencyNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.qualityText,
                        listing.urgency === 'critical'
                          ? styles.urgencyTextCritical
                          : listing.urgency === 'high'
                            ? styles.urgencyTextHigh
                            : styles.urgencyTextNormal,
                      ]}
                    >
                      {listing.urgency || listing.status}
                    </Text>
                  </View>
                </View>

                {/* Requirements */}
                {listing.requirements && listing.requirements.length > 0 && (
                  <View style={styles.tagsRow}>
                    {listing.requirements.slice(0, 3).map((req: string, idx: number) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{req}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Details */}
                <View style={styles.detailsColumn}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Package size={15} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>
                        {listing.quantity} {listing.unit}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <DollarSign size={15} color={COLORS.accentGreen} />
                      <Text style={styles.priceText}>
                        ${listing.maxPricePerUnit}/{listing.unit}
                      </Text>
                    </View>
                  </View>
                  {listing.neededBy && (
                    <View style={styles.detailItem}>
                      <Calendar size={15} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>
                        Needed by: {new Date(listing.neededBy).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {listing.deliveryAddress && (
                    <View style={styles.detailItem}>
                      <Truck size={15} color={COLORS.textMuted} />
                      <Text style={styles.detailText}>
                        Delivery: {listing.deliveryAddress?.city || 'N/A'},{' '}
                        {listing.deliveryAddress?.country || 'N/A'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* CTA */}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBuyListing(listing);
                    setShowCreationDrawer(true);
                  }}
                  style={styles.ctaBtn}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.ctaBtnText}>Create Trade Operation</Text>
                </TouchableOpacity>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  // If showing negotiation management, render that instead
  if (showNegotiationManagement && negotiationOperationId) {
    return (
      <NegotiationManagementScreen
        tradeOperationId={negotiationOperationId}
        onBack={() => {
          setShowNegotiationManagement(false);
          setNegotiationOperationId(null);
          loadTradeOperations();
        }}
        onCounterOffer={(negotiationId, currentOffer) => {
          setCounterOfferData({
            negotiationId,
            currentOffer: currentOffer || { price: 0, quantity: 0 },
            counterOffer: currentOffer,
            sellerName: 'Seller',
          });
          setShowCounterOfferModal(true);
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Trade Operations</Text>
        <Text style={styles.screenSubtitle}>Manage and create trade operations</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorBanner}>
          <AlertTriangle size={16} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TabButton
          id="active"
          label="Active"
          count={tradeOperations.length}
          isActive={activeTab === 'active'}
        />
        <TabButton
          id="create"
          label="Create"
          count={buyListings.length}
          isActive={activeTab === 'create'}
        />
        <TabButton
          id="sellers"
          label="Sellers"
          count={sellListings.length}
          isActive={activeTab === 'sellers'}
        />
      </View>

      {/* Content */}
      {activeTab === 'active'
        ? renderActiveOperations()
        : activeTab === 'create'
          ? renderCreateTrade()
          : renderSellers()}

      {/* Trade Creation Drawer */}
      <TradeCreationDrawer
        visible={showCreationDrawer}
        onClose={() => {
          setShowCreationDrawer(false);
          setSelectedBuyListing(null);
        }}
        buyListing={selectedBuyListing}
        onTradeCreated={(_trade) => {
          loadTradeOperations();
          setActiveTab('active');
        }}
        findMatchingSellers={findMatchingSellers}
        createTradeOperation={createTradeOperation}
        selectSellers={selectSellers}
        calculateProfit={calculateProfit}
        refreshCurrentTrade={refreshCurrentTrade}
        estimateTransportCost={estimateTransportCost}
        sendBulkOffers={sendBulkOffers}
        currentTradeOperation={currentTradeOperation}
        matchingSellers={matchingSellers}
        profitCalculation={profitCalculation}
        transportEstimate={transportEstimate}
        isLoadingMatchingSellers={isLoadingMatchingSellers}
        isCalculatingProfit={isCalculatingProfit}
        isEstimatingTransport={isEstimatingTransport}
        isSendingOffers={isSendingOffers}
      />

      {/* Transport Map Modal */}
      <TransportMapModal
        visible={showTransportMap}
        onClose={() => setShowTransportMap(false)}
        tradeOperation={selectedOperation}
        transportEstimate={transportEstimate}
      />

      {/* Trade Operation Detail Drawer */}
      <TradeOperationDetailDrawer
        visible={showDetailDrawer}
        operationId={selectedOperationId}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedOperationId(null);
        }}
        onRefresh={loadTradeOperations}
      />

      {/* Offer Modal */}
      {offerModalData && (
        <OfferModal
          visible={showOfferModal}
          onClose={() => {
            setShowOfferModal(false);
            setOfferModalData(null);
            loadTradeOperations();
          }}
          tradeOperationId={offerModalData.tradeOperationId}
          sellerId={offerModalData.tradeSellerId}
        />
      )}

      {/* Counter-Offer Modal */}
      {counterOfferData && (
        <CounterOfferModal
          visible={showCounterOfferModal}
          onClose={() => {
            setShowCounterOfferModal(false);
            setCounterOfferData(null);
          }}
          negotiationId={counterOfferData.negotiationId}
          currentOffer={counterOfferData.currentOffer}
          counterOffer={counterOfferData.counterOffer}
          sellerName={counterOfferData.sellerName}
          buyerMaxPrice={selectedOperation?.buyListing?.maxPricePerUnit}
          targetMargin={selectedOperation?.targetProfitMargin}
          onOfferSent={() => {
            loadTradeOperations();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  contentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  contentTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  ctaBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.18)',
    borderColor: 'rgba(74,222,128,0.35)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 11,
  },
  ctaBtnText: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: '700',
  },
  darkCard: {
    backgroundColor: 'rgba(8,22,12,0.82)',
    borderColor: 'rgba(74,222,128,0.22)',
    shadowColor: '#00ff6a',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  detailsColumn: {
    gap: 6,
  },
  emojiCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderColor: 'rgba(74,222,128,0.22)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emojiText: {
    fontSize: 22,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderColor: 'rgba(248,113,113,0.25)',
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 10,
  },
  errorText: {
    color: COLORS.danger,
    flex: 1,
    fontSize: 13,
  },
  listingCard: {
    marginBottom: 12,
  },
  listingHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  listingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  listingTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  loadMoreBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 14,
  },
  loadMoreText: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  priceText: {
    color: COLORS.accentGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  productEmojiRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  qualityBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qualityDefault: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  qualityPremium: {
    backgroundColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.25)',
  },
  qualityStandard: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  qualityTextDefault: { color: COLORS.textSecondary },
  qualityTextPremium: { color: '#C4B5FD' },
  qualityTextStandard: { color: COLORS.accentGreen },
  refreshBtn: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.25)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshText: {
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  screenHeader: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  stateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderBottomColor: COLORS.accentGreen,
  },
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  tabContent: {
    padding: 16,
    paddingBottom: 32,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: COLORS.accentGreen,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  urgencyCritical: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  urgencyHigh: {
    backgroundColor: 'rgba(251,146,60,0.12)',
    borderColor: 'rgba(251,146,60,0.25)',
  },
  urgencyNormal: {
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderColor: 'rgba(96,165,250,0.25)',
  },
  urgencyTextCritical: { color: COLORS.danger },
  urgencyTextHigh: { color: '#FB923C' },
  urgencyTextNormal: { color: COLORS.info },
});
