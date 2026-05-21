import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Leaf, Users, Droplets, Sun, ArrowUpRight, Sprout, ShieldCheck, Zap } from 'lucide-react-native';
import { GlassCard, COLORS, GLASS } from '../../../design-system';
import { MotiView } from 'moti';

/* ─── Helpers ─── */

function CircularProgress({
  value,
  color,
  size = 52,
  stroke = 4,
  children,
}: {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  const rot = -90 + pct * 3.6;
  const half = size / 2;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* background ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: stroke,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      />
      {/* first half (0-50%) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: stroke,
          borderColor: color,
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
          transform: [{ rotate: `${rot}deg` }],
          opacity: pct <= 50 ? 1 : 0,
        }}
      />
      {/* second half (>50%) - full right half visible, then rotate remainder */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: stroke,
          borderColor: color,
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
          transform: [{ rotate: `${rot}deg` }],
          opacity: pct > 50 ? 1 : 0,
        }}
      />
      {/* mask for second half trick */}
      {pct > 50 && (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: stroke,
            borderColor: color,
            borderRightColor: 'transparent',
            borderTopColor: 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
      )}
      {children}
    </View>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.progressTrack}>
      <MotiView
        from={{ width: '0%' }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ type: 'timing', duration: 900, delay: 400 }}
        style={[styles.progressFill, { backgroundColor: color }]}
      />
    </View>
  );
}

/* ─── Data ─── */

const IMPACT_METRICS = [
  {
    label: 'Farmers Supported',
    value: '1,247',
    sub: 'Across Bulgaria & Greece corridor',
    icon: Users,
    color: COLORS.accentGreen,
    progress: 82,
    progressLabel: '82% of 2026 goal',
  },
  {
    label: 'CO₂ Saved',
    value: '340 t',
    sub: 'Via optimized transport routing',
    icon: Leaf,
    color: COLORS.accentGreen,
    progress: 68,
    progressLabel: '68% of annual target',
  },
  {
    label: 'Water Efficiency',
    value: '+18%',
    sub: 'Better irrigation via NIR data',
    icon: Droplets,
    color: COLORS.info,
    progress: 18,
    progressLabel: 'YoY improvement',
  },
  {
    label: 'Solar Energy',
    value: '12 MWh',
    sub: 'Storage bases powered by solar',
    icon: Sun,
    color: COLORS.accentGold,
    progress: 45,
    progressLabel: '45% of base capacity',
  },
];

const RECENT_IMPACTS = [
  {
    title: 'Agro Trading Bulgaria — AGRoGEo Project',
    desc: 'EU Interreg V-A funded mobile NIR labs now serving 180+ farmers with calibrated grain analysis.',
    date: 'May 2026',
    tag: 'Innovation',
    tagColor: COLORS.accentGreen,
    icon: Sprout,
  },
  {
    title: 'Cross-border Greece Corridor',
    desc: 'Reduced manual data entry by 94% via digitized logistics. Trucks now route through optimized paths.',
    date: 'April 2026',
    tag: 'Logistics',
    tagColor: COLORS.info,
    icon: Zap,
  },
  {
    title: 'SkyInspect Drone Layer',
    desc: 'Drone crop monitoring covering 2,400 ha with multispectral imaging for early pest detection.',
    date: 'March 2026',
    tag: 'Technology',
    tagColor: COLORS.accentGold,
    icon: ShieldCheck,
  },
];

/* ─── Component ─── */

export default function ImpactScreen() {
  return (
    <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <MotiView from={{ opacity: 0, translateY: -12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }}>
          <Text style={styles.header}>ESG Impact</Text>
          <Text style={styles.subheader}>Real-world outcomes from verified trade</Text>
        </MotiView>

        {/* Hero stat cards */}
        <View style={styles.statsGrid}>
          {IMPACT_METRICS.map((m, i) => {
            const Icon = m.icon;
            return (
              <MotiView
                key={i}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 200, delay: i * 80 }}
                style={{ width: '47%', minWidth: 140 }}
              >
                <GlassCard tier="medium" style={styles.statCard} delay={i * 60}>
                  <View style={styles.statTopRow}>
                    <View style={[styles.iconCircle, { backgroundColor: `${m.color}18`, borderColor: `${m.color}33` }]}>
                      <Icon size={20} color={m.color} />
                    </View>
                    <CircularProgress value={m.progress} color={m.color} size={48} stroke={3}>
                      <Text style={[styles.circularValue, { color: m.color }]}>{m.progress}%</Text>
                    </CircularProgress>
                  </View>

                  <Text style={[styles.statValue, { color: m.color }]}>{m.value}</Text>
                  <Text style={styles.statLabel}>{m.label}</Text>
                  <Text style={styles.statSub}>{m.sub}</Text>

                  <ProgressBar value={m.progress} color={m.color} />
                  <Text style={styles.progressLabel}>{m.progressLabel}</Text>
                </GlassCard>
              </MotiView>
            );
          })}
        </View>

        {/* Summary banner */}
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 16, stiffness: 180, delay: 350 }}
        >
          <GlassCard tier="strong" style={styles.summaryBanner}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryIconWrap, { backgroundColor: `${COLORS.accentGreen}18` }]}>
                <Leaf size={22} color={COLORS.accentGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>AGRoGEo Project Milestone</Text>
                <Text style={styles.summaryDesc}>
                  EU-funded initiative now active across 3 regions with mobile NIR labs and satellite-linked
                  storage bases.
                </Text>
              </View>
              <ArrowUpRight size={18} color={COLORS.accentGreen} />
            </View>
          </GlassCard>
        </MotiView>

        {/* Milestones */}
        <Text style={styles.sectionTitle}>Recent Milestones</Text>
        {RECENT_IMPACTS.map((item, i) => {
          const Icon = item.icon;
          return (
            <MotiView
              key={i}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 400 + i * 70 }}
            >
              <GlassCard tier="subtle" style={styles.milestoneCard} delay={i * 60}>
                <View style={styles.milestoneHeader}>
                  <View style={[styles.milestoneIconWrap, { backgroundColor: `${item.tagColor}15` }]}>
                    <Icon size={16} color={item.tagColor} />
                  </View>
                  <View style={styles.milestoneMeta}>
                    <Text style={styles.milestoneTitle}>{item.title}</Text>
                    <View style={styles.milestoneTagRow}>
                      <View style={[styles.tagPill, { backgroundColor: `${item.tagColor}22` }]}>
                        <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
                      </View>
                      <Text style={styles.milestoneDate}>{item.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.milestoneDesc}>{item.desc}</Text>
              </GlassCard>
            </MotiView>
          );
        })}
      </ScrollView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginBottom: 4, letterSpacing: -0.5 },
  subheader: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 22 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    padding: 14,
    width: '100%',
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  circularValue: {
    fontSize: 10,
    fontWeight: '800',
    position: 'absolute',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  statSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },

  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },

  summaryBanner: {
    marginBottom: 24,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  summaryDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  milestoneCard: {
    marginBottom: 10,
    padding: 14,
  },
  milestoneHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  milestoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneMeta: {
    flex: 1,
  },
  milestoneTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 19,
  },
  milestoneTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  milestoneDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  milestoneDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
