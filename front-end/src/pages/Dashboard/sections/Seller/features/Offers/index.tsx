import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';

import { GlassButton, GlassBadge, COLORS } from '@design-system';

import {
  OfferStatsGrid,
  OffersEmptyState,
  SellerOfferCard,
  SellerAcceptOfferModal,
  SellerRejectOfferModal,
  SellerCounterOfferModal,
} from './components';
import { useSellerOffersFeature } from './hooks';
import type { SellerOffer } from './types';
import SellerTimelineFeature from '../Timeline';

export default function SellerOffersFeature() {
  const {
    offers,
    stats,
    statsCards,
    isLoading,
    isError,
    error,
    refreshOffers,
    acceptOffer,
    rejectOffer,
    makeCounterOffer,
    isAccepting,
    isRejecting,
    isCountering,
    acceptSuccess,
    rejectSuccess,
    counterSuccess,
  } = useSellerOffersFeature();

  const [selectedOffer, setSelectedOffer] = useState<SellerOffer | null>(null);
  const [activeModal, setActiveModal] = useState<'accept' | 'reject' | 'counter' | null>(null);

  useEffect(() => {
    if (acceptSuccess) {
      Alert.alert('Success', 'Offer accepted successfully!');
    }
    if (rejectSuccess) {
      Alert.alert('Offer Rejected', 'The offer has been rejected.');
    }
    if (counterSuccess) {
      Alert.alert('Counter Offer Sent', 'Your counter offer has been sent to the buyer.');
    }
  }, [acceptSuccess, rejectSuccess, counterSuccess]);

  const openModal = (type: 'accept' | 'reject' | 'counter', offer: SellerOffer) => {
    setSelectedOffer(offer);
    setActiveModal(type);
  };

  const closeModal = () => {
    setSelectedOffer(null);
    setActiveModal(null);
  };

  const handleAcceptConfirm = (negotiationId: string, acceptanceNote?: string) => {
    acceptOffer(negotiationId, acceptanceNote);
    closeModal();
  };

  const handleRejectConfirm = (negotiationId: string, reason?: string) => {
    rejectOffer(negotiationId, reason);
    closeModal();
  };

  const handleCounterConfirm = (
    negotiationId: string,
    counterPrice: number,
    quantity?: number,
    message?: string
  ) => {
    makeCounterOffer(negotiationId, counterPrice, quantity, message);
    closeModal();
  };

  const isProcessing = isAccepting || isRejecting || isCountering;

  if (isLoading && offers.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accentGreen} />
        <Text style={styles.loadingText}>Synchronizing Trade Network...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <AlertCircle color={COLORS.danger} size={48} />
        <Text style={styles.errorTitle}>Failed to load offers</Text>
        <Text style={styles.errorSubtitle}>{error?.message || 'Please try again later'}</Text>
        <GlassButton
          label="Retry"
          onPress={refreshOffers}
          variant="ghost"
          style={styles.retryBtn}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshOffers}
            tintColor={COLORS.accentGreen}
            colors={[COLORS.accentGreen]}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Incoming Offers</Text>
            <Text style={styles.pageSubtitle}>Review and respond to buyer requests</Text>
          </View>

          <OfferStatsGrid cards={statsCards} />

          <View style={styles.timelineSection}>
            <SellerTimelineFeature />
          </View>

          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Offers</Text>
              <GlassBadge label={`${stats.pendingOffers} Pending`} variant="warning" size="sm" />
            </View>

            {offers.length === 0 ? (
              <OffersEmptyState />
            ) : (
              offers.map((offer) => (
                <SellerOfferCard
                  key={offer.id}
                  offer={offer as SellerOffer}
                  onAccept={(o: any) => openModal('accept', o)}
                  onReject={(o: any) => openModal('reject', o)}
                  onCounter={(o: any) => openModal('counter', o)}
                  isProcessing={isProcessing}
                />
              ))
            )}
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <SellerAcceptOfferModal
        visible={activeModal === 'accept'}
        onClose={closeModal}
        offer={selectedOffer}
        onConfirm={handleAcceptConfirm}
        isLoading={isAccepting}
      />

      <SellerRejectOfferModal
        visible={activeModal === 'reject'}
        onClose={closeModal}
        offer={selectedOffer}
        onConfirm={handleRejectConfirm}
        isLoading={isRejecting}
      />

      <SellerCounterOfferModal
        visible={activeModal === 'counter'}
        onClose={closeModal}
        offer={selectedOffer}
        onConfirm={handleCounterConfirm}
        isLoading={isCountering}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSpacer: {
    height: 80,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
  },
  errorSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 12,
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  retryBtn: {
    marginTop: 16,
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  timelineSection: {
    marginBottom: 8,
    marginTop: 4,
  },
});
