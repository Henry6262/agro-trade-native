import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  X,
  ChevronRight,
  Package,
  Users,
  Truck,
  DollarSign,
  Send,
  CheckCircle,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react-native';
import { TransportMapView } from './TransportMapView';
import { OfferModal } from './OfferModal';
import type {
  BuyListing,
  TradeOperation,
  MatchingSeller,
  ProfitCalculation,
  TransportEstimate,
} from '@services/tradeOperationService';
import { GlassCard, GlassBadge, GlassButton, GlassInput } from '../../../../../design-system';
import { COLORS } from '../../../../../design-system';

const { height: screenHeight } = Dimensions.get('window');
const DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 };

interface TradeCreationDrawerProps {
  visible: boolean;
  onClose: () => void;
  buyListing: BuyListing | null;
  onTradeCreated?: (trade: TradeOperation) => void;
  findMatchingSellers: (tradeId: string, maxDistance?: number) => Promise<void>;
  createTradeOperation: (
    buyListingId: string,
    targetMargin: number
  ) => Promise<TradeOperation | null>;
  selectSellers: (tradeId: string, sellers: any[]) => Promise<boolean>;
  calculateProfit: (tradeId: string) => Promise<void>;
  refreshCurrentTrade?: (tradeId: string) => Promise<void>;
  estimateTransportCost: (params: any) => Promise<void>;
  sendBulkOffers: (params: any) => Promise<boolean>;
  currentTradeOperation?: TradeOperation | null;
  matchingSellers: MatchingSeller[];
  profitCalculation: ProfitCalculation | null;
  transportEstimate: TransportEstimate | null;
  isLoadingMatchingSellers: boolean;
  isCalculatingProfit: boolean;
  isEstimatingTransport: boolean;
  isSendingOffers: boolean;
}

const STEPS = [
  { id: 1, title: 'Review Order', icon: Package },
  { id: 2, title: 'Find Sellers', icon: Users },
  { id: 3, title: 'Plan Transport', icon: Truck },
  { id: 4, title: 'Calculate Profit', icon: TrendingUp },
  { id: 5, title: 'Send Offers', icon: Send },
];

export const TradeCreationDrawer: React.FC<TradeCreationDrawerProps> = ({
  visible,
  onClose,
  buyListing,
  onTradeCreated,
  findMatchingSellers,
  createTradeOperation,
  selectSellers,
  calculateProfit,
  refreshCurrentTrade,
  estimateTransportCost,
  sendBulkOffers,
  currentTradeOperation,
  matchingSellers,
  profitCalculation,
  transportEstimate,
  isLoadingMatchingSellers,
  isCalculatingProfit,
  isEstimatingTransport,
  isSendingOffers,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [localTradeOperation, setLocalTradeOperation] = useState<TradeOperation | null>(null);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const tradeOperation = currentTradeOperation || localTradeOperation;
  const [targetMargin, setTargetMargin] = useState('7.5');
  const [offerPrices, setOfferPrices] = useState<{
    buyer: string;
    sellers: Record<string, string>;
  }>({ buyer: '', sellers: {} });
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedSellerForOffer, setSelectedSellerForOffer] = useState<
    MatchingSeller | null | undefined
  >(null);

  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      setLocalTradeOperation(null);
      setSelectedSellers([]);
      setTargetMargin('7.5');
      setOfferPrices({ buyer: '', sellers: {} });
    }
  }, [visible]);

  const handleCreateTrade = async () => {
    if (!buyListing) return;
    if (!buyListing.id) {
      Alert.alert('Error', 'Buy listing ID is missing');
      return;
    }
    const margin = parseFloat(targetMargin);
    if (isNaN(margin) || margin < 5 || margin > 15) {
      Alert.alert('Error', 'Target margin must be between 5% and 15%');
      return;
    }
    setIsCreatingTrade(true);
    const trade = await createTradeOperation(buyListing.id, margin);
    if (trade) {
      setLocalTradeOperation(trade);
      Alert.alert(
        'Success',
        'Trade operation created! You can now select sellers and send offers.'
      );
      setCurrentStep(2);
      await findMatchingSellers(trade.id, 200);
    }
    setIsCreatingTrade(false);
  };

  const handleSelectSellers = async () => {
    if (!tradeOperation || selectedSellers.length === 0) {
      Alert.alert('Error', 'Please select at least one seller');
      return;
    }
    const buyerQuantity = Number(buyListing?.quantity) || 0;
    let remainingQuantity = buyerQuantity;
    const sellersToAdd = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((s) => s.sellerId === sellerId);
        if (!seller || remainingQuantity <= 0) return null;
        const sellerAvailability = Number(seller.availability) || 0;
        const requestedQty = Math.min(sellerAvailability, remainingQuantity);
        remainingQuantity -= requestedQty;
        return {
          sellerId: seller.sellerId,
          saleListingId: seller.saleListingId,
          requestedQuantity: requestedQty,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null && s.requestedQuantity > 0);
    const success = await selectSellers(tradeOperation.id, sellersToAdd);
    if (success) {
      if (refreshCurrentTrade) await refreshCurrentTrade(tradeOperation.id);
      setCurrentStep(3);
      await handleEstimateTransport();
    }
  };

  const handleEstimateTransport = async () => {
    if (!tradeOperation || !buyListing) return;
    const origin = { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' };
    const destination = {
      latitude: buyListing.deliveryAddress?.latitude || 41.8781,
      longitude: buyListing.deliveryAddress?.longitude || -87.6298,
      address: buyListing.deliveryAddress?.address || 'Chicago, IL',
    };
    const pickupLocations = selectedSellers.map((sellerId, index) => {
      const seller = matchingSellers.find((s) => s.sellerId === sellerId);
      return {
        latitude: 42.0 + index * 0.1,
        longitude: -93.0 + index * 0.1,
        address: seller?.saleListing.address?.address || `Farm ${index + 1}`,
        quantity: seller?.availability || 0,
      };
    });
    await estimateTransportCost({
      origin,
      pickupLocations,
      destination,
      quantity: buyListing.quantity,
      vehicleType: 'TRUCK',
    });
    await calculateProfit(tradeOperation.id);
    setCurrentStep(4);
  };

  const handleSendOffers = async () => {
    if (!tradeOperation || !buyListing) return;
    const buyerPrice = parseFloat(offerPrices.buyer || buyListing.maxPricePerUnit.toString());
    const sellerOffers = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((s) => s.sellerId === sellerId);
        return {
          sellerId,
          price: parseFloat(offerPrices.sellers[sellerId] || seller?.askingPrice.toString() || '0'),
          quantity: seller?.availability || 0,
        };
      })
      .filter((o) => o.price > 0);
    const success = await sendBulkOffers({
      tradeOperationId: tradeOperation.id,
      buyerOffer: { price: buyerPrice },
      sellerOffers,
    });
    if (success) {
      Alert.alert('Success', 'Trade operation created and offers sent!');
      onTradeCreated?.(tradeOperation);
      onClose();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!buyListing;
      case 2:
        return selectedSellers.length > 0;
      case 3:
        return !!transportEstimate;
      case 4:
        return !!profitCalculation;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    switch (currentStep) {
      case 1:
        await handleCreateTrade();
        break;
      case 2:
        await handleSelectSellers();
        break;
      case 3:
        setCurrentStep(4);
        break;
      case 4:
        setCurrentStep(5);
        break;
      case 5:
        await handleSendOffers();
        break;
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepBar}>
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        return (
          <View key={step.id} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                isActive && styles.stepActive,
                isCompleted && styles.stepCompleted,
              ]}
            >
              {isCompleted ? (
                <CheckCircle size={14} color="#fff" />
              ) : (
                <Icon size={14} color="#fff" />
              )}
            </View>
            <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.title}</Text>
            {index < STEPS.length - 1 && <ChevronRight size={13} color={COLORS.textMuted} />}
          </View>
        );
      })}
    </View>
  );

  const renderReviewStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Buy Order & Create Trade</Text>
      {!tradeOperation && (
        <GlassCard
          tier="subtle"
          animate={false}
          style={{ borderColor: 'rgba(96,165,250,0.2)', marginBottom: 16 }}
        >
          <Text style={[styles.infoLabel, { color: COLORS.info }]}>Important</Text>
          <Text style={styles.infoBody}>
            Clicking &quot;Create Trade &amp; Continue&quot; will create a trade operation with your
            specified margin. You&apos;ll then be able to select sellers and send offers
            immediately.
          </Text>
        </GlassCard>
      )}
      {buyListing && (
        <GlassCard tier="subtle" animate={false}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Product</Text>
            <Text style={styles.fieldValue}>{buyListing.product?.name || 'Unknown Product'}</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Buyer</Text>
            <Text style={styles.fieldValue}>{buyListing.buyer?.name || 'Unknown Buyer'}</Text>
            {buyListing.deliveryAddress && (
              <View style={styles.locationRow}>
                <MapPin size={11} color={COLORS.textMuted} />
                <Text style={styles.locationText}>
                  {buyListing.deliveryAddress.city ||
                    buyListing.deliveryAddress.address ||
                    'Delivery location set'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <Text style={styles.fieldValue}>
                {buyListing.quantity} {buyListing.unit || 'TON'}
              </Text>
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Max Price</Text>
              <Text style={styles.goldPrice}>
                ${buyListing.maxPricePerUnit}/{buyListing.unit || 'TON'}
              </Text>
            </View>
          </View>
          {buyListing.neededBy && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Needed By</Text>
              <View style={styles.locationRow}>
                <Calendar size={14} color={COLORS.textMuted} />
                <Text style={styles.fieldValue}>
                  {new Date(buyListing.neededBy).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
          <View style={DIVIDER} />
          <GlassInput
            label="Target Profit Margin (%)"
            value={targetMargin}
            onChangeText={setTargetMargin}
            placeholder="7.5"
            keyboardType="numeric"
            leftIcon={<TrendingUp size={15} color={COLORS.textMuted} />}
            containerStyle={{ marginBottom: 4 }}
          />
          <Text style={styles.hintText}>Minimum: 5%, Maximum: 15%</Text>
        </GlassCard>
      )}
    </ScrollView>
  );

  const renderSellerSelectionStep = () => {
    const buyerQuantity = Number(buyListing?.quantity) || 0;
    let remainingNeeded = buyerQuantity;
    const sellerQuantities: { [key: string]: number } = {};
    let totalSelectedQuantity = 0;
    selectedSellers.forEach((sellerId) => {
      const seller = matchingSellers.find((s) => s.sellerId === sellerId);
      if (seller && remainingNeeded > 0) {
        const available = Number(seller.availability) || 0;
        const taking = Math.min(available, remainingNeeded);
        sellerQuantities[sellerId] = taking;
        totalSelectedQuantity += taking;
        remainingNeeded -= taking;
      }
    });
    const progressPercentage =
      buyerQuantity > 0 ? (totalSelectedQuantity / buyerQuantity) * 100 : 0;

    return (
      <View style={styles.stepContentFull}>
        <View style={styles.sellerHeader}>
          <GlassCard tier="subtle" animate={false}>
            <View style={styles.progressTopRow}>
              <GlassBadge
                label={`${totalSelectedQuantity} / ${buyerQuantity} TON`}
                variant={progressPercentage >= 100 ? 'success' : 'warning'}
              />
              <Text style={styles.goldPrice}>Max: ${buyListing?.maxPricePerUnit}/TON</Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(progressPercentage, 100)}%`,
                    backgroundColor: progressPercentage >= 100 ? COLORS.accentGreen : COLORS.info,
                  },
                ]}
              />
            </View>
          </GlassCard>
        </View>
        <ScrollView style={styles.sellerList} showsVerticalScrollIndicator={false}>
          {isLoadingMatchingSellers ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color={COLORS.accentGreen} />
              <Text style={styles.loaderText}>Finding matching sellers...</Text>
            </View>
          ) : (
            <>
              {matchingSellers.map((seller) => {
                const isSelected = selectedSellers.includes(seller.sellerId);
                const actualQuantity = sellerQuantities[seller.sellerId] || 0;
                const available = Number(seller.availability) || 0;
                const isPartialUse = isSelected && actualQuantity < available;
                return (
                  <TouchableOpacity
                    key={seller.sellerId}
                    onPress={() =>
                      setSelectedSellers((prev) =>
                        prev.includes(seller.sellerId)
                          ? prev.filter((id) => id !== seller.sellerId)
                          : [...prev, seller.sellerId]
                      )
                    }
                    activeOpacity={0.8}
                    style={{ marginBottom: 10 }}
                  >
                    <GlassCard tier={isSelected ? 'medium' : 'subtle'} animate={false}>
                      <View style={styles.sellerTopRow}>
                        <View style={styles.sellerNameCol}>
                          <Text style={styles.sellerName}>
                            {seller.saleListing?.seller?.name || 'Unknown Seller'}
                          </Text>
                          <View style={styles.locationRow}>
                            <MapPin size={10} color={COLORS.textMuted} />
                            <Text style={styles.locationText}>
                              {seller.location?.city
                                ? `${seller.location.city} • ${seller.distance}km`
                                : 'Location N/A'}
                            </Text>
                          </View>
                        </View>
                        <GlassBadge
                          label={`Match: ${seller.matchScore}%`}
                          variant="warning"
                          size="sm"
                        />
                      </View>
                      <Text style={styles.sellerAvailable}>
                        {seller.availability} {seller.saleListing?.unit || 'TON'} available
                      </Text>
                      {isSelected && (
                        <Text
                          style={[
                            styles.sellerTaking,
                            { color: isPartialUse ? COLORS.accentGold : COLORS.accentGreen },
                          ]}
                        >
                          {isPartialUse
                            ? `Taking only ${actualQuantity} TON (partial)`
                            : `Taking all ${actualQuantity} TON`}
                        </Text>
                      )}
                      <View style={styles.sellerBottomRow}>
                        <Text style={styles.goldPrice}>
                          ${seller.askingPrice}/{seller.saleListing?.unit || 'TON'}
                        </Text>
                        {isSelected && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedSellerForOffer(seller);
                              setShowOfferModal(true);
                            }}
                            style={styles.sendOfferBtn}
                          >
                            <Text style={styles.sendOfferBtnText}>Send Offer</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
              {matchingSellers.length === 0 && (
                <View style={styles.loaderCenter}>
                  <Text style={styles.loaderText}>No matching sellers found</Text>
                  <Text style={styles.hintText}>Try refreshing or adjusting criteria</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderTransportStep = () => {
    if (!tradeOperation || !buyListing) return null;
    const route = transportEstimate
      ? {
          origin: { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' },
          pickupLocations: selectedSellers.map((sellerId, index) => {
            const seller = matchingSellers.find((s) => s.sellerId === sellerId);
            return {
              sellerId,
              sellerName: seller?.saleListing?.seller?.name || 'Seller',
              latitude: 42.0 + index * 0.15,
              longitude: -93.0 + index * 0.15,
              address: seller?.saleListing.address?.address || `Farm ${index + 1}`,
              quantity: seller?.availability || 0,
              product: seller?.saleListing?.product?.name || 'Product',
            };
          }),
          destination: {
            latitude: buyListing.deliveryAddress?.latitude || 41.8781,
            longitude: buyListing.deliveryAddress?.longitude || -87.6298,
            address: buyListing.deliveryAddress?.address || 'Chicago, IL',
          },
          totalDistance: transportEstimate?.distance,
          estimatedDuration: transportEstimate?.duration,
          estimatedCost: transportEstimate?.costs.totalCost,
        }
      : null;

    return (
      <View style={styles.stepContentFull}>
        {isEstimatingTransport ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={COLORS.accentGreen} />
            <Text style={styles.loaderText}>Estimating transport...</Text>
          </View>
        ) : route ? (
          <>
            <TransportMapView route={route} height={screenHeight * 0.35} showDetails={false} />
            <ScrollView style={styles.transportDetails}>
              <GlassCard tier="subtle" animate={false}>
                <Text style={styles.stepTitle}>Transport Summary</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Distance:</Text>
                  <Text style={styles.metaValue}>{transportEstimate?.distance} km</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Duration:</Text>
                  <Text style={styles.metaValue}>
                    {transportEstimate?.duration ? Math.round(transportEstimate.duration / 60) : 0}{' '}
                    hours
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Pickup Stops:</Text>
                  <Text style={styles.metaValue}>{selectedSellers.length}</Text>
                </View>
                <View style={DIVIDER} />
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Transport Cost:</Text>
                  <Text style={styles.goldPrice}>
                    ${transportEstimate?.costs?.totalCost?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </GlassCard>
            </ScrollView>
          </>
        ) : (
          <View style={styles.loaderCenter}>
            <Truck size={44} color={COLORS.textMuted} />
            <Text style={styles.loaderText}>Transport estimation pending...</Text>
          </View>
        )}
      </View>
    );
  };

  const renderProfitStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Profit Analysis</Text>
      {isCalculatingProfit ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={COLORS.accentGreen} />
          <Text style={styles.loaderText}>Calculating profit...</Text>
        </View>
      ) : profitCalculation ? (
        <>
          <GlassCard tier="subtle" animate={false} style={{ marginBottom: 12 }}>
            <Text style={styles.subSectionLabel}>Revenue Breakdown</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Selling Price:</Text>
              <Text style={styles.metaValue}>
                ${profitCalculation.revenue.sellingPrice.toFixed(2)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Quantity:</Text>
              <Text style={styles.metaValue}>{profitCalculation.revenue.quantity} units</Text>
            </View>
            <View style={DIVIDER} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Total Revenue:</Text>
              <Text style={styles.goldPrice}>
                ${profitCalculation.revenue.totalRevenue.toFixed(2)}
              </Text>
            </View>
          </GlassCard>
          <GlassCard tier="subtle" animate={false} style={{ marginBottom: 12 }}>
            <Text style={styles.subSectionLabel}>Cost Breakdown</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Purchase Cost:</Text>
              <Text style={styles.metaValue}>
                ${profitCalculation.costs.purchases.totalCost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Transport Cost:</Text>
              <Text style={styles.metaValue}>
                ${profitCalculation.costs.transport.estimatedCost.toFixed(2)}
              </Text>
            </View>
            <View style={DIVIDER} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Total Costs:</Text>
              <Text style={[styles.goldPrice, { color: COLORS.danger }]}>
                ${profitCalculation.costs.totalCosts.toFixed(2)}
              </Text>
            </View>
          </GlassCard>
          <GlassCard
            tier={profitCalculation.profit.meetsMinimumMargin ? 'medium' : 'subtle'}
            animate={false}
            style={{
              borderColor: profitCalculation.profit.meetsMinimumMargin
                ? 'rgba(74,222,128,0.3)'
                : 'rgba(248,113,113,0.3)',
            }}
          >
            <View style={styles.metaRow}>
              {profitCalculation.profit.meetsMinimumMargin ? (
                <CheckCircle size={18} color={COLORS.accentGreen} />
              ) : (
                <AlertTriangle size={18} color={COLORS.danger} />
              )}
              <Text
                style={[
                  styles.subSectionLabel,
                  {
                    color: profitCalculation.profit.meetsMinimumMargin
                      ? COLORS.accentGreen
                      : COLORS.danger,
                    marginLeft: 8,
                  },
                ]}
              >
                {profitCalculation.profit.meetsMinimumMargin
                  ? 'Profitable Trade'
                  : 'Below Minimum Margin'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Net Profit:</Text>
              <Text
                style={[
                  styles.goldPrice,
                  {
                    color:
                      profitCalculation.profit.netProfit > 0 ? COLORS.accentGreen : COLORS.danger,
                    fontSize: 18,
                  },
                ]}
              >
                ${profitCalculation.profit.netProfit.toFixed(2)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Profit Margin:</Text>
              <Text
                style={[
                  styles.goldPrice,
                  {
                    color: profitCalculation.profit.meetsMinimumMargin
                      ? COLORS.accentGreen
                      : COLORS.danger,
                    fontSize: 18,
                  },
                ]}
              >
                {profitCalculation.profit.profitMargin.toFixed(1)}%
              </Text>
            </View>
          </GlassCard>
        </>
      ) : (
        <View style={styles.loaderCenter}>
          <TrendingUp size={44} color={COLORS.textMuted} />
          <Text style={styles.loaderText}>Profit calculation pending...</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderOffersStep = () => {
    if (!buyListing || !tradeOperation) return null;
    return (
      <ScrollView style={styles.stepContent}>
        <Text style={styles.stepTitle}>Send Offers</Text>
        <GlassCard
          tier="subtle"
          animate={false}
          style={{ marginBottom: 16, borderColor: 'rgba(96,165,250,0.2)' }}
        >
          <Text style={[styles.infoBody, { color: COLORS.info }]}>
            Review and adjust offer prices before sending to all parties.
          </Text>
        </GlassCard>
        <GlassCard tier="subtle" animate={false} style={{ marginBottom: 12 }}>
          <Text style={styles.subSectionLabel}>Buyer Offer</Text>
          <Text style={styles.metaLabel}>To: {buyListing.buyer?.name || 'Unknown Buyer'}</Text>
          <Text style={styles.hintText}>Max price: ${buyListing.maxPricePerUnit}</Text>
          <GlassInput
            value={offerPrices.buyer}
            onChangeText={(value) => setOfferPrices((prev) => ({ ...prev, buyer: value }))}
            placeholder={buyListing.maxPricePerUnit.toString()}
            keyboardType="numeric"
            leftIcon={<DollarSign size={15} color={COLORS.textMuted} />}
            containerStyle={{ marginBottom: 0, marginTop: 8 }}
          />
        </GlassCard>
        <GlassCard tier="subtle" animate={false} style={{ marginBottom: 12 }}>
          <Text style={styles.subSectionLabel}>Seller Offers</Text>
          {selectedSellers.map((sellerId) => {
            const seller = matchingSellers.find((s) => s.sellerId === sellerId);
            if (!seller) return null;
            return (
              <View
                key={sellerId}
                style={{
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={styles.metaLabel}>
                  To: {seller.saleListing?.seller?.name || 'Unknown Seller'}
                </Text>
                <Text style={styles.hintText}>
                  Asking: ${seller.askingPrice} | Qty: {seller.availability} units
                </Text>
                <GlassInput
                  value={offerPrices.sellers[sellerId] || ''}
                  onChangeText={(value) =>
                    setOfferPrices((prev) => ({
                      ...prev,
                      sellers: { ...prev.sellers, [sellerId]: value },
                    }))
                  }
                  placeholder={seller.askingPrice.toString()}
                  keyboardType="numeric"
                  leftIcon={<DollarSign size={15} color={COLORS.textMuted} />}
                  containerStyle={{ marginBottom: 0, marginTop: 4 }}
                />
              </View>
            );
          })}
        </GlassCard>
        {profitCalculation && (
          <GlassCard tier="subtle" animate={false} style={{ borderColor: 'rgba(252,211,77,0.2)' }}>
            <Text style={[styles.hintText, { color: COLORS.accentGold, fontSize: 13 }]}>
              Expected profit with current prices: ${profitCalculation.profit.netProfit.toFixed(2)}{' '}
              ({profitCalculation.profit.profitMargin.toFixed(1)}%)
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderReviewStep();
      case 2:
        return renderSellerSelectionStep();
      case 3:
        return renderTransportStep();
      case 4:
        return renderProfitStep();
      case 5:
        return renderOffersStep();
      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View style={styles.root}>
          {/* Header */}
          <GlassCard tier="subtle" animate={false} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Create Trade Operation</Text>
                {buyListing && (
                  <Text style={styles.headerSub}>
                    {buyListing.product?.name || 'Unknown Product'} - {buyListing.quantity}{' '}
                    {buyListing.unit || 'TON'}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {renderStepIndicator()}

          <View style={styles.content}>{renderStepContent()}</View>

          {/* Footer */}
          <GlassCard tier="subtle" animate={false} style={styles.footer}>
            <View style={styles.footerButtons}>
              <GlassButton
                label={currentStep === 1 ? 'Cancel' : 'Back'}
                onPress={() => (currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose())}
                variant="ghost"
                size="md"
                style={styles.footerBtn}
              />
              <GlassButton
                label={
                  currentStep === 1
                    ? 'Create Trade & Continue'
                    : currentStep === 5
                      ? 'Send Offers'
                      : 'Next'
                }
                onPress={handleNext}
                variant={canProceed() ? 'primary' : 'secondary'}
                disabled={!canProceed() || isCreatingTrade || isSendingOffers}
                loading={isCreatingTrade || isSendingOffers}
                size="md"
                leftIcon={
                  !isCreatingTrade && !isSendingOffers ? (
                    <ArrowRight size={16} color="#fff" />
                  ) : undefined
                }
                style={styles.footerBtnFlex}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {tradeOperation && (
        <OfferModal
          visible={showOfferModal}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedSellerForOffer(null);
          }}
          seller={selectedSellerForOffer as any}
          tradeOperationId={tradeOperation.id}
          tradeOperation={tradeOperation as any}
          onOfferSent={() => {
            setShowOfferModal(false);
            setSelectedSellerForOffer(null);
            Alert.alert('Success', 'Offer sent successfully!');
            if (refreshCurrentTrade) refreshCurrentTrade(tradeOperation.id);
          }}
          buyerMaxPrice={buyListing?.maxPricePerUnit}
          requiredQuantity={buyListing?.quantity}
        />
      )}
    </>
  );
};

export default TradeCreationDrawer;

const styles = StyleSheet.create({
  closeBtn: { padding: 4 },
  content: { flex: 1 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  footer: { margin: 16, marginTop: 8 },
  footerBtn: {},
  footerBtnFlex: { flex: 1 },
  footerButtons: { flexDirection: 'row', gap: 12 },
  goldPrice: { color: COLORS.accentGold, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
  halfField: { flex: 1 },
  header: { borderRadius: 14, margin: 16, marginBottom: 8 },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  headerText: { flex: 1 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  hintText: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  infoBody: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  infoLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  loaderCenter: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loaderText: { color: COLORS.textSecondary, fontSize: 13 },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 3 },
  locationText: { color: COLORS.textMuted, fontSize: 11 },
  metaLabel: { color: COLORS.textSecondary, fontSize: 12 },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  progressBar: { borderRadius: 3, height: '100%' },
  progressBg: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
  },
  progressTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  root: { backgroundColor: 'transparent', flex: 1 },
  rowFields: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  sellerAvailable: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  sellerBottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sellerHeader: { padding: 16, paddingBottom: 8 },
  sellerList: { flex: 1, paddingHorizontal: 16 },
  sellerName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  sellerNameCol: { flex: 1, marginRight: 8 },
  sellerTaking: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  sellerTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sendOfferBtn: {
    backgroundColor: 'rgba(96,165,250,0.2)',
    borderColor: 'rgba(96,165,250,0.4)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sendOfferBtnText: { color: COLORS.info, fontSize: 11, fontWeight: '700' },
  stepActive: { backgroundColor: 'rgba(96,165,250,0.4)' },
  stepBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepCompleted: { backgroundColor: 'rgba(74,222,128,0.4)' },
  stepContent: { flex: 1, padding: 16 },
  stepContentFull: { flex: 1 },
  stepItem: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  stepLabel: { color: COLORS.textMuted, flex: 1, fontSize: 9, fontWeight: '600', marginLeft: 4 },
  stepLabelActive: { color: COLORS.info },
  stepTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  subSectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  transportDetails: { flex: 1, padding: 16 },
});
