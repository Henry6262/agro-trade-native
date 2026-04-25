import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, Image, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle,
  Clock,
  MapPin,
  Truck,
  Leaf,
  Shield,
  Search,
  QrCode,
} from 'lucide-react-native';
import {
  GradientBackground,
  GlassCard,
  GlassButton,
  GlassInput,
  GlassBadge,
  COLORS,
} from '@design-system';
import { traceabilityService, ProvenanceEvent } from '../../../../services/traceabilityService';

// ─── Event metadata ────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, React.ReactNode> = {
  LISTING_CREATED: <Leaf size={16} color={COLORS.accentGreen} />,
  BID_SUBMITTED: <Search size={16} color="#60A5FA" />,
  BID_ACCEPTED: <CheckCircle size={16} color={COLORS.accentGreen} />,
  INSPECTION_SCHEDULED: <Clock size={16} color={COLORS.accentGold} />,
  INSPECTION_COMPLETED: <Shield size={16} color={COLORS.accentGreen} />,
  TRANSPORT_PICKUP: <Truck size={16} color="#60A5FA" />,
  TRANSPORT_DELIVERED: <CheckCircle size={16} color={COLORS.accentGreen} />,
  PAYMENT_ESCROWED: <Shield size={16} color={COLORS.accentGold} />,
  PAYMENT_RELEASED: <CheckCircle size={16} color={COLORS.accentGreen} />,
  DISPUTE_RAISED: <Shield size={16} color="#F87171" />,
};

const EVENT_LABELS: Record<string, string> = {
  LISTING_CREATED: 'Listing Created',
  BID_SUBMITTED: 'Bid Submitted',
  BID_ACCEPTED: 'Bid Accepted',
  INSPECTION_SCHEDULED: 'Inspection Scheduled',
  INSPECTION_COMPLETED: 'Inspection Completed',
  TRANSPORT_PICKUP: 'Goods Picked Up',
  TRANSPORT_DELIVERED: 'Goods Delivered',
  PAYMENT_ESCROWED: 'Payment Secured',
  PAYMENT_RELEASED: 'Payment Released',
  DISPUTE_RAISED: 'Dispute Raised',
};

// ─── Provenance Timeline ───────────────────────────────────────────────────────

interface ProvenanceTimelineProps {
  events: ProvenanceEvent[];
}

const ProvenanceTimeline: React.FC<ProvenanceTimelineProps> = ({ events }) => (
  <View style={timelineStyles.container}>
    {events.map((event, idx) => (
      <View key={idx} style={timelineStyles.row}>
        <View style={timelineStyles.iconCol}>
          <View style={timelineStyles.iconWrap}>
            {EVENT_ICONS[event.type] ?? <CheckCircle size={16} color={COLORS.textSecondary} />}
          </View>
          {idx < events.length - 1 && <View style={timelineStyles.line} />}
        </View>
        <View style={timelineStyles.content}>
          <Text style={timelineStyles.eventLabel}>{EVENT_LABELS[event.type] ?? event.type}</Text>
          {event.location.region && (
            <View style={timelineStyles.locationRow}>
              <MapPin size={11} color={COLORS.textMuted} />
              <Text style={timelineStyles.locationText}>{event.location.region}</Text>
            </View>
          )}
          {event.grade && <GlassBadge label={`Grade ${event.grade}`} variant="success" size="sm" />}
          {event.verified && <Text style={timelineStyles.verified}>On-chain verified</Text>}
          <Text style={timelineStyles.timestamp}>{new Date(event.timestamp).toLocaleString()}</Text>
        </View>
        <Text style={timelineStyles.role}>{event.actorRole}</Text>
      </View>
    ))}
  </View>
);

const timelineStyles = StyleSheet.create({
  container: { gap: 0 },
  content: { flex: 1, gap: 4, paddingBottom: 16 },
  eventLabel: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  iconCol: { alignItems: 'center', width: 32 },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  line: { backgroundColor: 'rgba(255,255,255,0.1)', flex: 1, minHeight: 16, width: 1 },
  locationRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  locationText: { color: COLORS.textSecondary, fontSize: 11 },
  role: { color: COLORS.textSecondary, fontSize: 11, paddingTop: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  timestamp: { color: COLORS.textMuted, fontSize: 11 },
  verified: { color: COLORS.accentGreen, fontSize: 11 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

export const TraceabilityScreen: React.FC = () => {
  const [tradeId, setTradeId] = useState('');
  const [provenance, setProvenance] = useState<{
    tradeId: string;
    events: ProvenanceEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const search = useCallback(async () => {
    if (!tradeId.trim()) return;
    setLoading(true);
    setError('');
    setProvenance(null);
    try {
      const data = await traceabilityService.getProvenance(tradeId.trim());
      setProvenance(data);
      setQrUrl(traceabilityService.getQRUrl(tradeId.trim()));
    } catch {
      setError('Trade not found or no events recorded yet.');
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  const shareQR = useCallback(async () => {
    try {
      await Share.share({ message: `AgroAI Trade QR: ${qrUrl}`, url: qrUrl });
    } catch {
      // ignore share cancellation
    }
  }, [qrUrl]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Traceability</Text>
          <Text style={styles.subtitle}>Enter a trade ID to view its provenance</Text>

          <View style={styles.searchRow}>
            <View style={styles.inputWrap}>
              <GlassInput
                placeholder="Trade ID..."
                value={tradeId}
                onChangeText={setTradeId}
                onSubmitEditing={search}
                autoCapitalize="none"
              />
            </View>
            <GlassButton
              label=""
              onPress={search}
              leftIcon={<Search size={18} color={COLORS.textPrimary} />}
              style={styles.searchBtn}
            />
          </View>

          {loading && <ActivityIndicator color={COLORS.accentGreen} style={styles.loader} />}

          {error !== '' && (
            <GlassCard tier="subtle" style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </GlassCard>
          )}

          {provenance && (
            <>
              <GlassCard tier="medium" style={styles.card}>
                <Text style={styles.cardTitle}>Trade Journey</Text>
                <Text style={styles.tradeId}>ID: {provenance.tradeId.slice(0, 16)}...</Text>
                <ProvenanceTimeline events={provenance.events} />
                {provenance.events.length === 0 && (
                  <Text style={styles.noEvents}>No events recorded yet for this trade.</Text>
                )}
              </GlassCard>

              {qrUrl !== '' && (
                <GlassCard tier="subtle" style={styles.qrCard}>
                  <View style={styles.qrTitleRow}>
                    <QrCode size={16} color={COLORS.textPrimary} />
                    <Text style={styles.cardTitle}>QR Code</Text>
                  </View>
                  <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                  <GlassButton label="Share QR Code" onPress={shareQR} />
                </GlassCard>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  errorCard: { marginBottom: 16 },
  errorText: { color: '#F87171', fontSize: 13 },
  inputWrap: { flex: 1 },
  loader: { marginTop: 32 },
  noEvents: { color: COLORS.textSecondary, fontSize: 13, padding: 16, textAlign: 'center' },
  qrCard: { alignItems: 'center', gap: 12, marginBottom: 16 },
  qrImage: { height: 200, width: 200 },
  qrTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 6, width: '100%' },
  searchBtn: { height: 48, paddingHorizontal: 0, width: 48 },
  searchRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 16 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 4 },
  tradeId: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 12 },
});

export default TraceabilityScreen;
