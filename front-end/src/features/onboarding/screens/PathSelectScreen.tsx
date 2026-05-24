import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Mic, ArrowLeft, ArrowRight, FileText, Sparkles, Zap } from 'lucide-react-native';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { GradientBackground, COLORS } from '@design-system';

type NavProp = NativeStackNavigationProp<OnboardingStackParamList, 'PathSelect'>;
type Rt = RouteProp<OnboardingStackParamList, 'PathSelect'>;

// AIMode uses 'transporter', RoleSelection uses 'transport' — translate here.
const aiRoleFor = (r: 'buyer' | 'seller' | 'transport') => (r === 'transport' ? 'transporter' : r);

const ROLE_META = {
  buyer: {
    label: 'Buyer',
    color: COLORS.info, // blue
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.45)',
    glow: '#60A5FA',
    headline: 'Source quality commodities',
    aiHint: 'Tell our assistant what you need to buy — quantity, quality, delivery location.',
    formHint: 'Quick 3-field profile setup',
  },
  seller: {
    label: 'Seller',
    color: COLORS.accentGreen,
    bg: 'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.45)',
    glow: '#4ADE80',
    headline: 'List your harvest, get paid in cUSD',
    aiHint: 'Talk through what you grow, when you harvest, your asking price.',
    formHint: 'Quick 3-field farm profile',
  },
  transport: {
    label: 'Transporter',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.45)',
    glow: '#A78BFA',
    headline: 'Move grain, get paid on delivery',
    aiHint: 'Describe your fleet, routes, and capacity — by voice.',
    formHint: 'Quick 3-field fleet profile',
  },
} as const;

const haptic = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const PathSelectScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<Rt>();
  const role = route.params?.role ?? 'seller';
  const meta = useMemo(() => ROLE_META[role], [role]);

  const goAI = () => {
    haptic();
    (navigation as any).getParent()?.navigate('AIMode', {
      role: aiRoleFor(role),
      mode: 'onboarding',
    });
  };

  const goManual = () => {
    haptic();
    switch (role) {
      case 'buyer':
        navigation.navigate('BuyerOnboardingFlow');
        break;
      case 'seller':
        navigation.navigate('SellerOnboardingFlow');
        break;
      case 'transport':
        navigation.navigate('TransporterOnboardingFlow');
        break;
    }
  };

  return (
    <GradientBackground>
      {/* Atmospheric role-tinted orb */}
      <View
        pointerEvents="none"
        style={[styles.orb, { backgroundColor: meta.glow, opacity: 0.18 }]}
      />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={[styles.roleChip, { borderColor: meta.border, backgroundColor: meta.bg }]}>
              <View style={[styles.roleDot, { backgroundColor: meta.glow }]} />
              <Text style={styles.roleChipText}>{meta.label}</Text>
            </View>
          </View>

          <View style={styles.backBtn} />
        </View>

        {/* Title block */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 80 }}
          style={styles.titleBlock}
        >
          <Text style={styles.eyebrow}>STEP 2 OF 3 · SETUP STYLE</Text>
          <Text style={styles.title}>How would you like{'\n'}to set up your profile?</Text>
          <Text style={styles.subtitle}>{meta.headline}</Text>
        </MotiView>

        {/* PATH CARDS */}
        <View style={styles.cardsContainer}>
          {/* AI VOICE — primary hero */}
          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.97 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 16, stiffness: 180, delay: 220 }}
          >
            <Pressable onPress={goAI}>
              {({ pressed }) => (
                <View
                  style={[
                    styles.aiCard,
                    {
                      borderColor: meta.border,
                      shadowColor: meta.glow,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    },
                  ]}
                >
                  {/* Pulsing glow ring */}
                  <MotiView
                    pointerEvents="none"
                    style={[styles.aiCardGlow, { backgroundColor: meta.glow }]}
                    from={{ opacity: 0.18, scale: 1 }}
                    animate={{ opacity: 0.32, scale: 1.06 }}
                    transition={{
                      type: 'timing',
                      duration: 1600,
                      loop: true,
                      repeatReverse: true,
                      easing: Easing.inOut(Easing.ease),
                    }}
                  />

                  {/* Top row: icon + badge */}
                  <View style={styles.aiCardTop}>
                    <View style={styles.aiIconWrap}>
                      <View style={[styles.aiIconRing, { borderColor: meta.border }]}>
                        <Mic size={24} color={meta.glow} />
                      </View>
                      <VoiceWaveform color={meta.glow} />
                    </View>
                    <View style={styles.aiBadge}>
                      <Sparkles size={11} color={COLORS.accentGold} />
                      <Text style={styles.aiBadgeText}>RECOMMENDED</Text>
                    </View>
                  </View>

                  <Text style={styles.aiTitle}>Set up by voice</Text>
                  <Text style={styles.aiSubtitle}>{meta.aiHint}</Text>

                  <View style={styles.aiFooter}>
                    <View style={styles.aiMeta}>
                      <Zap size={13} color={meta.glow} />
                      <Text style={[styles.aiMetaText, { color: meta.glow }]}>~60 seconds</Text>
                    </View>
                    <View style={styles.aiCta}>
                      <Text style={styles.aiCtaText}>Start</Text>
                      <ArrowRight size={14} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              )}
            </Pressable>
          </MotiView>

          {/* MANUAL FORM — secondary */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 380 }}
          >
            <Pressable onPress={goManual}>
              {({ pressed }) => (
                <View style={[styles.manualCard, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
                  <View style={styles.manualIconWrap}>
                    <FileText size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <View style={styles.manualText}>
                    <Text style={styles.manualTitle}>Quick form</Text>
                    <Text style={styles.manualSubtitle}>{meta.formHint}</Text>
                  </View>
                  <ArrowRight size={16} color="rgba(255,255,255,0.4)" />
                </View>
              )}
            </Pressable>
          </MotiView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>You can switch between voice and form anytime</Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const VoiceWaveform: React.FC<{ color: string }> = ({ color }) => {
  const bars = [0, 1, 2, 3];
  return (
    <View style={styles.waveform}>
      {bars.map((i) => (
        <MotiView
          key={i}
          style={[styles.waveBar, { backgroundColor: color }]}
          from={{ scaleY: 0.4 }}
          animate={{ scaleY: 1 }}
          transition={{
            type: 'timing',
            duration: 600 + i * 80,
            loop: true,
            repeatReverse: true,
            delay: i * 90,
            easing: Easing.inOut(Easing.ease),
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  aiBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(252,211,77,0.14)',
    borderColor: 'rgba(252,211,77,0.35)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  aiBadgeText: {
    color: COLORS.accentGold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  aiCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1.5,
    elevation: 12,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  aiCardGlow: {
    borderRadius: 999,
    height: 220,
    position: 'absolute',
    right: -80,
    top: -80,
    width: 220,
  },
  aiCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  aiCta: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  aiCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  aiFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  aiIconRing: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  aiIconWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  aiMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  aiMetaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  aiSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
  aiTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardsContainer: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 20,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  manualCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  manualIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  manualSubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 2,
  },
  manualText: {
    flex: 1,
  },
  manualTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  orb: {
    borderRadius: 999,
    height: 360,
    left: -120,
    position: 'absolute',
    top: -140,
    width: 360,
  },
  roleChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roleChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  roleDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  safe: {
    flex: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 32,
    marginBottom: 8,
  },
  titleBlock: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  waveBar: {
    borderRadius: 1.5,
    height: 16,
    width: 3,
  },
  waveform: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    height: 20,
  },
});
