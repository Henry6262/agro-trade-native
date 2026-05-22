import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Truck, Mail, User, CheckCircle2 } from 'lucide-react-native';
import { OnboardingStackParamList } from '../../../../navigation/types';
import { GradientBackground, GlassCard, GlassButton, GlassInput, COLORS } from '@design-system';
import { MotiView } from 'moti';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'TransporterOnboardingFlow'
>;

export const TransporterOnboardingFlowScreen: React.FC = () => {
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
            <Truck size={32} color={COLORS.accentGold} />
            <Text style={styles.title}>Transporter Profile</Text>
            <Text style={styles.subtitle}>Register your fleet and transport capacity</Text>
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
              placeholder="Swift Transport LLC"
              value={company}
              onChangeText={setCompany}
              leftIcon={<Truck size={16} color={COLORS.textMuted} />}
            />
            <GlassInput
              label="Email"
              placeholder="you@transport.com"
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
  formCard: { marginBottom: 20, padding: 16 },
  header: { alignItems: 'center', marginBottom: 28 },
  scroll: { padding: 20, paddingBottom: 40, paddingTop: 60 },
  submitBtn: { marginTop: 8 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 12 },
});
