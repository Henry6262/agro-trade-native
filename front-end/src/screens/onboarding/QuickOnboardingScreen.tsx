import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  User,
  Building2,
  Truck,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';

import { useOnboardingStore } from '../../stores/onboarding.store';
import { GradientBackground, GlassCard, GlassButton, GlassInput, COLORS } from '../../design-system';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

type OnboardingRole = 'seller' | 'buyer' | 'transport';

const ROLES: { id: OnboardingRole; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'seller', label: 'Seller', icon: User, color: '#4ADE80', desc: 'Sell agricultural products' },
  { id: 'buyer', label: 'Buyer', icon: Building2, color: '#FCD34D', desc: 'Buy crops & commodities' },
  { id: 'transport', label: 'Transporter', icon: Truck, color: '#FCD34D', desc: 'Move goods between parties' },
];

export default function QuickOnboardingScreen() {
  const navigation = useNavigation();
  const store = useOnboardingStore();
  const [step, setStep] = useState<'role' | 'profile'>('role');
  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (role: OnboardingRole) => {
    setSelectedRole(role);
    store.setRole(role);
    setStep('profile');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !company.trim() || !email.trim()) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await store.submitOnboarding(
        { companyName: company, email } as any,
        { name, email }
      );
      navigation.navigate('OnboardingComplete' as never);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRoleStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>I am a...</Text>
      <Text style={styles.stepSubtitle}>Select your role to get started</Text>

      <View style={styles.roleGrid}>
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              onPress={() => handleRoleSelect(role.id)}
              activeOpacity={0.8}
            >
              <GlassCard
                tier={isSelected ? 'strong' : 'medium'}
                style={[styles.roleCard, isSelected && { borderColor: role.color, borderWidth: 2 }]}
                animate={false}
              >
                <View style={[styles.roleIconWrap, { backgroundColor: `${role.color}20` }]}>
                  <Icon size={28} color={role.color} />
                </View>
                <Text style={styles.roleLabel}>{role.label}</Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
                <View style={styles.roleChevron}>
                  <ChevronRight size={16} color={role.color} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.trustBadge}>
        <ShieldCheck size={14} color={COLORS.accentGreen} />
        <Text style={styles.trustText}>KYC-verified • Escrow-protected</Text>
      </View>
    </View>
  );

  const renderProfileStep = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity onPress={() => setStep('role')} style={styles.backBtn}>
        <ArrowLeft size={20} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Quick Setup</Text>
      <Text style={styles.stepSubtitle}>
        {ROLES.find((r) => r.id === selectedRole)?.label} profile
      </Text>

      <GlassInput
        label="Full Name"
        placeholder="John Doe"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <GlassInput
        label="Company Name"
        placeholder="Green Valley Farms"
        value={company}
        onChangeText={setCompany}
      />
      <GlassInput
        label="Email"
        placeholder="you@company.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.footer}>
        <GlassButton
          label={isSubmitting ? 'Setting up...' : 'Enter Dashboard'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          loading={isSubmitting}
          fullWidth
        />
      </View>
    </View>
  );

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.brand}>AGRO TRADE</Text>
            <Text style={styles.tagline}>Secure commodity escrow</Text>
          </View>

          {step === 'role' ? renderRoleStep() : renderProfileStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brand: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
  },
  tagline: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 4,
  },
  stepContainer: {
    flex: 1,
  },
  backBtn: {
    marginBottom: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  stepTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  stepSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    marginBottom: 24,
  },
  roleGrid: {
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  roleDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    position: 'absolute',
    left: 78,
    top: 40,
  },
  roleChevron: {
    marginLeft: 'auto',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    padding: 12,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.15)',
  },
  trustText: {
    color: COLORS.accentGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
  },
});
