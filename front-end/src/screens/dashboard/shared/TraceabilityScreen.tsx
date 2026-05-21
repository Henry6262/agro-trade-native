import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  CheckCircle2,
  MapPin,
  Truck,
  Warehouse,
  FileCheck,
  QrCode,
  Clock,
  ShieldCheck,
  Navigation,
  Route,
} from 'lucide-react-native';
import { GlassCard, COLORS, GLASS } from '../../../design-system';
import { MotiView } from 'moti';

/* ─── Helpers ─── */

function StatusDot({ status }: { status: 'complete' | 'active' | 'pending' }) {
  const colors = {
    complete: COLORS.accentGreen,
    active: COLORS.info,
    pending: COLORS.textMuted,
  };
  const glows = {
    complete: `${COLORS.accentGreen}40`,
    active: `${COLORS.info}60`,
    pending: 'transparent',
  };
  const c = colors[status];
  return (
    <View style={[styles.dotWrap, status === 'active' && styles.dotWrapActive]}>
      <View style={[styles.dotGlow, { backgroundColor: glows[status] }]} />
      <View
        style={[
          styles.dot,
          {
            backgroundColor: `${c}18`,
            borderColor: `${c}55`,
          },
        ]}
      >
        <View style={[styles.dotInner, { backgroundColor: c }]} />
      </View>
    </View>
  );
}

function MiniQR() {
  // visual QR representation using a 5×5 grid of small blocks
  const pattern = [
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
  ];
  return (
    <View style={styles.qrGrid}>
      {pattern.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 1.5 }}>
          {row.map((cell, ci) => (
            <View
              key={ci}
              style={[
                styles.qrCell,
                { backgroundColor: cell ? COLORS.textPrimary : 'transparent' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function LocationPill({ location }: { location: string }) {
  return (
    <View style={styles.locationPill}>
      <Navigation size={10} color={COLORS.info} />
      <Text style={styles.locationText}>{location}</Text>
    </View>
  );
}

/* ─── Data ─── */

const STAGES = [
  {
    step: 1,
    title: 'Origin Verified',
    desc: 'Farm GPS coordinates & harvest date logged on-chain.',
    location: 'Kardzhali, BG',
    status: 'complete' as const,
    icon: MapPin,
    time: '06:30 EEST',
  },
  {
    step: 2,
    title: 'Quality Inspected',
    desc: 'NIR analysis calibrated to SGS standard. Moisture 14.2%, Protein 11.8%.',
    location: 'Agro Trading Mobile Lab',
    status: 'complete' as const,
    icon: FileCheck,
    time: '09:15 EEST',
  },
  {
    step: 3,
    title: 'Stored & Secured',
    desc: 'EU-funded AGRoGEo storage base. Temperature & humidity IoT sensors active.',
    location: 'Kardzhali Silo #3',
    status: 'complete' as const,
    icon: Warehouse,
    time: '11:00 EEST',
  },
  {
    step: 4,
    title: 'In Transit',
    desc: 'GPS-tracked fleet. Cross-border Greece corridor. ETA 14:30 EEST.',
    location: 'Border crossing Komotini',
    status: 'active' as const,
    icon: Truck,
    time: 'Live',
  },
  {
    step: 5,
    title: 'Delivery & Receipt',
    desc: 'Pending buyer confirmation and escrow release.',
    location: 'Thessaloniki Port, GR',
    status: 'pending' as const,
    icon: CheckCircle2,
    time: 'Scheduled',
  },
];

const CERTIFICATIONS = [
  { name: 'EU Organic', holder: 'Green Valley Farms', valid: '2024–2027', color: COLORS.accentGreen },
  { name: 'GlobalGAP', holder: 'Agro Trading Bulgaria Ltd.', valid: '2025–2028', color: COLORS.accentGold },
  { name: 'ISO 22000', holder: 'Black Sea Agritech', valid: '2023–2026', color: COLORS.info },
];

const JOURNEY_SUMMARY = {
  origin: 'Kardzhali, BG',
  destination: 'Thessaloniki, GR',
  distance: '312 km',
  duration: '8h 15m',
  method: 'Refrigerated truck',
};

/* ─── Component ─── */

export default function TraceabilityScreen() {
  return (
    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <MotiView from={{ opacity: 0, translateY: -12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }}>
          <Text style={styles.header}>Supply Chain Trace</Text>
          <Text style={styles.subheader}>End-to-end verified journey</Text>
        </MotiView>

        {/* Journey summary card */}
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 16, stiffness: 180, delay: 100 }}
        >
          <GlassCard tier="strong" style={styles.journeyCard} delay={80}>
            <View style={styles.journeyRow}>
              <View style={styles.journeyNode}>
                <View style={[styles.journeyDot, { backgroundColor: `${COLORS.accentGreen}22`, borderColor: `${COLORS.accentGreen}50` }]}>
                  <MapPin size={14} color={COLORS.accentGreen} />
                </View>
                <Text style={styles.journeyLabel}>Origin</Text>
                <Text style={styles.journeyValue}>{JOURNEY_SUMMARY.origin}</Text>
              </View>

              <View style={styles.journeyLine}>
                <View style={styles.journeyTrack} />
                <View style={styles.journeyPlane}>
                  <Route size={12} color={COLORS.accentGold} />
                </View>
                <Text style={styles.journeyDistance}>{JOURNEY_SUMMARY.distance}</Text>
              </View>

              <View style={styles.journeyNode}>
                <View style={[styles.journeyDot, { backgroundColor: `${COLORS.info}22`, borderColor: `${COLORS.info}50` }]}>
                  <MapPin size={14} color={COLORS.info} />
                </View>
                <Text style={styles.journeyLabel}>Destination</Text>
                <Text style={styles.journeyValue}>{JOURNEY_SUMMARY.destination}</Text>
              </View>
            </View>

            <View style={styles.journeyMetaRow}>
              <View style={styles.journeyMetaItem}>
                <Clock size={12} color={COLORS.textMuted} />
                <Text style={styles.journeyMetaText}>{JOURNEY_SUMMARY.duration}</Text>
              </View>
              <View style={styles.journeyMetaItem}>
                <Truck size={12} color={COLORS.textMuted} />
                <Text style={styles.journeyMetaText}>{JOURNEY_SUMMARY.method}</Text>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.chain}>
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const isLast = i === STAGES.length - 1;
            return (
              <MotiView
                key={i}
                from={{ opacity: 0, translateX: -18 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 200 + i * 80 }}
              >
                <View style={styles.chainItem}>
                  {/* left column: dot + line */}
                  <View style={styles.chainLeft}>
                    <StatusDot status={stage.status} />
                    {!isLast && (
                      <View
                        style={[
                          styles.chainLine,
                          stage.status === 'complete' && { backgroundColor: `${COLORS.accentGreen}35` },
                        ]}
                      />
                    )}
                  </View>

                  {/* right column: card */}
                  <GlassCard
                    tier={stage.status === 'active' ? 'medium' : 'subtle'}
                    style={[styles.chainCard, stage.status === 'active' && styles.chainCardActive]}
                    delay={i * 60}
                  >
                    <View style={styles.chainHeader}>
                      <View style={styles.chainTitleRow}>
                        <View
                          style={[
                            styles.chainIconWrap,
                            {
                              backgroundColor:
                                stage.status === 'complete'
                                  ? `${COLORS.accentGreen}18`
                                  : stage.status === 'active'
                                  ? `${COLORS.info}18`
                                  : `${COLORS.textMuted}10`,
                            },
                          ]}
                        >
                          <Icon
                            size={14}
                            color={
                              stage.status === 'complete'
                                ? COLORS.accentGreen
                                : stage.status === 'active'
                                ? COLORS.info
                                : COLORS.textMuted
                            }
                          />
                        </View>
                        <Text style={styles.chainTitle}>{stage.title}</Text>
                      </View>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>Step {stage.step}</Text>
                      </View>
                    </View>

                    <Text style={styles.chainDesc}>{stage.desc}</Text>

                    <View style={styles.chainFooter}>
                      <LocationPill location={stage.location} />
                      <View style={styles.timeBadge}>
                        <Clock size={10} color={COLORS.textMuted} />
                        <Text style={styles.timeText}>{stage.time}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              </MotiView>
            );
          })}
        </View>

        {/* Certifications */}
        <Text style={styles.sectionTitle}>Certifications</Text>
        {CERTIFICATIONS.map((cert, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 500 + i * 70 }}
          >
            <GlassCard tier="subtle" style={styles.certCard} delay={i * 50}>
              <View style={styles.certRow}>
                <MiniQR />
                <View style={styles.certInfo}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certMeta}>{cert.holder}</Text>
                  <View style={[styles.validBadge, { backgroundColor: `${cert.color}18` }]}>
                    <ShieldCheck size={10} color={cert.color} />
                    <Text style={[styles.validText, { color: cert.color }]}>Valid {cert.valid}</Text>
                  </View>
                </View>
                <View style={[styles.certCheck, { backgroundColor: `${cert.color}18` }]}>
                  <CheckCircle2 size={18} color={cert.color} />
                </View>
              </View>
            </GlassCard>
          </MotiView>
        ))}
      </ScrollView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  subheader: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 },

  journeyCard: {
    marginBottom: 24,
    padding: 16,
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  journeyNode: {
    alignItems: 'center',
    flex: 1,
  },
  journeyDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 6,
  },
  journeyLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  journeyValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  journeyLine: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 40,
  },
  journeyTrack: {
    position: 'absolute',
    height: 2,
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 1,
  },
  journeyPlane: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(252,211,77,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.accentGold}40`,
    zIndex: 2,
  },
  journeyDistance: {
    position: 'absolute',
    bottom: -2,
    color: COLORS.accentGold,
    fontSize: 10,
    fontWeight: '800',
  },
  journeyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  journeyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journeyMetaText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  chain: { marginBottom: 24 },
  chainItem: { flexDirection: 'row' },
  chainLeft: { alignItems: 'center', width: 36, marginRight: 12 },

  dotWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrapActive: {
    width: 32,
    height: 32,
  },
  dotGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  chainLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },

  chainCard: { flex: 1, marginBottom: 12, padding: 12 },
  chainCardActive: {
    borderColor: `${COLORS.info}40`,
    shadowColor: COLORS.info,
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  chainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  chainIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    lineHeight: 19,
  },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  chainDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  chainFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${COLORS.info}12`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${COLORS.info}20`,
  },
  locationText: {
    color: COLORS.info,
    fontSize: 10,
    fontWeight: '700',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },

  certCard: { padding: 12, marginBottom: 8 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qrGrid: {
    width: 42,
    height: 42,
    justifyContent: 'space-between',
    padding: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qrCell: {
    width: 5.5,
    height: 5.5,
    borderRadius: 1,
  },
  certInfo: { flex: 1 },
  certName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 2 },
  certMeta: { color: COLORS.textMuted, fontSize: 11, marginBottom: 6 },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  validText: {
    fontSize: 10,
    fontWeight: '800',
  },
  certCheck: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
