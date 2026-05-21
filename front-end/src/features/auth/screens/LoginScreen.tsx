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
import { ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../../shared/hooks';
import { loginSchema, type LoginFormData } from '../../../schemas';
import { GlassButton, GlassCard, GlassInput, GradientBackground } from '@design-system';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { loginMutation } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema as any),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message || 'Please check your credentials and try again.'
      );
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
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>

              {/* Form card */}
              <GlassCard tier="medium" style={styles.card}>
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

                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <GlassButton
                  variant="primary"
                  label="Sign In"
                  onPress={handleSubmit(onSubmit)}
                  fullWidth
                  loading={loginMutation.isPending}
                />
              </GlassCard>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}> or </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register link */}
              <TouchableOpacity
                style={styles.registerRow}
                onPress={() => navigation.navigate('Register' as never)}
              >
                <Text style={styles.registerText}>{"Don't have an account? "}</Text>
                <Text style={styles.registerLink}>Sign up</Text>
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
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  dividerLine: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    paddingHorizontal: 12,
  },
  flex: {
    flex: 1,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  inner: {
    paddingVertical: 24,
  },
  registerLink: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  registerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
