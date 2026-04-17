import React from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { RefreshCw, Map as MapIcon, Filter } from 'lucide-react-native';
import { MapDrawer } from '../maps/components/MapDrawer';
import { useTransporterOffers } from './hooks';
import { OffersSummaryGrid, OffersList } from './components';
import type { BaseComponentProps } from '@shared/types';
import { COLORS, GlassBadge } from '../../../../../../design-system';

interface TransporterIncomingOffersTabProps extends BaseComponentProps {
  id?: string;
}

export const TransporterIncomingOffersTab: React.FC<TransporterIncomingOffersTabProps> = ({
  testID,
  accessibilityLabel,
}) => {
  const {
    requests,
    summary,
    selectedMapOffer,
    setSelectedMapOffer,
    isLoading,
    isRefreshing,
    submittingBid,
    refresh,
    hasBidOnRequest,
    submitBid,
    viewRoute,
  } = useTransporterOffers();

  return (
    <View style={styles.root}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Scanning Logistics Network...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
        >
          <View style={styles.header}>
            <View>
                <Text style={styles.pageTitle}>Logistics Hub</Text>
                <Text style={styles.pageSubtitle}>Available routes matching your fleet</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Filter size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={refresh} disabled={isRefreshing} style={styles.iconBtn}>
                    <RefreshCw size={18} color={isRefreshing ? COLORS.textMuted : "#60A5FA"} />
                </TouchableOpacity>
            </View>
          </View>

          <OffersSummaryGrid summary={summary} />
          
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Open Requests</Text>
            <GlassBadge label={`${requests.length} Active`} variant="primary" size="sm" />
          </View>

          <OffersList
            requests={requests}
            hasBidOnRequest={hasBidOnRequest}
            submittingBid={submittingBid}
            onSubmitBid={(id) => submitBid(id, 3500)}
            onViewRoute={viewRoute}
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <MapDrawer
        isOpen={Boolean(selectedMapOffer)}
        offer={selectedMapOffer}
        onClose={() => setSelectedMapOffer(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    bottomSpacer: {
        height: 40,
    },
    centered: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 16,
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        height: 40,
        justifyContent: 'center',
        width: 40,
    },
    listHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 8,
    },
    listTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 12,
    },
    pageSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    pageTitle: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: '800',
    },
    root: {
        backgroundColor: 'transparent',
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
});

export default TransporterIncomingOffersTab;
