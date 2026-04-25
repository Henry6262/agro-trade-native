import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  ChevronRight,
  CheckCircle,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Truck,
  DollarSign,
} from 'lucide-react-native';

import { GlassBadge, GlassCard, GlassInput } from '@design-system';
import { COLORS } from '@design-system';
import type {
  BuyListing,
  MatchingSeller,
  ProfitCalculation,
  TradeOperation,
  TransportEstimate,
} from '@services/tradeOperationService';

import { TransportMapView } from '../TransportMapView';
import { DIVIDER, screenHeight, STEPS } from './constants';
import { styles } from './styles';

interface StepIndicatorProps {
  currentStep: number;
}

interface ReviewStepProps {
  buyListing: BuyListing | null;
  tradeOperation: TradeOperation | null;
  targetMargin: string;
  onChangeTargetMargin: (value: string) => void;
}

interface SellerSelectionStepProps {
  buyListing: BuyListing | null;
  matchingSellers: MatchingSeller[];
  selectedSellers: string[];
  isLoadingMatchingSellers: boolean;
  onToggleSeller: (sellerId: string) => void;
  onOpenSellerOffer: (seller: MatchingSeller) => void;
}

interface TransportStepProps {
  tradeOperation: TradeOperation | null;
  buyListing: BuyListing | null;
  transportEstimate: TransportEstimate | null;
  selectedSellers: string[];
  matchingSellers: MatchingSeller[];
  isEstimatingTransport: boolean;
}

interface ProfitStepProps {
  profitCalculation: ProfitCalculation | null;
  isCalculatingProfit: boolean;
}

interface OffersStepProps {
  buyListing: BuyListing | null;
  tradeOperation: TradeOperation | null;
  selectedSellers: string[];
  matchingSellers: MatchingSeller[];
  offerPrices: {
    buyer: string;
    sellers: Record<string, string>;
  };
  profitCalculation: ProfitCalculation | null;
  onChangeBuyerPrice: (value: string) => void;
  onChangeSellerPrice: (sellerId: string, value: string) => void;
}

export function TradeCreationStepIndicator({ currentStep }: StepIndicatorProps) {
  return (
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
            {index < STEPS.length - 1 ? <ChevronRight size={13} color={COLORS.textMuted} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export function TradeCreationReviewStep({
  buyListing,
  tradeOperation,
  targetMargin,
  onChangeTargetMargin,
}: ReviewStepProps) {
  return (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Buy Order & Create Trade</Text>
      {!tradeOperation ? (
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
      ) : null}

      {buyListing ? (
        <GlassCard tier="subtle" animate={false}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Product</Text>
            <Text style={styles.fieldValue}>{buyListing.product?.name || 'Unknown Product'}</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Buyer</Text>
            <Text style={styles.fieldValue}>{buyListing.buyer?.name || 'Unknown Buyer'}</Text>
            {buyListing.deliveryAddress ? (
              <View style={styles.locationRow}>
                <MapPin size={11} color={COLORS.textMuted} />
                <Text style={styles.locationText}>
                  {buyListing.deliveryAddress.city ||
                    buyListing.deliveryAddress.address ||
                    'Delivery location set'}
                </Text>
              </View>
            ) : null}
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
          {buyListing.neededBy ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Needed By</Text>
              <View style={styles.locationRow}>
                <Calendar size={14} color={COLORS.textMuted} />
                <Text style={styles.fieldValue}>
                  {new Date(buyListing.neededBy).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={DIVIDER} />
          <GlassInput
            label="Target Profit Margin (%)"
            value={targetMargin}
            onChangeText={onChangeTargetMargin}
            placeholder="7.5"
            keyboardType="numeric"
            leftIcon={<TrendingUp size={15} color={COLORS.textMuted} />}
            containerStyle={{ marginBottom: 4 }}
          />
          <Text style={styles.hintText}>Minimum: 5%, Maximum: 15%</Text>
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}

export function TradeCreationSellerSelectionStep({
  buyListing,
  matchingSellers,
  selectedSellers,
  isLoadingMatchingSellers,
  onToggleSeller,
  onOpenSellerOffer,
}: SellerSelectionStepProps) {
  const buyerQuantity = Number(buyListing?.quantity) || 0;
  let remainingNeeded = buyerQuantity;
  const sellerQuantities: Record<string, number> = {};
  let totalSelectedQuantity = 0;

  selectedSellers.forEach((sellerId) => {
    const seller = matchingSellers.find((item) => item.sellerId === sellerId);
    if (seller && remainingNeeded > 0) {
      const available = Number(seller.availability) || 0;
      const taking = Math.min(available, remainingNeeded);
      sellerQuantities[sellerId] = taking;
      totalSelectedQuantity += taking;
      remainingNeeded -= taking;
    }
  });

  const progressPercentage = buyerQuantity > 0 ? (totalSelectedQuantity / buyerQuantity) * 100 : 0;

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
                  onPress={() => onToggleSeller(seller.sellerId)}
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
                    {isSelected ? (
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
                    ) : null}
                    <View style={styles.sellerBottomRow}>
                      <Text style={styles.goldPrice}>
                        ${seller.askingPrice}/{seller.saleListing?.unit || 'TON'}
                      </Text>
                      {isSelected ? (
                        <TouchableOpacity
                          onPress={(event) => {
                            event.stopPropagation();
                            onOpenSellerOffer(seller);
                          }}
                          style={styles.sendOfferBtn}
                        >
                          <Text style={styles.sendOfferBtnText}>Send Offer</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
            {matchingSellers.length === 0 ? (
              <View style={styles.loaderCenter}>
                <Text style={styles.loaderText}>No matching sellers found</Text>
                <Text style={styles.hintText}>Try refreshing or adjusting criteria</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function TradeCreationTransportStep({
  tradeOperation,
  buyListing,
  transportEstimate,
  selectedSellers,
  matchingSellers,
  isEstimatingTransport,
}: TransportStepProps) {
  if (!tradeOperation || !buyListing) {
    return null;
  }

  const route = transportEstimate
    ? {
        origin: { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' },
        pickupLocations: selectedSellers.map((sellerId, index) => {
          const seller = matchingSellers.find((item) => item.sellerId === sellerId);

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
}

export function TradeCreationProfitStep({
  profitCalculation,
  isCalculatingProfit,
}: ProfitStepProps) {
  return (
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
}

export function TradeCreationOffersStep({
  buyListing,
  tradeOperation,
  selectedSellers,
  matchingSellers,
  offerPrices,
  profitCalculation,
  onChangeBuyerPrice,
  onChangeSellerPrice,
}: OffersStepProps) {
  if (!buyListing || !tradeOperation) {
    return null;
  }

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
          onChangeText={onChangeBuyerPrice}
          placeholder={buyListing.maxPricePerUnit.toString()}
          keyboardType="numeric"
          leftIcon={<DollarSign size={15} color={COLORS.textMuted} />}
          containerStyle={{ marginBottom: 0, marginTop: 8 }}
        />
      </GlassCard>

      <GlassCard tier="subtle" animate={false} style={{ marginBottom: 12 }}>
        <Text style={styles.subSectionLabel}>Seller Offers</Text>
        {selectedSellers.map((sellerId) => {
          const seller = matchingSellers.find((item) => item.sellerId === sellerId);
          if (!seller) {
            return null;
          }

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
                onChangeText={(value) => onChangeSellerPrice(sellerId, value)}
                placeholder={seller.askingPrice.toString()}
                keyboardType="numeric"
                leftIcon={<DollarSign size={15} color={COLORS.textMuted} />}
                containerStyle={{ marginBottom: 0, marginTop: 4 }}
              />
            </View>
          );
        })}
      </GlassCard>

      {profitCalculation ? (
        <GlassCard tier="subtle" animate={false} style={{ borderColor: 'rgba(252,211,77,0.2)' }}>
          <Text style={[styles.hintText, { color: COLORS.accentGold, fontSize: 13 }]}>
            Expected profit with current prices: ${profitCalculation.profit.netProfit.toFixed(2)} (
            {profitCalculation.profit.profitMargin.toFixed(1)}%)
          </Text>
        </GlassCard>
      ) : null}
    </ScrollView>
  );
}
