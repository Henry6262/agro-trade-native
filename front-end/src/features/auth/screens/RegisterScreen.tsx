import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../../shared/hooks';
import { GlassButton, GlassCard, GlassInput, GradientBackground } from '@design-system';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['buyer', 'seller']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { registerMutation } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema as any),
    defaultValues: {
      role: 'buyer',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data as any);
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.response?.data?.message || 'Please try again.');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inner}>
              {/* Back button */}
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ChevronLeft size={20} color="rgba(255,255,255,0.6)" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              {/* Header */}
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join the agricultural marketplace</Text>

              {/* Form card */}
              <GlassCard tier="medium" style={styles.card}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <GlassInput
                      label="Full Name"
                      value={value}
                      onChangeText={onChange}
                      placeholder="Your full name"
                      autoCapitalize="words"
                      error={errors.name?.message}
                    />
                  )}
                />

                <Controller
                  name="email"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <GlassInput
                      label="Email"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="your@email.com"
                      error={errors.email?.message}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <GlassInput
                      label="Password"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry
                      placeholder="••••••••"
                      error={errors.password?.message}
                    />
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <GlassInput
                      label="Confirm Password"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry
                      placeholder="••••••••"
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />

                <GlassButton
                  variant="primary"
                  label="Create Account"
                  onPress={handleSubmit(onSubmit)}
                  fullWidth
                  loading={registerMutation.isPending}
                />
              </GlassCard>

              {/* Sign in link */}
              <TouchableOpacity
                style={styles.signinRow}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={styles.signinText}>Already have an account? </Text>
                <Text style={styles.signinLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginBottom: 32,
    marginTop: 16,
  },
  backText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginLeft: 4,
  },
  card: {
    marginBottom: 24,
  },
  flex: {
    flex: 1,
  },
  inner: {
    paddingVertical: 24,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  signinLink: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  signinRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signinText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
});
