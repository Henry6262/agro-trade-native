import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wheat } from 'lucide-react-native';
import { GlassCard, COLORS } from '@design-system';

export default function SellerProductsTab() {
  return (
    <View style={styles.container}>
      <GlassCard tier="subtle" style={styles.card}>
        <Wheat size={24} color={COLORS.textMuted} />
        <Text style={styles.title}>Products</Text>
        <Text style={styles.subtitle}>Your product listings will appear here.</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { alignItems: 'center', padding: 24, gap: 8 },
  title: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13 },
});
