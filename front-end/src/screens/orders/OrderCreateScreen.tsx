import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ChevronLeft, ShoppingCart, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { GlassCard, GlassButton, COLORS, GLASS } from '../../design-system';
import { MotiView } from 'moti';

export default function OrderCreateScreen() {
  const navigation = useNavigation();
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!product.trim() || !quantity.trim()) {
      Alert.alert('Required', 'Please enter a product and quantity.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Order Created', `Request for ${quantity} tons of ${product} submitted.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassCard tier="medium" style={styles.formCard}>
          <Text style={styles.label}>Product</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hard Red Winter Wheat"
            placeholderTextColor={COLORS.textMuted}
            value={product}
            onChangeText={setProduct}
          />

          <Text style={styles.label}>Quantity (tons)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 100"
            placeholderTextColor={COLORS.textMuted}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Delivery preferences, quality requirements..."
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </GlassCard>

        <View style={styles.infoRow}>
          <AlertCircle size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            Your order will be broadcast to verified sellers. Escrow protects both parties.
          </Text>
        </View>

        <GlassButton
          label={loading ? 'Submitting...' : 'Create Order Request'}
          onPress={handleCreate}
          variant="primary"
          size="lg"
          style={styles.submitButton}
          disabled={loading}
          leftIcon={<ShoppingCart size={16} color="#000" />}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { height: 40, justifyContent: 'center', width: 40 },
  container: { backgroundColor: '#0a0a0f', flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  formCard: { marginBottom: 16, padding: 16 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  headerSpacer: { width: 40 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  infoRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  infoText: {
    color: COLORS.textMuted,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: GLASS.subtle.fill,
    borderColor: GLASS.subtle.border,
    borderRadius: 10,
    borderWidth: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  submitButton: { marginTop: 8 },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
});
