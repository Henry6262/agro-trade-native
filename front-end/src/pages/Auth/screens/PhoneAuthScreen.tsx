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
import { GlassButton } from '../../../design-system/GlassButton';
import { useAuthStore } from '../../../stores/auth.store';
import { authService } from '../../../services/authService';

type Step = 'phone' | 'otp';

const COUNTRY_CODES = [
  { flag: '🇧🇬', code: '+359', label: 'BG' },
  { flag: '🇬🇧', code: '+44', label: 'GB' },
  { flag: '🇩🇪', code: '+49', label: 'DE' },
  { flag: '🇺🇸', code: '+1', label: 'US' },
];

export default function PhoneAuthScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();

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
      Alert.alert('Invalid phone', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      await authService.phoneOtpSend(fullPhone);
      setResendAt(Date.now() + 60_000);
      setSecondsLeft(60);
      setStep('otp');
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message ?? 'Failed to send code. Please try again.'
      );
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
      Alert.alert('Incomplete code', 'Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.phoneOtpVerify(fullPhone, code);
      login(result.user, result.access_token, result.refresh_token);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Invalid code. Please try again.');
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
            <Text style={styles.title}>Enter your phone</Text>
            <Text style={styles.subtitle}>We&apos;ll send a 6-digit code to verify</Text>

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
                placeholder="88 123 456"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>

            <GlassButton
              label={loading ? 'Sending…' : 'Send Code'}
              onPress={handleSend}
              variant="primary"
              disabled={loading}
              style={styles.cta}
            />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
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
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.subtitle}>Sent to {fullPhone}</Text>

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
            label={loading ? 'Verifying…' : 'Verify'}
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
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
            <Text style={styles.backText}>← Change number</Text>
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
