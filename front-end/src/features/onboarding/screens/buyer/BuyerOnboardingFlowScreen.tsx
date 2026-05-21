import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Building2, Mail, User, CheckCircle2 } from 'lucide-react-native';
import { OnboardingStackParamList } from '../../../../navigation/types';
import { GradientBackground, GlassCard, GlassButton, GlassInput, COLORS } from '@design-system';
import { MotiView } from 'moti';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'BuyerOnboardingFlow'>;

export const BuyerOnboardingFlowScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = () => {
    if (!name.trim() || !company.trim() || !email.trim()) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigation.navigate('OnboardingComplete');
    }, 800);
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        >
          <View style={styles.header}>
            <Building2 size={32} color={COLORS.info} />
            <Text style={styles.title}>Buyer Profile</Text>
            <Text style={styles.subtitle}>Tell us about your procurement needs</Text>
          </View>

          <GlassCard tier="medium" style={styles.formCard}>
            <GlassInput
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              leftIcon={<User size={16} color={COLORS.textMuted} />}
            />
            <GlassInput
              label="Company Name"
              placeholder="Hellenic Grain Co."
              value={company}
              onChangeText={setCompany}
              leftIcon={<Building2 size={16} color={COLORS.textMuted} />}
            />
            <GlassInput
              label="Email"
              placeholder="you@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={16} color={COLORS.textMuted} />}
            />
          </GlassCard>

          <GlassButton
            label={submitting ? 'Saving...' : 'Complete Setup'}
            onPress={handleComplete}
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            leftIcon={<CheckCircle2 size={16} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </MotiView>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 12 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  formCard: { padding: 16, marginBottom: 20 },
  submitBtn: { marginTop: 8 },
});
