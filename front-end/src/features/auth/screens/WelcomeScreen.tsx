import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Wheat, Sparkles } from 'lucide-react-native';
import { GlassButton, GradientBackground } from '@design-system';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* TOP: Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.iconCircle}>
              <Wheat size={48} color="#4ADE80" />
            </View>

            <Text style={styles.wordmark}>AGRO TRADE</Text>

            <Text style={styles.tagline}>The future of agricultural trade</Text>
          </View>

          {/* BOTTOM: Action buttons */}
          <View style={styles.actions}>
            <GlassButton
              variant="primary"
              label="Get Started"
              fullWidth
              onPress={() => navigation.getParent()?.navigate('Onboarding' as never)}
            />
            <GlassButton
              variant="secondary"
              label="Sign In"
              fullWidth
              onPress={() => navigation.navigate('Login' as never)}
              style={styles.secondaryBtn}
            />

            {/* AI Mode Entry */}
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('AIMode', { role: 'seller', mode: 'onboarding' })}
              style={styles.aiModeBtn}
            >
              <View style={styles.aiModeIcon}>
                <Sparkles size={20} color="#8B5CF6" />
              </View>
              <View style={styles.aiModeTextBlock}>
                <Text style={styles.aiModeTitle}>Говорете с AI</Text>
                <Text style={styles.aiModeSubtitle}>Регистрация с глас — без писане</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register' as never)}
              style={styles.registerLink}
            >
              <Text style={styles.registerLinkText}>New here? Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    paddingBottom: 40,
  },
  aiModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginTop: 4,
  },
  aiModeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiModeTextBlock: {
    flex: 1,
  },
  aiModeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  aiModeSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    justifyContent: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    width: 100,
  },
  logoArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  registerLinkText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  safeArea: {
    flex: 1,
  },
  secondaryBtn: {
    marginTop: 0,
  },
  tagline: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: 24,
  },
});
