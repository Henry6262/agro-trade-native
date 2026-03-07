import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { GlassButton } from '../../../design-system/GlassButton';
import { useAuthStore } from '../../../stores/auth.store';
import { authService } from '../../../services/authService';
import type { AuthStackParamList } from '../../../navigation/types';
import type { User } from '../../../shared/types';

type Step = 'phone' | 'otp';

const COUNTRY_CODES = [
  { flag: '🇧🇬', code: '+359', label: 'BG' },
  { flag: '🇬🇧', code: '+44', label: 'GB' },
  { flag: '🇩🇪', code: '+49', label: 'DE' },
  { flag: '🇺🇸', code: '+1', label: 'US' },
];

export default function PhoneAuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login } = useAuthStore();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('phone');
  const [countryIndex, setCountryIndex] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const country = COUNTRY_CODES[countryIndex];
  const fullPhone = `${country.code}${phone}`;

  // Countdown timer
  useEffect(() => {
    if (!resendAt) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [resendAt]);

  const handleSend = async () => {
    if (phone.trim().length < 7) {
      Alert.alert(t('common.error'), t('auth.phone.errors.invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      await authService.phoneOtpSend(fullPhone);
      setResendAt(Date.now() + 60_000);
      setSecondsLeft(60);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert(t('common.error'), msg ?? t('auth.phone.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert(t('common.error'), t('auth.phone.errors.incompleteOtp'));
      return;
    }
    setLoading(true);
    try {
      const result = await authService.phoneOtpVerify(fullPhone, code);
      login(result.user as User, result.access_token, result.refresh_token);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert(t('common.error'), msg ?? t('auth.phone.errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{t('auth.phone.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.phone.subtitle')}</Text>

            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countryBtn}
                onPress={() => setCountryIndex((i) => (i + 1) % COUNTRY_CODES.length)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{country.flag}</Text>
                <Text style={styles.countryText}>{country.code}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                placeholder={t('auth.phone.phonePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>

            <GlassButton
              label={loading ? t('auth.phone.sending') : t('auth.phone.sendCode')}
              onPress={handleSend}
              variant="primary"
              disabled={loading}
              style={styles.cta}
            />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← {t('common.back')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // OTP step
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{t('auth.phone.otpTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.phone.otpSubtitle', { phone: fullPhone })}</Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  otpRefs.current[i] = r;
                }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(v) => handleOtpChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                selectTextOnFocus
              />
            ))}
          </View>

          <GlassButton
            label={loading ? t('auth.phone.verifying') : t('auth.phone.verify')}
            onPress={handleVerify}
            variant="primary"
            disabled={loading}
            style={styles.cta}
          />

          <TouchableOpacity
            disabled={secondsLeft > 0 || loading}
            onPress={handleSend}
            style={styles.backBtn}
          >
            <Text style={[styles.backText, secondsLeft > 0 && styles.dimmed]}>
              {secondsLeft > 0
                ? t('auth.phone.resendIn', { seconds: secondsLeft })
                : t('auth.phone.resend')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
            <Text style={styles.backText}>{t('auth.phone.changeNumber')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignItems: 'center', marginTop: 16 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
  },
  countryBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  countryText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  cta: { marginTop: 4 },
  dimmed: { opacity: 0.35 },
  flag: { fontSize: 20 },
  kav: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  otpBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    height: 56,
    textAlign: 'center',
    width: 46,
  },
  otpBoxFilled: {
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderColor: 'rgba(52,211,153,0.6)',
  },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
  phoneInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    color: '#fff',
    flex: 1,
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phoneRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  safe: { backgroundColor: '#0a0a0f', flex: 1 },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 28 },
  title: { color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: '700', marginBottom: 6 },
});
