import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Sparkles, ArrowRight, Smartphone, Wallet } from 'lucide-react-native';
import type { AuthStackParamList } from '../../../navigation/types';
import { GradientBackground, GlassButton, COLORS } from '@design-system';

const LOGO = require('../../../../assets/agra-logo.png');

export default function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    // Navigate to onboarding stack at root level
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('Onboarding', { screen: 'RoleSelection' });
    }
  };

  return (
    <GradientBackground>
      {/* Ambient orb top-right (atmospheric) */}
      <View pointerEvents="none" style={styles.orbGreen} />
      <View pointerEvents="none" style={styles.orbGold} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* HERO BLOCK */}
          <View style={styles.heroBlock}>
            <MotiView
              from={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 140, delay: 80 }}
              style={styles.logoRing}
            >
              <MotiView
                style={styles.logoGlow}
                from={{ opacity: 0.35, scale: 1 }}
                animate={{ opacity: 0.6, scale: 1.08 }}
                transition={{
                  type: 'timing',
                  duration: 2400,
                  loop: true,
                  repeatReverse: true,
                  easing: Easing.inOut(Easing.ease),
                }}
              />
              <Image source={LOGO} style={styles.logoImg} resizeMode="cover" />
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 280 }}
            >
              <Text style={styles.wordmark}>AGROTRADE</Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 420 }}
            >
              <Text style={styles.tagline}>
                Agricultural commodity escrow{'\n'}
                <Text style={styles.taglineAccent}>secured on-chain</Text>
              </Text>
            </MotiView>

            {/* Trust row */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 600 }}
              style={styles.trustRow}
            >
              <View style={styles.trustItem}>
                <View style={styles.trustDot} />
                <Text style={styles.trustText}>Celo cUSD</Text>
              </View>
              <View style={styles.trustSeparator} />
              <View style={styles.trustItem}>
                <View style={[styles.trustDot, { backgroundColor: COLORS.accentGold }]} />
                <Text style={styles.trustText}>Escrow protected</Text>
              </View>
              <View style={styles.trustSeparator} />
              <View style={styles.trustItem}>
                <View style={[styles.trustDot, { backgroundColor: COLORS.info }]} />
                <Text style={styles.trustText}>Voice-AI native</Text>
              </View>
            </MotiView>
          </View>

          {/* ACTIONS */}
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 720 }}
            style={styles.actionsBlock}
          >
            {/* Primary CTA — Get Started */}
            <GlassButton
              variant="primary"
              size="lg"
              fullWidth
              label="Get Started"
              onPress={handleGetStarted}
              leftIcon={<Sparkles size={18} color="#FFFFFF" />}
            />
            <Text style={styles.ctaHint}>Pick your role · Set up by voice or quick form</Text>

            {/* Secondary auth options */}
            <View style={styles.secondaryRow}>
              <Pressable
                style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
                onPress={() => navigation.navigate('PhoneAuth')}
              >
                <Smartphone size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.tileLabel}>{t('auth.welcome.phoneMethod')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
                onPress={() => navigation.navigate('Login')}
              >
                <Wallet size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.tileLabel}>{t('auth.welcome.walletMethod')}</Text>
              </Pressable>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              hitSlop={12}
              style={styles.signInLink}
            >
              <Text style={styles.signInText}>
                Already a member? <Text style={styles.signInAccent}>Sign in</Text>
              </Text>
              <ArrowRight size={12} color={COLORS.accentGreen} />
            </TouchableOpacity>
          </MotiView>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  actionsBlock: {
    gap: 16,
    paddingBottom: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  ctaHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    letterSpacing: 0.3,
    marginTop: -8,
    textAlign: 'center',
  },
  heroBlock: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoGlow: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: 999,
    height: 140,
    opacity: 0.4,
    position: 'absolute',
    width: 140,
  },
  logoImg: {
    borderRadius: 24,
    height: 96,
    width: 96,
  },
  logoRing: {
    alignItems: 'center',
    height: 140,
    justifyContent: 'center',
    marginBottom: 24,
    width: 140,
  },
  orbGold: {
    backgroundColor: COLORS.accentGold,
    borderRadius: 999,
    bottom: -160,
    height: 320,
    left: -120,
    opacity: 0.12,
    position: 'absolute',
    width: 320,
  },
  orbGreen: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: 999,
    height: 280,
    opacity: 0.18,
    position: 'absolute',
    right: -120,
    top: -100,
    width: 280,
  },
  safe: {
    flex: 1,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  signInAccent: {
    color: COLORS.accentGreen,
    fontWeight: '700',
  },
  signInLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  signInText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  tagline: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
  taglineAccent: {
    color: COLORS.accentGreen,
    fontWeight: '700',
  },
  tile: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  tileLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  tilePressed: {
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  trustDot: {
    backgroundColor: COLORS.accentGreen,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  trustItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  trustRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  trustSeparator: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 12,
    width: 1,
  },
  trustText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 4,
  },
});
