import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, X } from 'lucide-react-native';

import { GlassCard, GlassButton } from '@design-system';
import { COLORS } from '@design-system';
import type {
  BuyListing,
  MatchingSeller,
  ProfitCalculation,
  TradeOperation,
  TransportEstimate,
} from '@services/tradeOperationService';

import { OfferModal } from './OfferModal';
import {
  TradeCreationOffersStep,
  TradeCreationProfitStep,
  TradeCreationReviewStep,
  TradeCreationSellerSelectionStep,
  TradeCreationStepIndicator,
  TradeCreationTransportStep,
} from './trade-creation-drawer/content';
import { styles } from './trade-creation-drawer/styles';

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

  const tradeOperation = currentTradeOperation || localTradeOperation;

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
    if (!buyListing?.id) {
      Alert.alert('Error', buyListing ? 'Buy listing ID is missing' : 'Buy listing is required');
      return;
    }

    const margin = parseFloat(targetMargin);
    if (Number.isNaN(margin) || margin < 5 || margin > 15) {
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

  const handleEstimateTransport = async () => {
    if (!tradeOperation || !buyListing) {
      return;
    }

    const origin = { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' };
    const destination = {
      latitude: buyListing.deliveryAddress?.latitude || 41.8781,
      longitude: buyListing.deliveryAddress?.longitude || -87.6298,
      address: buyListing.deliveryAddress?.address || 'Chicago, IL',
    };
    const pickupLocations = selectedSellers.map((sellerId, index) => {
      const seller = matchingSellers.find((item) => item.sellerId === sellerId);
      return {
        latitude: 42.0 + index * 0.1,
        longitude: -93.0 + index * 0.1,
        address: seller?.saleListing?.address?.address || `Farm ${index + 1}`,
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

  const handleSelectSellers = async () => {
    if (!tradeOperation || selectedSellers.length === 0) {
      Alert.alert('Error', 'Please select at least one seller');
      return;
    }

    const buyerQuantity = Number(buyListing?.quantity) || 0;
    let remainingQuantity = buyerQuantity;
    const sellersToAdd = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((item) => item.sellerId === sellerId);
        if (!seller || remainingQuantity <= 0) {
          return null;
        }

        const sellerAvailability = Number(seller.availability) || 0;
        const requestedQuantity = Math.min(sellerAvailability, remainingQuantity);
        remainingQuantity -= requestedQuantity;

        return {
          sellerId: seller.sellerId,
          saleListingId: seller.saleListingId,
          requestedQuantity,
        };
      })
      .filter(
        (seller): seller is NonNullable<typeof seller> =>
          seller !== null && seller.requestedQuantity > 0
      );

    const success = await selectSellers(tradeOperation.id, sellersToAdd);
    if (success) {
      if (refreshCurrentTrade) {
        await refreshCurrentTrade(tradeOperation.id);
      }
      setCurrentStep(3);
      await handleEstimateTransport();
    }
  };

  const handleSendOffers = async () => {
    if (!tradeOperation || !buyListing) {
      return;
    }

    const buyerPrice = parseFloat(offerPrices.buyer || (buyListing.maxPricePerUnit ?? 0).toString());
    const sellerOffers = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((item) => item.sellerId === sellerId);
        return {
          sellerId,
          price: parseFloat(offerPrices.sellers[sellerId] || seller?.askingPrice.toString() || '0'),
          quantity: seller?.availability || 0,
        };
      })
      .filter((offer) => offer.price > 0);

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TradeCreationReviewStep
            buyListing={buyListing}
            tradeOperation={tradeOperation}
            targetMargin={targetMargin}
            onChangeTargetMargin={setTargetMargin}
          />
        );
      case 2:
        return (
          <TradeCreationSellerSelectionStep
            buyListing={buyListing}
            matchingSellers={matchingSellers}
            selectedSellers={selectedSellers}
            isLoadingMatchingSellers={isLoadingMatchingSellers}
            onToggleSeller={(sellerId) =>
              setSelectedSellers((current) =>
                current.includes(sellerId)
                  ? current.filter((currentSellerId) => currentSellerId !== sellerId)
                  : [...current, sellerId]
              )
            }
            onOpenSellerOffer={(seller) => {
              setSelectedSellerForOffer(seller);
              setShowOfferModal(true);
            }}
          />
        );
      case 3:
        return (
          <TradeCreationTransportStep
            tradeOperation={tradeOperation}
            buyListing={buyListing}
            transportEstimate={transportEstimate}
            selectedSellers={selectedSellers}
            matchingSellers={matchingSellers}
            isEstimatingTransport={isEstimatingTransport}
          />
        );
      case 4:
        return (
          <TradeCreationProfitStep
            profitCalculation={profitCalculation}
            isCalculatingProfit={isCalculatingProfit}
          />
        );
      case 5:
        return (
          <TradeCreationOffersStep
            buyListing={buyListing}
            tradeOperation={tradeOperation}
            selectedSellers={selectedSellers}
            matchingSellers={matchingSellers}
            offerPrices={offerPrices}
            profitCalculation={profitCalculation}
            onChangeBuyerPrice={(value) =>
              setOfferPrices((current) => ({ ...current, buyer: value }))
            }
            onChangeSellerPrice={(sellerId, value) =>
              setOfferPrices((current) => ({
                ...current,
                sellers: { ...current.sellers, [sellerId]: value },
              }))
            }
          />
        );
      default:
        return null;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View style={styles.root}>
          <GlassCard tier="subtle" animate={false} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Create Trade Operation</Text>
                {buyListing ? (
                  <Text style={styles.headerSub}>
                    {buyListing.product?.name || 'Unknown Product'} - {buyListing.quantity}{' '}
                    {buyListing.unit || 'TON'}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </GlassCard>

          <TradeCreationStepIndicator currentStep={currentStep} />

          <View style={styles.content}>{renderStepContent()}</View>

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

      {tradeOperation ? (
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
            if (refreshCurrentTrade) {
              refreshCurrentTrade(tradeOperation.id);
            }
          }}
          buyerMaxPrice={buyListing?.maxPricePerUnit}
          requiredQuantity={buyListing?.quantity}
        />
      ) : null}
    </>
  );
};

export default TradeCreationDrawer;
