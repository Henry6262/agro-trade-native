import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { X, Send, AlertCircle, DollarSign, Package } from 'lucide-react-native';
import { MatchingSeller, TradeOperation, TradeSeller } from '../../../../../types/trade-operations';
import { negotiationService } from '@services/negotiationService';
import { apiClient } from '@services/api';
import { GlassCard, GlassButton, GlassInput } from '../../../../../design-system';
import { COLORS } from '../../../../../design-system';

interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  seller?: MatchingSeller | null;
  sellerId?: string;
  tradeOperationId: string;
  tradeOperation?: TradeOperation | null;
  onOfferSent?: () => void;
  buyerMaxPrice?: number;
  requiredQuantity?: number;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  visible,
  onClose,
  seller,
  sellerId,
  tradeOperationId,
  tradeOperation,
  onOfferSent,
  buyerMaxPrice = 0,
  requiredQuantity = 0,
}) => {
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState('');
  const [terms, setTerms] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (seller) {
      setOfferPrice(seller.askingPrice?.toString() || '');
      const defaultQuantity = Math.min(
        seller.availableQuantity || 0,
        requiredQuantity || seller.availableQuantity || 0
      );
      setOfferQuantity(defaultQuantity.toString());
      setTerms('Standard trade terms apply. Payment upon delivery confirmation.');
      setMessage('');
      setValidationErrors([]);
    }
  }, [seller, requiredQuantity]);

  const validateOffer = (): boolean => {
    const errors: string[] = [];
    const price = parseFloat(offerPrice);
    const quantity = parseFloat(offerQuantity);
    if (!price || price <= 0) errors.push('Please enter a valid price');
    if (!quantity || quantity <= 0) errors.push('Please enter a valid quantity');
    if (price > buyerMaxPrice) errors.push(`Price exceeds buyer's maximum (€${buyerMaxPrice})`);
    if (seller && quantity > (seller.availableQuantity || 0)) {
      errors.push(
        `Quantity exceeds available (${seller.availableQuantity} ${(seller.saleListing as any)?.unit || 'units'})`
      );
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const calculateProfitMargin = () => {
    const price = parseFloat(offerPrice) || 0;
    if (!price || !buyerMaxPrice) return 0;
    return ((buyerMaxPrice - price) / buyerMaxPrice) * 100;
  };

  const handleSubmit = async () => {
    if (!validateOffer() || (!seller && !sellerId)) return;
    setIsSubmitting(true);
    try {
      let tradeSeller = tradeOperation?.sellers?.find((ts) => ts.sellerId === seller?.sellerId);
      if (!tradeSeller) {
        try {
          const response = await apiClient.post(`/trade-operations/${tradeOperationId}/sellers`, {
            sellers: [
              {
                sellerId: seller?.sellerId,
                saleListingId: seller?.saleListingId,
                requestedQuantity: parseFloat(offerQuantity),
                unit: (seller?.saleListing as any)?.unit || 'kg',
                status: 'PENDING' as const,
              },
            ],
          });
          const result = response.data;
          if (result.sellersAdded && result.sellersAdded.length > 0) {
            tradeSeller = result.sellersAdded[0];
          } else {
            tradeSeller = {
              id: seller?.sellerId || '',
              sellerId: seller?.sellerId || '',
            } as TradeSeller;
          }
        } catch (_error) {
          Alert.alert('Error', 'Failed to add seller to trade operation. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }
      await negotiationService.sendOffer(tradeOperationId, {
        tradeSellerId: sellerId || tradeSeller?.id || seller?.sellerId || '',
        price: parseFloat(offerPrice),
        quantity: parseFloat(offerQuantity),
        terms: terms || undefined,
      });
      Alert.alert(
        'Offer Sent',
        `Your offer of €${offerPrice} for ${offerQuantity} units has been sent to ${seller?.sellerName || 'seller'}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onOfferSent) onOfferSent();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to send offer. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!seller && !sellerId) return null;

  const profitMarginNum = calculateProfitMargin();
  const isProfitable = profitMarginNum >= 5;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <GlassCard tier="strong" style={styles.card} animate={false} noPadding>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Create Offer</Text>
                <Text style={styles.headerSub}>{seller?.sellerName || `Seller ${sellerId}`}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Seller info */}
              {seller && (
                <GlassCard tier="subtle" animate={false} style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Seller Information</Text>
                  <Text style={styles.infoText}>
                    Location: {seller.location?.displayName || 'Unknown'}
                  </Text>
                  <Text style={styles.infoText}>
                    Available: {seller.availableQuantity}{' '}
                    {(seller.saleListing as any)?.unit || 'units'}
                  </Text>
                  <Text style={styles.infoText}>
                    Asking Price: <Text style={styles.goldPrice}>€{seller.askingPrice}/unit</Text>
                  </Text>
                </GlassCard>
              )}

              {/* Validation errors */}
              {validationErrors.length > 0 && (
                <GlassCard
                  tier="subtle"
                  animate={false}
                  style={{
                    backgroundColor: 'rgba(248,113,113,0.1)',
                    borderColor: 'rgba(248,113,113,0.2)',
                    marginBottom: 12,
                  }}
                >
                  {validationErrors.map((error, index) => (
                    <View key={index} style={styles.errorRow}>
                      <AlertCircle size={13} color={COLORS.danger} />
                      <Text style={styles.errorText}>{}</Text>
                    </View>
                  ))}
                </GlassCard>
              )}

              {/* Price */}
              <GlassInput
                label="Offer Price (per unit)"
                value={offerPrice}
                onChangeText={setOfferPrice}
                placeholder={seller?.askingPrice?.toString() || '0'}
                keyboardType="numeric"
                leftIcon={<DollarSign size={16} color={COLORS.textMuted} />}
              />
              <Text style={styles.hintText}>Max buyer price: €{buyerMaxPrice}</Text>

              {/* Quantity */}
              <GlassInput
                label="Quantity"
                value={offerQuantity}
                onChangeText={setOfferQuantity}
                placeholder={seller?.availableQuantity?.toString() || '0'}
                keyboardType="numeric"
                leftIcon={<Package size={16} color={COLORS.textMuted} />}
              />
              <Text style={styles.hintText}>
                Available: {seller?.availableQuantity} | Required: {requiredQuantity}
              </Text>

              {/* Profit indicator */}
              <GlassCard
                tier="subtle"
                animate={false}
                style={[
                  styles.profitCard,
                  { borderColor: isProfitable ? 'rgba(74,222,128,0.25)' : 'rgba(249,115,22,0.25)' },
                ]}
              >
                <Text
                  style={[
                    styles.profitLabel,
                    { color: isProfitable ? COLORS.accentGreen : '#f97316' },
                  ]}
                >
                  Estimated Profit Margin: {profitMarginNum.toFixed(1)}%
                </Text>
                <Text
                  style={[
                    styles.profitSub,
                    { color: isProfitable ? COLORS.accentGreen : '#f97316' },
                  ]}
                >
                  {isProfitable
                    ? 'This offer meets minimum profit requirements'
                    : 'Warning: Below 5% minimum margin'}
                </Text>
              </GlassCard>

              {/* Terms */}
              <GlassInput
                label="Terms & Conditions"
                value={terms}
                onChangeText={setTerms}
                placeholder="Enter trade terms..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Message */}
              <GlassInput
                label="Message (Optional)"
                value={message}
                onChangeText={setMessage}
                placeholder="Add a personal message to the seller..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                containerStyle={{ marginBottom: 8 }}
              />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerButtons}>
                <GlassButton
                  label="Cancel"
                  onPress={onClose}
                  variant="ghost"
                  size="md"
                  disabled={isSubmitting}
                  style={styles.footerBtn}
                />
                <GlassButton
                  label={isSubmitting ? '...' : 'Send Offer'}
                  onPress={handleSubmit}
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  leftIcon={<Send size={16} color="#fff" />}
                  style={styles.footerBtn}
                />
              </View>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, padding: 20 },
  card: { height: '100%', width: '100%' },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 6 },
  errorRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 6, marginBottom: 4 },
  errorText: { color: COLORS.danger, flex: 1, fontSize: 12 },
  footer: { borderTopColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1, padding: 20 },
  footerBtn: { flex: 1 },
  footerButtons: { flexDirection: 'row', gap: 12 },
  goldPrice: { color: COLORS.accentGold, fontFamily: 'monospace', fontWeight: '700' },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  headerText: { flex: 1 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  hintText: { color: COLORS.textMuted, fontSize: 11, marginBottom: 12, marginTop: -8 },
  infoCard: { marginBottom: 16 },
  infoText: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 3 },
  infoTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  kav: { height: '95%', paddingHorizontal: 16, width: '100%' },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    flex: 1,
    justifyContent: 'center',
  },
  profitCard: { marginBottom: 16, padding: 14 },
  profitLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  profitSub: { fontSize: 12 },
});
