import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Check, ShoppingBag, Wheat, Truck, ArrowRight, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '@stores/auth.store';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useTourStore } from '@stores/tour.store';
import { GradientBackground, GlassButton, COLORS } from '@design-system';

type OnboardingCompleteScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'OnboardingComplete'
>;

interface Props {
  navigation: OnboardingCompleteScreenNavigationProp;
  route: any;
}

const ROLE_META = {
  buyer: {
    label: 'Buyer',
    color: COLORS.info,
    accentBg: 'rgba(96,165,250,0.18)',
    accentBorder: 'rgba(96,165,250,0.45)',
    icon: ShoppingBag,
    message:
      'Your dashboard is ready. Browse listings, lock orders into escrow, and pay on delivery.',
    perks: [
      'Browse live commodity listings',
      'Lock orders into cUSD escrow',
      'Pay only after delivery verification',
    ],
  },
  seller: {
    label: 'Seller',
    color: COLORS.accentGreen,
    accentBg: 'rgba(74,222,128,0.18)',
    accentBorder: 'rgba(74,222,128,0.45)',
    icon: Wheat,
    message: 'Your farm profile is live. Post your harvest and connect with buyers worldwide.',
    perks: [
      'List harvests with photos & specs',
      'Receive cUSD held in escrow up-front',
      'Get paid as soon as delivery clears',
    ],
  },
  transport: {
    label: 'Transporter',
    color: '#A78BFA',
    accentBg: 'rgba(167,139,250,0.18)',
    accentBorder: 'rgba(167,139,250,0.45)',
    icon: Truck,
    message:
      'Your fleet is registered. Pick up loads, deliver, and get paid the moment delivery is confirmed.',
    perks: [
      'See available routes near you',
      'Bid on premium long-haul loads',
      'Instant cUSD payout on delivery',
    ],
  },
} as const;

const normalizeToTourRole = (role: string): 'buyer' | 'seller' | 'transport' | null => {
  const lower = role.toLowerCase();
  if (lower === 'buyer') return 'buyer';
  if (lower === 'seller' || lower === 'farmer') return 'seller';
  if (lower === 'transport' || lower === 'transporter') return 'transport';
  return null;
};

const resolveRole = (raw: string | undefined): 'buyer' | 'seller' | 'transport' => {
  const tour = raw ? normalizeToTourRole(raw) : null;
  return tour ?? 'buyer';
};

export const OnboardingCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { selectedRole, resetOnboarding } = useOnboardingStore();
  const { startTour } = useTourStore();

  const role = useMemo(
    () => resolveRole(selectedRole || (user?.role as string | undefined)),
    [selectedRole, user?.role]
  );
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const handleContinue = () => {
    const userRole = selectedRole || user?.role;
    const rawRole = selectedRole || user?.role;

    if (rawRole && !useTourStore.getState().hasSeenTour) {
      const tourRole = normalizeToTourRole(rawRole);
      if (tourRole) startTour(tourRole);
    }

    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            params: {
              screen: 'Dashboard',
              params: {
                screen: 'DashboardMain',
                params: {
                  userRole,
                  showSuccessAnimation: true,
                },
              },
            },
          },
        ],
      }) as any
    );

    resetOnboarding();
  };

  return (
    <GradientBackground>
      {/* Role-tinted atmospheric glow */}
      <View
        pointerEvents="none"
        style={[styles.orbA, { backgroundColor: meta.color, opacity: 0.22 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.orbB, { backgroundColor: meta.color, opacity: 0.14 }]}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <MotiView
          key={i}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              left: p.left as `${number}%`,
              top: p.top as `${number}%`,
              backgroundColor: i % 3 === 0 ? COLORS.accentGold : meta.color,
            },
          ]}
          from={{ opacity: 0, translateY: 0 }}
          animate={{ opacity: [0, 0.8, 0], translateY: -120 }}
          transition={{
            type: 'timing',
            duration: 2800 + (i % 4) * 400,
            loop: true,
            delay: i * 250,
            easing: Easing.out(Easing.ease),
          }}
        />
      ))}

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* HERO CHECKMARK */}
          <View style={styles.heroSection}>
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 140, delay: 80 }}
              style={styles.checkOuter}
            >
              <MotiView
                style={[styles.checkGlow, { backgroundColor: meta.color }]}
                from={{ opacity: 0.35, scale: 1 }}
                animate={{ opacity: 0.55, scale: 1.1 }}
                transition={{
                  type: 'timing',
                  duration: 1600,
                  loop: true,
                  repeatReverse: true,
                  easing: Easing.inOut(Easing.ease),
                }}
              />
              <View style={[styles.checkRing, { borderColor: meta.accentBorder }]}>
                <View style={[styles.checkInner, { backgroundColor: meta.color }]}>
                  <Check size={42} color="#FFFFFF" strokeWidth={3.5} />
                </View>
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 360 }}
              style={styles.titleBlock}
            >
              <Text style={styles.title}>You&apos;re all set</Text>
              <View
                style={[
                  styles.roleBadge,
                  { borderColor: meta.accentBorder, backgroundColor: meta.accentBg },
                ]}
              >
                <Icon size={14} color={meta.color} />
                <Text style={[styles.roleBadgeText, { color: meta.color }]}>
                  {meta.label.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.subtitle}>{meta.message}</Text>
            </MotiView>
          </View>

          {/* PERKS LIST */}
          <View style={styles.perksList}>
            {meta.perks.map((perk, idx) => (
              <MotiView
                key={perk}
                from={{ opacity: 0, translateX: -16 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 200,
                  delay: 540 + idx * 110,
                }}
                style={styles.perkRow}
              >
                <View style={[styles.perkDotRing, { borderColor: meta.accentBorder }]}>
                  <View style={[styles.perkDot, { backgroundColor: meta.color }]} />
                </View>
                <Text style={styles.perkText}>{perk}</Text>
              </MotiView>
            ))}
          </View>

          {/* CTA */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 940 }}
            style={styles.ctaBlock}
          >
            <GlassButton
              label="Enter your dashboard"
              onPress={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Sparkles size={18} color="#FFFFFF" />}
            />
            <View style={styles.hintRow}>
              <ArrowRight size={11} color="rgba(255,255,255,0.4)" />
              <Text style={styles.hint}>We&apos;ll show you around when you arrive</Text>
            </View>
          </MotiView>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const PARTICLES = [
  { left: '12%', top: '40%' },
  { left: '22%', top: '52%' },
  { left: '78%', top: '38%' },
  { left: '88%', top: '48%' },
  { left: '32%', top: '60%' },
  { left: '64%', top: '58%' },
  { left: '18%', top: '70%' },
  { left: '74%', top: '68%' },
];

const styles = StyleSheet.create({
  checkGlow: {
    borderRadius: 999,
    height: 180,
    opacity: 0.4,
    position: 'absolute',
    width: 180,
  },
  checkInner: {
    alignItems: 'center',
    borderRadius: 56,
    elevation: 12,
    height: 112,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: 112,
  },
  checkOuter: {
    alignItems: 'center',
    height: 180,
    justifyContent: 'center',
    marginBottom: 28,
    width: 180,
  },
  checkRing: {
    alignItems: 'center',
    borderRadius: 72,
    borderWidth: 2,
    height: 144,
    justifyContent: 'center',
    width: 144,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  ctaBlock: {
    gap: 12,
    paddingBottom: 12,
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 16,
  },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  hintRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  orbA: {
    borderRadius: 999,
    height: 340,
    position: 'absolute',
    right: -140,
    top: -120,
    width: 340,
  },
  orbB: {
    borderRadius: 999,
    bottom: -140,
    height: 280,
    left: -100,
    position: 'absolute',
    width: 280,
  },
  particle: {
    borderRadius: 2,
    height: 4,
    position: 'absolute',
    width: 4,
  },
  perkDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  perkDotRing: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  perkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  perkText: {
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  perksList: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 2,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  roleBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  safe: {
    flex: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
    textAlign: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 12,
    textAlign: 'center',
  },
  titleBlock: {
    alignItems: 'center',
  },
});
