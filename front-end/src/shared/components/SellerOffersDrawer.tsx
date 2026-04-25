import React, { useEffect, useMemo, useState } from 'react';
import { View, Modal, Alert, Animated, KeyboardAvoidingView, Platform } from 'react-native';

import { sellerOfferService } from '@services/sellerOfferService';
import { SellerOffersAcceptView } from './seller-offers-drawer/AcceptView';
import { SellerOffersFooter } from './seller-offers-drawer/Footer';
import { SellerOffersHeader } from './seller-offers-drawer/Header';
import { SellerOffersListView } from './seller-offers-drawer/ListView';
import { SellerOffersNegotiationView } from './seller-offers-drawer/NegotiationView';
import { SellerOffersRejectView } from './seller-offers-drawer/RejectView';
import {
  calculatePriceDifference,
  calculateProfitMargin,
  calculateQuantityDifference,
  calculateTotalValue,
  filterOffers,
  getOfferStats,
} from './seller-offers-drawer/utils';
import type {
  SellerNegotiationType,
  SellerOffer,
  SellerOfferFilter,
  SellerOfferView,
  SellerProductSummary,
} from '@shared/types/seller-offers';

interface SellerOffersDrawerProps {
  visible: boolean;
  onClose: () => void;
  offers: SellerOffer[];
  sellerProduct?: SellerProductSummary;
  productName: string;
  productId: string;
}

export const SellerOffersDrawer: React.FC<SellerOffersDrawerProps> = ({
  visible,
  onClose,
  offers,
  sellerProduct,
  productName,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [contentAnim] = useState(new Animated.Value(1));
  const [filterBy, setFilterBy] = useState<SellerOfferFilter>('all');
  const [currentView, setCurrentView] = useState<SellerOfferView>('list');
  const [selectedOffer, setSelectedOffer] = useState<SellerOffer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [counterPrice, setCounterPrice] = useState('');
  const [counterQuantity, setCounterQuantity] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('14');
  const [deliveryTerms, setDeliveryTerms] = useState('FOB');
  const [message, setMessage] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [negotiationType, setNegotiationType] = useState<SellerNegotiationType>('price');
  const [acceptNotes, setAcceptNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => setIsLoading(false), 500);

      return () => clearTimeout(timer);
    }

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentView('list');
      setSelectedOffer(null);
      setCounterPrice('');
      setCounterQuantity('');
      setMessage('');
      setAcceptNotes('');
      setRejectReason('');
      setRejectMessage('');
      setNegotiationType('price');
    });
  }, [visible, slideAnim]);

  const processedOffers = useMemo(() => filterOffers(offers, filterBy), [offers, filterBy]);
  const offerStats = useMemo(() => getOfferStats(offers), [offers]);

  const animateViewChange = (newView: SellerOfferView) => {
    Animated.sequence([
      Animated.timing(contentAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentView(newView);
  };

  const handleBack = () => {
    animateViewChange('list');
    setSelectedOffer(null);
  };

  const handleOfferAction = (action: 'accept' | 'reject' | 'negotiate', offerId: string) => {
    const offer = offers.find((candidate) => candidate.id === offerId);
    if (!offer) {
      return;
    }

    setSelectedOffer(offer);
    setCounterPrice(offer.offeredPrice.toString());
    setCounterQuantity(offer.requestedQuantity.toString());
    animateViewChange(action);
  };

  const handleSubmitAccept = async () => {
    if (!selectedOffer) {
      return;
    }

    setActionLoading(true);
    try {
      const offerId = selectedOffer.negotiationId || selectedOffer.id;
      const acceptanceNote = acceptNotes.trim();
      await sellerOfferService.acceptOffer(
        offerId,
        acceptanceNote ? { acceptanceNote } : undefined
      );
      Alert.alert('Success', 'Offer accepted successfully!');
      onClose();
    } catch (_error) {
      Alert.alert('Error', 'Failed to accept offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReject = async () => {
    if (!selectedOffer) {
      return;
    }

    if (!rejectReason.trim()) {
      Alert.alert('Validation Error', 'Please select a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const offerId = selectedOffer.negotiationId || selectedOffer.id;
      await sellerOfferService.rejectOffer(offerId, { reason: rejectReason });
      Alert.alert('Offer Rejected', 'The buyer has been notified of your decision.');
      onClose();
    } catch (_error) {
      Alert.alert('Error', 'Failed to reject offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitNegotiation = async () => {
    if (!selectedOffer) {
      return;
    }

    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid counter price');
      return;
    }

    if (!counterQuantity || parseFloat(counterQuantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    const counterQuantityNumber = parseFloat(counterQuantity);
    const availableQuantity = sellerProduct?.quantity || 0;

    if (counterQuantityNumber > availableQuantity) {
      Alert.alert(
        'Validation Error',
        `Quantity cannot exceed your available stock (${availableQuantity} ${selectedOffer.unit})`
      );
      return;
    }

    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please add a message explaining your counter-offer');
      return;
    }

    setActionLoading(true);
    try {
      const offerId = selectedOffer.negotiationId || selectedOffer.id;
      await sellerOfferService.counterOffer(offerId, {
        counterPrice: parseFloat(counterPrice),
        quantity: parseFloat(counterQuantity),
        message: message.trim(),
      });
      Alert.alert('Counter-Offer Sent', 'Your counter-offer has been sent to the buyer.');
      handleBack();
    } catch (_error) {
      Alert.alert('Error', 'Failed to send counter-offer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const priceDifference = selectedOffer
    ? calculatePriceDifference(selectedOffer, counterPrice)
    : { difference: 0, percentageChange: 0, isIncrease: false };
  const quantityDifference = selectedOffer
    ? calculateQuantityDifference(selectedOffer, counterQuantity)
    : { difference: 0, percentageChange: 0, isIncrease: false };
  const totalValue = calculateTotalValue(counterPrice, counterQuantity);
  const profitMargin = calculateProfitMargin(sellerProduct, counterPrice);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Animated.View
          style={{
            flex: 1,
            marginTop: 100,
            backgroundColor: '#0A0A0A',
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                }),
              },
            ],
          }}
          className="rounded-t-3xl"
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <SellerOffersHeader
              currentView={currentView}
              offerCount={offers.length}
              productName={productName}
              onClose={onClose}
              onBack={handleBack}
            />

            <Animated.View style={{ flex: 1, transform: [{ scale: contentAnim }] }}>
              {currentView === 'list' ? (
                <SellerOffersListView
                  processedOffers={processedOffers}
                  sellerProduct={sellerProduct}
                  filterBy={filterBy}
                  isLoading={isLoading}
                  actionLoading={actionLoading}
                  offerStats={offerStats}
                  onChangeFilter={setFilterBy}
                  onAccept={(offerId) => handleOfferAction('accept', offerId)}
                  onReject={(offerId) => handleOfferAction('reject', offerId)}
                  onNegotiate={(offerId) => handleOfferAction('negotiate', offerId)}
                />
              ) : null}

              {currentView === 'negotiate' && selectedOffer ? (
                <SellerOffersNegotiationView
                  offer={selectedOffer}
                  sellerProduct={sellerProduct}
                  counterPrice={counterPrice}
                  counterQuantity={counterQuantity}
                  deliveryDays={deliveryDays}
                  deliveryTerms={deliveryTerms}
                  message={message}
                  validDays={validDays}
                  negotiationType={negotiationType}
                  priceDifference={priceDifference}
                  quantityDifference={quantityDifference}
                  profitMargin={profitMargin}
                  totalValue={totalValue}
                  onChangeCounterPrice={setCounterPrice}
                  onChangeCounterQuantity={setCounterQuantity}
                  onChangeDeliveryDays={setDeliveryDays}
                  onChangeDeliveryTerms={setDeliveryTerms}
                  onChangeMessage={setMessage}
                  onChangeValidDays={setValidDays}
                  onChangeNegotiationType={setNegotiationType}
                />
              ) : null}

              {currentView === 'accept' && selectedOffer ? (
                <SellerOffersAcceptView
                  offer={selectedOffer}
                  acceptNotes={acceptNotes}
                  onChangeAcceptNotes={setAcceptNotes}
                />
              ) : null}

              {currentView === 'reject' && selectedOffer ? (
                <SellerOffersRejectView
                  offer={selectedOffer}
                  rejectReason={rejectReason}
                  rejectMessage={rejectMessage}
                  onChangeRejectReason={setRejectReason}
                  onChangeRejectMessage={setRejectMessage}
                />
              ) : null}
            </Animated.View>

            <SellerOffersFooter
              currentView={currentView}
              actionLoading={actionLoading}
              rejectReason={rejectReason}
              onBack={handleBack}
              onSubmitNegotiation={handleSubmitNegotiation}
              onSubmitAccept={handleSubmitAccept}
              onSubmitReject={handleSubmitReject}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};
