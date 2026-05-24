import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  Package,
  Users,
  DollarSign,
  MapPin,
  Calendar,
  X,
  Send,
  Plus,
  Truck,
  Map,
} from 'lucide-react-native';

import { useTradeOperations } from './hooks/useTradeOperations';
import { TransportMapModal } from './components/TransportMapModal';
import type { BuyListing, MatchingSeller } from '@services/tradeOperationService';
import { GlassCard, GlassBadge, GlassButton, GlassInput } from '@design-system';
import { COLORS } from '@design-system';

const DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 6 };

export default function OperationsScreen() {
  const {
    buyListings,
    tradeOperations: _tradeOperations,
    currentTradeOperation,
    matchingSellers,
    profitCalculation,
    transportEstimate,
    isLoadingBuyListings,
    isLoadingMatchingSellers,
    isCreatingTrade,
    isEstimatingTransport,
    isSendingOffers,
    loadBuyListings,
    createTradeOperation,
    findMatchingSellers,
    selectSellers,
    calculateProfit,
    estimateTransportCost,
    sendBulkOffers,
    error,
    clearError,
  } = useTradeOperations();

  const [activeView, setActiveView] = useState('buy-listings');
  const [selectedBuyListing, setSelectedBuyListing] = useState<BuyListing | null>(null);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [targetProfitMargin, setTargetProfitMargin] = useState('7.5');
  const [showTradeCreationModal, setShowTradeCreationModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showTransportMapModal, setShowTransportMapModal] = useState(false);
  const [negotiationPrices, setNegotiationPrices] = useState({
    buyer: '',
    sellers: {} as Record<string, string>,
  });

  const handleCreateTrade = async () => {
    if (!selectedBuyListing) {
      Alert.alert('Error', 'Please select a buy listing first');
      return;
    }
    const targetMargin = parseFloat(targetProfitMargin);
    if (isNaN(targetMargin) || targetMargin < 5 || targetMargin > 15) {
      Alert.alert('Error', 'Target profit margin must be between 5% and 15%');
      return;
    }
    const tradeOp = await createTradeOperation(selectedBuyListing.id, targetMargin);
    if (tradeOp) {
      setShowTradeCreationModal(false);
      setActiveView('current-trade');
      await findMatchingSellers(tradeOp.id, 200);
    }
  };

  const handleSellerToggle = (sellerId: string) => {
    setSelectedSellers((prev) =>
      prev.includes(sellerId) ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]
    );
  };

  const handleAddSellers = async () => {
    if (!currentTradeOperation || selectedSellers.length === 0) {
      Alert.alert('Error', 'Please select sellers first');
      return;
    }
    const sellersToAdd = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((s) => s.sellerId === sellerId);
        if (!seller) return null;
        return {
          sellerId: seller.sellerId,
          saleListingId: seller.saleListingId,
          requestedQuantity: Math.min(
            seller.availability,
            currentTradeOperation.buyListing?.quantity || 0
          ),
        };
      })
      .filter(Boolean) as any[];
    const success = await selectSellers(currentTradeOperation.id, sellersToAdd);
    if (success) {
      setSelectedSellers([]);
      await calculateProfit(currentTradeOperation.id);
    }
  };

  const handleSendOffers = async () => {
    if (!currentTradeOperation) return;
    const buyerPrice = parseFloat(negotiationPrices.buyer);
    if (isNaN(buyerPrice)) {
      Alert.alert('Error', 'Please enter a valid buyer price');
      return;
    }
    const sellerOffers = Object.entries(negotiationPrices.sellers)
      .map(([sellerId, price]) => ({
        sellerId,
        price: parseFloat(price),
        quantity:
          currentTradeOperation.selectedSellers?.find((s) => s.sellerId === sellerId)
            ?.requestedQuantity || 0,
      }))
      .filter((offer) => !isNaN(offer.price) && offer.quantity > 0);
    if (sellerOffers.length === 0) {
      Alert.alert('Error', 'Please enter prices for all selected sellers');
      return;
    }
    const success = await sendBulkOffers({
      tradeOperationId: currentTradeOperation.id,
      buyerOffer: { price: buyerPrice },
      sellerOffers,
    });
    if (success) {
      setShowNegotiationModal(false);
      setNegotiationPrices({ buyer: '', sellers: {} });
    }
  };

  const handleEstimateTransport = async () => {
    if (
      !currentTradeOperation ||
      !currentTradeOperation.selectedSellers ||
      !currentTradeOperation.buyListing?.deliveryAddress
    ) {
      Alert.alert('Error', 'Missing seller or delivery information');
      return;
    }
    const origin = { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' };
    const destination = {
      latitude: currentTradeOperation.buyListing?.deliveryAddress?.latitude || 41.8781,
      longitude: currentTradeOperation.buyListing?.deliveryAddress?.longitude || -87.6298,
      address: currentTradeOperation.buyListing?.deliveryAddress?.address || 'Chicago, IL',
    };
    const pickupLocations = currentTradeOperation.selectedSellers.map((seller, index) => ({
      latitude: 42.0 + index * 0.1,
      longitude: -93.0 + index * 0.1,
      address: seller.saleListing?.address?.address || `Farm ${index + 1}`,
      quantity: seller.requestedQuantity,
    }));
    await estimateTransportCost({
      origin,
      pickupLocations,
      destination,
      quantity: currentTradeOperation.buyListing.quantity,
      vehicleType: 'TRUCK',
    });
  };

  const handleViewTransportMap = () => {
    if (!currentTradeOperation || !transportEstimate) {
      Alert.alert('Error', 'Please estimate transport cost first');
      return;
    }
    setShowTransportMapModal(true);
  };

  const TABS = [
    { id: 'buy-listings', label: 'Buy Orders', count: buyListings.length },
    { id: 'matching-sellers', label: 'Sellers', count: matchingSellers.length },
    { id: 'current-trade', label: 'Active Trade', count: currentTradeOperation ? 1 : 0 },
  ];

  const getStatusVariant = (status: string): 'success' | 'info' | 'muted' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      default:
        return 'muted';
    }
  };

  const renderBuyListingCard = (listing: BuyListing) => {
    const isSelected = selectedBuyListing?.id === listing.id;
    return (
      <TouchableOpacity
        key={listing.id}
        onPress={() => setSelectedBuyListing(listing)}
        activeOpacity={0.7}
      >
        <GlassCard
          tier={isSelected ? 'strong' : 'subtle'}
          style={styles.listingCard}
          animate={false}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardProductName}>{listing.product?.name || 'Unknown Product'}</Text>
            <GlassBadge label={listing.status || ''} variant="info" size="sm" />
          </View>
          <Text style={styles.cardSecondary}>{listing.buyer?.name || 'Unknown Buyer'}</Text>
          <Text style={styles.cardSecondary}>
            {listing.quantity} {listing.unit}
          </Text>
          <View style={styles.cardBottomRow}>
            <Text style={styles.goldPrice}>
              ${listing.maxPricePerUnit}/{listing.unit}
            </Text>
            {listing.neededBy && (
              <View style={styles.dateRow}>
                <Calendar size={12} color={COLORS.textMuted} />
                <Text style={styles.dateText}>
                  {new Date(listing.neededBy).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderMatchingSellerCard = (seller: MatchingSeller) => {
    const isSelected = selectedSellers.includes(seller.sellerId);
    return (
      <TouchableOpacity
        key={seller.sellerId}
        onPress={() => handleSellerToggle(seller.sellerId)}
        activeOpacity={0.7}
      >
        <GlassCard
          tier={isSelected ? 'strong' : 'subtle'}
          style={styles.listingCard}
          animate={false}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardProductName}>
              {seller.saleListing?.seller?.name || 'Unknown Seller'}
            </Text>
            <GlassBadge label={`Match: ${seller.matchScore}%`} variant="warning" size="sm" />
          </View>
          <Text style={styles.cardSecondary}>
            {seller.saleListing?.product?.name || 'Unknown Product'}
          </Text>
          <Text style={styles.cardSecondary}>
            {seller.availability} {seller.saleListing?.unit || ''} available
          </Text>
          <View style={styles.cardBottomRow}>
            <Text style={styles.goldPrice}>
              ${seller.askingPrice}/{seller.saleListing?.unit || 'unit'}
            </Text>
            <View style={styles.dateRow}>
              <MapPin size={12} color={COLORS.textMuted} />
              <Text style={styles.dateText}>{seller.distance}km away</Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <GlassCard tier="subtle" style={styles.header} animate={false}>
        <Text style={styles.headerTitle}>Trade Operations</Text>
        <Text style={styles.headerSub}>Real-time trading management</Text>
      </GlassCard>

      {/* Error */}
      {error && (
        <GlassCard tier="subtle" style={styles.errorCard} animate={false}>
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <X size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeView === tab.id && styles.tabActive]}
            onPress={() => setActiveView(tab.id)}
          >
            <Text style={[styles.tabText, activeView === tab.id && styles.tabTextActive]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeView === 'buy-listings' && (
          <View style={styles.section}>
            <View style={styles.sectionTopRow}>
              <Text style={styles.sectionHeading}>Active Buy Listings</Text>
              <GlassButton
                label={isLoadingBuyListings ? 'Loading...' : 'Refresh'}
                onPress={loadBuyListings}
                disabled={isLoadingBuyListings}
                variant="secondary"
                size="sm"
                loading={isLoadingBuyListings}
              />
            </View>
            {isLoadingBuyListings ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.accentGreen} />
              </View>
            ) : (
              buyListings.map(renderBuyListingCard)
            )}
            {selectedBuyListing && (
              <GlassButton
                label="Create Trade Operation"
                onPress={() => setShowTradeCreationModal(true)}
                variant="primary"
                fullWidth
                leftIcon={<Plus size={18} color="#fff" />}
                style={styles.actionBtn}
              />
            )}
          </View>
        )}

        {activeView === 'matching-sellers' && (
          <View style={styles.section}>
            <View style={styles.sectionTopRow}>
              <Text style={styles.sectionHeading}>Matching Sellers</Text>
              {currentTradeOperation && (
                <GlassButton
                  label={isLoadingMatchingSellers ? 'Finding...' : 'Find Sellers'}
                  onPress={() => findMatchingSellers(currentTradeOperation.id, 200)}
                  disabled={isLoadingMatchingSellers}
                  variant="secondary"
                  size="sm"
                  loading={isLoadingMatchingSellers}
                />
              )}
            </View>
            {!currentTradeOperation ? (
              <GlassCard tier="subtle" animate={false}>
                <Text style={styles.infoText}>
                  Create a trade operation first to find matching sellers
                </Text>
              </GlassCard>
            ) : isLoadingMatchingSellers ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.accentGreen} />
              </View>
            ) : (
              <>
                {matchingSellers.map(renderMatchingSellerCard)}
                {selectedSellers.length > 0 && (
                  <GlassButton
                    label={`Add ${selectedSellers.length} Seller(s)`}
                    onPress={handleAddSellers}
                    variant="primary"
                    fullWidth
                    leftIcon={<Users size={18} color="#fff" />}
                    style={styles.actionBtn}
                  />
                )}
              </>
            )}
          </View>
        )}

        {activeView === 'current-trade' && (
          <View style={styles.section}>
            {!currentTradeOperation ? (
              <GlassCard tier="subtle" animate={false} style={styles.emptyCard}>
                <Package size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Active Trade</Text>
                <Text style={styles.emptyText}>Create a trade operation to get started</Text>
              </GlassCard>
            ) : (
              <>
                <GlassCard tier="medium" animate={false} style={styles.listingCard}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardProductName}>
                      {currentTradeOperation.operationNumber}
                    </Text>
                    <GlassBadge
                      label={currentTradeOperation.status}
                      variant={getStatusVariant(currentTradeOperation.status)}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.cardSecondary}>
                    Product: {currentTradeOperation.buyListing?.product?.name || 'N/A'}
                  </Text>
                  <Text style={styles.cardSecondary}>
                    Buyer: {currentTradeOperation.buyListing?.buyer?.name || 'N/A'}
                  </Text>
                  <Text style={styles.cardSecondary}>
                    Quantity: {currentTradeOperation.buyListing?.quantity || 0}{' '}
                    {currentTradeOperation.buyListing?.unit || ''}
                  </Text>
                  <Text style={styles.mutedSmall}>
                    Target Margin: {currentTradeOperation.targetProfitMargin}%
                  </Text>
                </GlassCard>

                {/* Profit Summary */}
                {profitCalculation && (
                  <GlassCard tier="subtle" animate={false} style={styles.listingCard}>
                    <Text style={styles.sectionHeading}>Profit Analysis</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.cardSecondary}>Revenue:</Text>
                      <Text style={styles.goldPrice}>
                        ${(profitCalculation.revenue?.totalRevenue ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.cardSecondary}>Total Costs:</Text>
                      <Text style={styles.cardSecondary}>
                        ${(profitCalculation.costs?.totalCosts ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={DIVIDER} />
                    <View style={styles.metaRow}>
                      <Text style={styles.cardSecondary}>Net Profit:</Text>
                      <Text style={styles.goldPrice}>
                        ${(profitCalculation.profit?.netProfit ?? 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.cardSecondary}>Profit Margin:</Text>
                      <Text
                        style={[
                          styles.goldPrice,
                          {
                            color: profitCalculation.profit?.meetsMinimumMargin
                              ? COLORS.accentGreen
                              : COLORS.danger,
                          },
                        ]}
                      >
                        {(profitCalculation.profit?.profitMargin ?? 0).toFixed(1)}%
                      </Text>
                    </View>
                  </GlassCard>
                )}

                {/* Transport Summary */}
                {transportEstimate && (
                  <GlassCard tier="subtle" animate={false} style={styles.listingCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.dateRow}>
                        <Truck size={18} color={COLORS.info} />
                        <Text style={styles.sectionHeading}>Transport Estimate</Text>
                      </View>
                      <TouchableOpacity onPress={handleViewTransportMap} style={styles.mapBtn}>
                        <Map size={12} color={COLORS.info} />
                        <Text style={styles.mapBtnText}>View Map</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.cardSecondary}>Distance:</Text>
                      <Text style={styles.cardPrimary}>{transportEstimate.distance} km</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.cardSecondary}>Duration:</Text>
                      <Text style={styles.cardPrimary}>
                        {Math.round((transportEstimate.duration ?? 0) / 60)} hours
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={styles.cardSecondary}>Transport Cost:</Text>
                      <Text style={styles.goldPrice}>
                        ${(transportEstimate.costs?.totalCost ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </GlassCard>
                )}

                {/* Estimate transport button */}
                {currentTradeOperation.selectedSellers &&
                  currentTradeOperation.selectedSellers.length > 0 && (
                    <GlassButton
                      label={isEstimatingTransport ? 'Estimating...' : 'Estimate Transport'}
                      onPress={handleEstimateTransport}
                      disabled={isEstimatingTransport}
                      loading={isEstimatingTransport}
                      variant="secondary"
                      fullWidth
                      leftIcon={<Truck size={16} color={COLORS.textPrimary} />}
                      style={styles.actionBtn}
                    />
                  )}

                {/* Selected sellers */}
                {currentTradeOperation.selectedSellers &&
                  currentTradeOperation.selectedSellers.length > 0 && (
                    <GlassCard tier="subtle" animate={false} style={styles.listingCard}>
                      <Text style={styles.sectionHeading}>Selected Sellers</Text>
                      {currentTradeOperation.selectedSellers.map((seller) => (
                        <View
                          key={seller.id}
                          style={[
                            styles.metaRow,
                            {
                              borderBottomWidth: 1,
                              borderBottomColor: 'rgba(255,255,255,0.06)',
                              paddingVertical: 8,
                            },
                          ]}
                        >
                          <Text style={styles.cardPrimary}>
                            {seller.saleListing?.seller?.name || 'Seller'}
                          </Text>
                          <Text style={styles.goldPrice}>
                            {seller.requestedQuantity} {seller.saleListing?.unit || ''}
                          </Text>
                        </View>
                      ))}
                    </GlassCard>
                  )}

                <GlassButton
                  label="Send Offers"
                  onPress={() => setShowNegotiationModal(true)}
                  variant="primary"
                  fullWidth
                  leftIcon={<Send size={18} color="#fff" />}
                  disabled={
                    !currentTradeOperation.selectedSellers ||
                    currentTradeOperation.selectedSellers.length === 0
                  }
                  style={styles.actionBtn}
                />
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Trade Creation Modal */}
      <Modal
        visible={showTradeCreationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTradeCreationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard tier="strong" style={styles.bottomSheet} animate={false}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Create Trade Operation</Text>
              <TouchableOpacity onPress={() => setShowTradeCreationModal(false)}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedBuyListing && (
              <>
                <GlassCard tier="subtle" animate={false} style={{ marginBottom: 12 }}>
                  <Text style={styles.cardSecondary}>Selected Buy Listing:</Text>
                  <Text style={styles.cardPrimary}>
                    {selectedBuyListing.product?.name || 'Unknown'} -{' '}
                    {selectedBuyListing.buyer?.name || 'Unknown'}
                  </Text>
                  <Text style={styles.cardSecondary}>
                    {selectedBuyListing.quantity} {selectedBuyListing.unit} @ $
                    {selectedBuyListing.maxPricePerUnit}/{selectedBuyListing.unit}
                  </Text>
                </GlassCard>
                <GlassInput
                  label="Target Profit Margin (%)"
                  value={targetProfitMargin}
                  onChangeText={setTargetProfitMargin}
                  placeholder="7.5"
                  keyboardType="numeric"
                  leftIcon={<DollarSign size={16} color={COLORS.textMuted} />}
                  containerStyle={{ marginBottom: 4 }}
                />
                <Text style={styles.hintText}>Minimum: 5%, Maximum: 15%</Text>
                <GlassButton
                  label={isCreatingTrade ? 'Creating...' : 'Create Trade'}
                  onPress={handleCreateTrade}
                  disabled={isCreatingTrade}
                  loading={isCreatingTrade}
                  variant="primary"
                  fullWidth
                  leftIcon={<Plus size={18} color="#fff" />}
                  style={{ marginTop: 12 }}
                />
              </>
            )}
          </GlassCard>
        </View>
      </Modal>

      {/* Negotiation Modal */}
      <Modal
        visible={showNegotiationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNegotiationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard tier="strong" style={styles.bottomSheet} animate={false}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Send Offers</Text>
              <TouchableOpacity onPress={() => setShowNegotiationModal(false)}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {currentTradeOperation && (
                <>
                  <GlassInput
                    label="Buyer Offer Price"
                    value={negotiationPrices.buyer}
                    onChangeText={(value) =>
                      setNegotiationPrices((prev) => ({ ...prev, buyer: value }))
                    }
                    placeholder={`${currentTradeOperation.buyListing?.maxPricePerUnit ?? 0}`}
                    keyboardType="numeric"
                    leftIcon={<DollarSign size={16} color={COLORS.textMuted} />}
                  />
                  {currentTradeOperation.selectedSellers?.map((seller) => (
                    <View key={seller.id}>
                      <GlassInput
                        label={`${seller.saleListing?.seller?.name || 'Seller'} - Offer Price`}
                        value={negotiationPrices.sellers[seller.sellerId] || ''}
                        onChangeText={(value) =>
                          setNegotiationPrices((prev) => ({
                            ...prev,
                            sellers: { ...prev.sellers, [seller.sellerId]: value },
                          }))
                        }
                        placeholder={`${seller.saleListing?.askingPrice || ''}`}
                        keyboardType="numeric"
                        leftIcon={<DollarSign size={16} color={COLORS.textMuted} />}
                      />
                      <Text style={styles.hintText}>
                        Asking: ${seller.saleListing?.askingPrice || 0}/
                        {seller.saleListing?.unit || ''}
                      </Text>
                    </View>
                  ))}
                  <GlassButton
                    label={isSendingOffers ? 'Sending...' : 'Send All Offers'}
                    onPress={handleSendOffers}
                    disabled={isSendingOffers}
                    loading={isSendingOffers}
                    variant="primary"
                    fullWidth
                    leftIcon={<Send size={18} color="#fff" />}
                    style={{ marginTop: 12 }}
                  />
                </>
              )}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* Transport Map Modal */}
      <TransportMapModal
        visible={showTransportMapModal}
        onClose={() => setShowTransportMapModal(false)}
        tradeOperation={currentTradeOperation}
        transportEstimate={transportEstimate}
        onConfirmRoute={() => {
          Alert.alert('Success', 'Transport route confirmed');
          setShowTransportMapModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorCard: { marginHorizontal: 16, marginTop: 8 },
  header: { margin: 16, marginBottom: 0 },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  root: { backgroundColor: 'transparent', flex: 1 },
  // eslint-disable-next-line react-native/sort-styles
  errorRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  errorText: { color: COLORS.danger, flex: 1, fontSize: 13, marginRight: 8 },
  tabsRow: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginTop: 12 },
  tab: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  tabActive: { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.3)' },
  tabText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: COLORS.accentGreen },
  content: { flex: 1, padding: 16 },
  section: { gap: 12 },
  sectionTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionHeading: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  listingCard: { marginBottom: 0 },
  cardTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardProductName: {
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  cardPrimary: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  cardSecondary: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 2 },
  goldPrice: { color: COLORS.accentGold, fontFamily: 'monospace', fontSize: 13, fontWeight: '800' },
  mutedSmall: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  dateRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  dateText: { color: COLORS.textMuted, fontSize: 11 },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loader: { alignItems: 'center', paddingVertical: 40 },
  actionBtn: { marginTop: 4 },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyText: { color: COLORS.textSecondary, fontSize: 13 },
  infoText: { color: COLORS.textSecondary, fontSize: 13 },
  mapBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mapBtnText: { color: COLORS.info, fontSize: 12, fontWeight: '600' },
  hintText: { color: COLORS.textMuted, fontSize: 11, marginBottom: 8 },
  // Modal
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', flex: 1, justifyContent: 'flex-end' },
  bottomSheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
});
