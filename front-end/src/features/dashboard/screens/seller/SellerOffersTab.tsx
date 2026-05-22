import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { GlassCard, COLORS } from '@design-system';

export default function SellerOffersTab() {
  return (
    <View style={styles.container}>
      <GlassCard tier="subtle" style={styles.card}>
        <Bell size={24} color={COLORS.textMuted} />
        <Text style={styles.title}>Offers</Text>
        <Text style={styles.subtitle}>Incoming buyer offers will appear here.</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 8, padding: 24 },
  container: { padding: 16 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13 },
  title: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
});
