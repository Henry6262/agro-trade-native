import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { GlassButton, COLORS } from '../../../../../../design-system';
import { useProductStore } from '@stores/product.store';
import { BuyerRequestCreationFlow } from '@pages/Dashboard/sections/Buyer/features/RequestCreation/BuyerRequestCreationFlow';
import { UnifiedOffersDrawer } from '@shared/components/UnifiedOffersDrawer';
import { useBuyerRequests } from './hooks';
import { RequestsList } from './components';

export default function BuyerRequestsTab() {
  const {
    requests,
    isLoading,
    isRefreshing,
    error,
    showRequestCreation,
    selectedRequestOffers,
    showOffersDrawer,
    openRequestCreation,
    closeRequestCreation,
    openOffersDrawer,
    closeOffersDrawer,
    refresh,
  } = useBuyerRequests();

  const fetchProductMetadata = useProductStore((state) => state.fetchAllData);

  useEffect(() => {
    fetchProductMetadata().catch((err) => console.error('Failed to load product metadata', err));
  }, [fetchProductMetadata]);

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accentGreen} />
        <Text style={styles.loadingText}>Calibrating Global Demand...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={COLORS.info} />
        }
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.pageTitle}>Buyer Requests</Text>
              <Text style={styles.pageSubtitle}>
                Submit purchase needs and review incoming offers
              </Text>
            </View>
            <GlassButton
              label="New Request"
              onPress={openRequestCreation}
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} color="#ffffff" />}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <RequestsList requests={requests} onOpenOffers={openOffersDrawer} />
        </View>
      </ScrollView>

      {showRequestCreation && (
        <BuyerRequestCreationFlow
          visible={showRequestCreation}
          onClose={closeRequestCreation}
          onSuccess={refresh}
        />
      )}

      <UnifiedOffersDrawer
        visible={showOffersDrawer}
        onClose={closeOffersDrawer}
        offers={selectedRequestOffers?.rawData?.offers ?? []}
        productName={selectedRequestOffers?.product ?? ''}
        requestId={selectedRequestOffers?.id ?? ''}
        buyerRequest={selectedRequestOffers?.rawData}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    gap: 16,
    padding: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 12,
  },
  pageSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
