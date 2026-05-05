import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AuthStackParamList } from '../../navigation/types';

interface AuthTileProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function AuthTile({ icon, title, subtitle, onPress }: AuthTileProps) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.appName}>{t('auth.welcome.title')}</Text>
          <Text style={styles.tagline}>{t('auth.welcome.tagline')}</Text>
        </View>

        <Text style={styles.chooseLabel}>{t('auth.welcome.chooseMethod')}</Text>
        <View style={styles.tilesRow}>
          <AuthTile
            icon="📱"
            title={t('auth.welcome.phoneMethod')}
            subtitle={t('auth.welcome.phoneSubtitle')}
            onPress={() => navigation.navigate('PhoneAuth')}
          />
          <AuthTile
            icon="🔐"
            title={t('auth.welcome.walletMethod')}
            subtitle={t('auth.welcome.walletSubtitle')}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appName: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  chooseLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 52 },
  logo: { fontSize: 52, marginBottom: 8 },
  safe: { backgroundColor: '#0a0a0f', flex: 1 },
  tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 },
  tile: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    paddingVertical: 28,
  },
  tileIcon: { fontSize: 36 },
  tileSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
  tileTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '700' },
  tilesRow: { flexDirection: 'row', gap: 12 },
});
