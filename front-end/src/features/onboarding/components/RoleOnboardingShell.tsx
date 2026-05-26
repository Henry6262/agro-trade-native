import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Mail, User, Mic, ArrowRight, type LucideIcon } from 'lucide-react-native';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { GradientBackground, GlassInput, GlassButton, COLORS } from '@design-system';

type NavProp = NativeStackNavigationProp<OnboardingStackParamList>;

export interface RoleOnboardingShellProps {
  role: 'buyer' | 'seller' | 'transport';
  aiRole: 'buyer' | 'seller' | 'transporter';
  illustration: ImageSourcePropType;
  /** Tone for accent color */
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  /** Big role label, e.g. "Buyer" */
  roleLabel: string;
  /** Headline line 1 */
  headline: string;
  /** Subheading after headline */
  subhead: string;
  /** Lucide icon for the company-name field */
  companyIcon: LucideIcon;
  /** Placeholder for the company-name field */
  companyPlaceholder: string;
  /** Label for the company-name field */
  companyLabel: string;
}

const haptic = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const RoleOnboardingShell: React.FC<RoleOnboardingShellProps> = ({
  aiRole,
  illustration,
  accentColor,
  headline,
  subhead,
  companyIcon: CompanyIcon,
  companyPlaceholder,
  companyLabel,
}) => {
  const navigation = useNavigation<NavProp>();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && company.trim().length > 0 && email.trim().length > 0;

  const handleComplete = () => {
    haptic();
    if (!canSubmit) {
      Alert.alert('A few more details', 'Please fill in all fields to continue.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigation.navigate('OnboardingComplete');
    }, 700);
  };

  const handleSwitchToAI = () => {
    haptic();
    (navigation as any).getParent()?.navigate('AIMode', {
      role: aiRole,
      mode: 'onboarding',
    });
  };

  return (
    <GradientBackground>
      {/* Role-tinted orb */}
      <View
        pointerEvents="none"
        style={[styles.orb, { backgroundColor: accentColor, opacity: 0.18 }]}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* Floating back button — absolute so it doesn't eat a full row */}
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [styles.backBtnFloating, pressed && styles.backBtnPressed]}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero illustration */}
            <View style={styles.heroBlock}>
              <MotiView
                from={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 140, delay: 80 }}
                style={styles.illustrationWrap}
              >
                <Image source={illustration} style={styles.illustration} resizeMode="contain" />
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 200, delay: 280 }}
              >
                <Text style={styles.eyebrow}>STEP 3 OF 3 · PROFILE</Text>
                <Text style={styles.headline}>{headline}</Text>
                <Text style={styles.subhead}>{subhead}</Text>
              </MotiView>
            </View>

            {/* Form card */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 440 }}
              style={styles.formCard}
            >
              <GlassInput
                label="Full name"
                placeholder="Your full name"
                value={name}
                onChangeText={setName}
                leftIcon={<User size={16} color={COLORS.textMuted} />}
                autoComplete="name"
                autoCapitalize="words"
              />
              <GlassInput
                label={companyLabel}
                placeholder={companyPlaceholder}
                value={company}
                onChangeText={setCompany}
                leftIcon={<CompanyIcon size={16} color={COLORS.textMuted} />}
              />
              <GlassInput
                label="Email"
                placeholder="you@business.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon={<Mail size={16} color={COLORS.textMuted} />}
              />
            </MotiView>

            {/* Switch-to-voice card */}
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200, delay: 580 }}
            >
              <Pressable onPress={handleSwitchToAI}>
                {({ pressed }) => (
                  <View
                    style={[styles.switchCard, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}
                  >
                    <Mic size={18} color={accentColor} />
                    <View style={styles.switchTextBlock}>
                      <Text style={[styles.switchTitle, { color: accentColor }]}>
                        Prefer voice?
                      </Text>
                      <Text style={styles.switchSubtitle}>Set up by talking, not typing</Text>
                    </View>
                    <ArrowRight size={16} color={accentColor} />
                  </View>
                )}
              </Pressable>
            </MotiView>
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <GlassButton
              label={submitting ? 'Setting up your profile…' : 'Continue'}
              onPress={handleComplete}
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={!canSubmit || submitting}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  backBtnFloating: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    left: 20,
    position: 'absolute',
    top: 8,
    width: 40,
    zIndex: 10,
  },
  backBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  illustration: {
    height: 220,
    width: 260,
  },
  illustrationWrap: {
    alignItems: 'center',
    height: 230,
    justifyContent: 'center',
    marginBottom: 4,
    width: 280,
  },
  kav: {
    flex: 1,
  },
  orb: {
    borderRadius: 999,
    height: 360,
    position: 'absolute',
    right: -140,
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
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  subhead: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 20,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  switchCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  switchSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 1,
  },
  switchTextBlock: {
    flex: 1,
  },
  switchTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
