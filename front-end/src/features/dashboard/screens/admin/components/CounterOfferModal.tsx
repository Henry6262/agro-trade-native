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
import {
  X,
  Send,
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { negotiationService } from '@services/negotiationService';
import { GlassCard, GlassButton, GlassInput } from '@design-system';
import { COLORS } from '@design-system';

const _DIVIDER = { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 };

interface CounterOfferModalProps {
  visible: boolean;
  onClose: () => void;
  negotiationId: string;
  currentOffer: { price: number; quantity: number; terms?: string };
  counterOffer?: { price: number; quantity: number; terms?: string; reason?: string } | undefined;
  sellerName?: string | undefined;
  buyerMaxPrice?: number | undefined;
  targetMargin?: number | undefined;
  onOfferSent?: (() => void) | undefined;
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
  visible,
  onClose,
  negotiationId,
  currentOffer,
  counterOffer,
  sellerName = 'Seller',
  buyerMaxPrice = 0,
  targetMargin = 7,
  onOfferSent,
}) => {
  const [responseType, setResponseType] = useState<'COUNTER' | 'ACCEPT' | 'REJECT'>('COUNTER');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (counterOffer && currentOffer) {
      const suggestedPrice = ((currentOffer.price + counterOffer.price) / 2).toFixed(2);
      setNewPrice(suggestedPrice);
      setNewQuantity(counterOffer.quantity.toString());
      const priceDiff = counterOffer.price - currentOffer.price;
      if (Math.abs(priceDiff) < currentOffer.price * 0.05) {
        setResponseMessage(
          "We're very close to an agreement. This offer represents a fair middle ground."
        );
      } else if (priceDiff > 0) {
        setResponseMessage(
          'While we understand your position, this price would impact our margins. We propose a compromise.'
        );
      } else {
        setResponseMessage(
          'We appreciate your flexibility. This adjusted offer ensures a mutually beneficial arrangement.'
        );
      }
    }
  }, [counterOffer, currentOffer]);

  const calculateProfitMargin = (price: number) => {
    if (!buyerMaxPrice || buyerMaxPrice === 0) return 0;
    return ((buyerMaxPrice - price) / buyerMaxPrice) * 100;
  };

  const calculateConvergence = () => {
    if (!counterOffer || !currentOffer) return null;
    const currentGap = Math.abs(counterOffer.price - currentOffer.price);
    const newGap = Math.abs(parseFloat(newPrice) - counterOffer.price);
    const convergenceRate = (((currentGap - newGap) / currentGap) * 100).toFixed(1);
    return {
      currentGap,
      newGap,
      convergenceRate: parseFloat(convergenceRate),
      isConverging: newGap < currentGap,
    };
  };

  const validateResponse = (): boolean => {
    const errors: string[] = [];
    if (responseType === 'COUNTER') {
      const price = parseFloat(newPrice);
      const quantity = parseFloat(newQuantity);
      if (!price || price <= 0) errors.push('Please enter a valid price');
      if (!quantity || quantity <= 0) errors.push('Please enter a valid quantity');
      if (price > buyerMaxPrice) errors.push(`Price exceeds buyer's maximum (€${buyerMaxPrice})`);
      const margin = calculateProfitMargin(price);
      if (margin < 5)
        errors.push(`Price results in ${margin.toFixed(1)}% margin (minimum 5% required)`);
      if (counterOffer && price >= counterOffer.price)
        errors.push("Counter-offer should be lower than seller's current offer");
    } else if (responseType === 'REJECT' && !rejectReason) {
      errors.push('Please provide a reason for rejection');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResponse()) return;
    setIsSubmitting(true);
    try {
      switch (responseType) {
        case 'ACCEPT':
          await negotiationService.acceptOffer(negotiationId, responseMessage || 'Offer accepted');
          Alert.alert(
            'Offer Accepted',
            `You have accepted the seller's offer of €${counterOffer?.price || currentOffer.price}.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  onOfferSent?.();
                  onClose();
                },
              },
            ]
          );
          break;
        case 'REJECT':
          await negotiationService.rejectOffer(
            negotiationId,
            rejectReason || 'Terms not acceptable'
          );
          Alert.alert('Offer Rejected', 'The negotiation has been closed.', [
            {
              text: 'OK',
              onPress: () => {
                onOfferSent?.();
                onClose();
              },
            },
          ]);
          break;
        case 'COUNTER': {
          await negotiationService.counterOffer(negotiationId, {
            counterPrice: parseFloat(newPrice),
            message: responseMessage,
          });
          const convergence = calculateConvergence();
          Alert.alert(
            'Counter-Offer Sent',
            `Your counter-offer of €${newPrice} has been sent to ${sellerName}.${convergence?.isConverging ? ` Price gap narrowed by ${convergence.convergenceRate}%.` : ''}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  onOfferSent?.();
                  onClose();
                },
              },
            ]
          );
          break;
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profitMargin = calculateProfitMargin(parseFloat(newPrice) || counterOffer?.price || 0);
  const isProfitable = profitMargin >= 5;
  const meetsTarget = profitMargin >= targetMargin;
  const convergence = calculateConvergence();

  const getSubmitVariant = (): 'primary' | 'danger' | 'secondary' => {
    if (isSubmitting) return 'secondary';
    if (responseType === 'ACCEPT') return 'primary';
    if (responseType === 'REJECT') return 'danger';
    return isProfitable ? 'secondary' : 'secondary';
  };

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
                <Text style={styles.headerTitle}>Respond to Counter-Offer</Text>
                <Text style={styles.headerSub}>{sellerName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Offer comparison */}
              <GlassCard tier="subtle" animate={false} style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>Negotiation Status</Text>
                <View style={styles.comparisonRow}>
                  <View>
                    <Text style={styles.comparisonLabel}>Your Offer</Text>
                    <Text style={styles.goldPrice}>
                      €{currentOffer.price} × {currentOffer.quantity}
                    </Text>
                  </View>
                  <MessageSquare size={20} color={COLORS.info} />
                  <View>
                    <Text style={styles.comparisonLabel}>Their Counter</Text>
                    <Text style={styles.goldPrice}>
                      €{counterOffer?.price || 0} × {counterOffer?.quantity || 0}
                    </Text>
                  </View>
                </View>
                {counterOffer?.reason && (
                  <Text style={styles.counterReason}>&quot;{counterOffer.reason}&quot;</Text>
                )}
              </GlassCard>

              {/* Response type selector */}
              <Text style={styles.sectionLabel}>How do you want to respond?</Text>
              <View style={styles.typeSelector}>
                {(['COUNTER', 'ACCEPT', 'REJECT'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setResponseType(type)}
                    style={[
                      styles.typeBtn,
                      responseType === type && styles.typeBtnActive,
                      type === 'ACCEPT' && responseType === 'ACCEPT' && styles.typeBtnGreen,
                      type === 'REJECT' && responseType === 'REJECT' && styles.typeBtnRed,
                    ]}
                  >
                    {type === 'COUNTER' && (
                      <MessageSquare
                        size={15}
                        color={responseType === 'COUNTER' ? COLORS.info : COLORS.textMuted}
                        style={styles.typeIcon}
                      />
                    )}
                    {type === 'ACCEPT' && (
                      <CheckCircle
                        size={15}
                        color={responseType === 'ACCEPT' ? COLORS.accentGreen : COLORS.textMuted}
                        style={styles.typeIcon}
                      />
                    )}
                    {type === 'REJECT' && (
                      <XCircle
                        size={15}
                        color={responseType === 'REJECT' ? COLORS.danger : COLORS.textMuted}
                        style={styles.typeIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.typeBtnText,
                        responseType === type && styles.typeBtnTextActive,
                        type === 'ACCEPT' &&
                          responseType === 'ACCEPT' && { color: COLORS.accentGreen },
                        type === 'REJECT' && responseType === 'REJECT' && { color: COLORS.danger },
                      ]}
                    >
                      {type === 'COUNTER' ? 'Counter' : type === 'ACCEPT' ? 'Accept' : 'Reject'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ))}
                </GlassCard>
              )}

              {/* Counter form */}
              {responseType === 'COUNTER' && (
                <>
                  <GlassInput
                    label="New Price (per unit)"
                    value={newPrice}
                    onChangeText={setNewPrice}
                    placeholder={counterOffer?.price.toString() || '0'}
                    keyboardType="numeric"
                    leftIcon={<DollarSign size={16} color={COLORS.textMuted} />}
                  />
                  <Text style={styles.hintText}>
                    Seller&apos;s offer: €{counterOffer?.price} | Your last: €{currentOffer.price}
                  </Text>

                  <GlassInput
                    label="Quantity"
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    placeholder={counterOffer?.quantity.toString() || '0'}
                    keyboardType="numeric"
                    leftIcon={<Package size={16} color={COLORS.textMuted} />}
                  />

                  {convergence && (
                    <GlassCard
                      tier="subtle"
                      animate={false}
                      style={[
                        styles.indicatorCard,
                        {
                          borderColor: convergence.isConverging
                            ? 'rgba(74,222,128,0.2)'
                            : 'rgba(249,115,22,0.2)',
                        },
                      ]}
                    >
                      <View style={styles.indicatorRow}>
                        {convergence.isConverging ? (
                          <TrendingDown size={15} color={COLORS.accentGreen} />
                        ) : (
                          <TrendingUp size={15} color="#f97316" />
                        )}
                        <Text
                          style={[
                            styles.indicatorLabel,
                            { color: convergence.isConverging ? COLORS.accentGreen : '#f97316' },
                          ]}
                        >
                          {convergence.isConverging ? 'Converging' : 'Diverging'} Negotiation
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.indicatorSub,
                          { color: convergence.isConverging ? COLORS.accentGreen : '#f97316' },
                        ]}
                      >
                        Price gap: €{convergence.currentGap.toFixed(2)} → €
                        {convergence.newGap.toFixed(2)}
                        {convergence.isConverging && ` (-${convergence.convergenceRate}%)`}
                      </Text>
                    </GlassCard>
                  )}

                  <GlassCard
                    tier="subtle"
                    animate={false}
                    style={[
                      styles.indicatorCard,
                      {
                        borderColor: meetsTarget
                          ? 'rgba(74,222,128,0.2)'
                          : isProfitable
                            ? 'rgba(252,211,77,0.2)'
                            : 'rgba(248,113,113,0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.indicatorLabel,
                        {
                          color: meetsTarget
                            ? COLORS.accentGreen
                            : isProfitable
                              ? COLORS.accentGold
                              : COLORS.danger,
                        },
                      ]}
                    >
                      Profit Margin: {profitMargin.toFixed(1)}%
                    </Text>
                    <Text
                      style={[
                        styles.indicatorSub,
                        {
                          color: meetsTarget
                            ? COLORS.accentGreen
                            : isProfitable
                              ? COLORS.accentGold
                              : COLORS.danger,
                        },
                      ]}
                    >
                      {meetsTarget
                        ? `Meets target margin (${targetMargin}%)`
                        : isProfitable
                          ? `Below target (${targetMargin}%) but profitable`
                          : 'Below minimum margin (5%)'}
                    </Text>
                  </GlassCard>
                </>
              )}

              {/* Accept form */}
              {responseType === 'ACCEPT' && (
                <GlassCard
                  tier="subtle"
                  animate={false}
                  style={[styles.indicatorCard, { borderColor: 'rgba(74,222,128,0.25)' }]}
                >
                  <View style={styles.indicatorRow}>
                    <CheckCircle size={18} color={COLORS.accentGreen} />
                    <Text style={[styles.indicatorLabel, { color: COLORS.accentGreen }]}>
                      Accepting Counter-Offer
                    </Text>
                  </View>
                  <Text style={[styles.indicatorSub, { color: COLORS.accentGreen }]}>
                    You will accept: €{counterOffer?.price} × {counterOffer?.quantity} units
                  </Text>
                  <Text style={styles.hintText}>
                    Total value: €
                    {((counterOffer?.price || 0) * (counterOffer?.quantity || 0)).toFixed(2)}
                  </Text>
                </GlassCard>
              )}

              {/* Reject form */}
              {responseType === 'REJECT' && (
                <GlassInput
                  label="Reason for Rejection"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Explain why you're rejecting this offer..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}

              {/* Message */}
              <GlassInput
                label={
                  responseType === 'REJECT' ? 'Additional Note (Optional)' : 'Message (Optional)'
                }
                value={responseMessage}
                onChangeText={setResponseMessage}
                placeholder={
                  responseType === 'ACCEPT'
                    ? 'Thank you for your flexibility...'
                    : responseType === 'REJECT'
                      ? 'We appreciate your offer but...'
                      : "Let's find a middle ground..."
                }
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Tips */}
              <GlassCard tier="subtle" animate={false} style={{ marginBottom: 16 }}>
                <View style={styles.tipsRow}>
                  <Info size={13} color={COLORS.textMuted} />
                  <Text style={styles.tipsLabel}>Negotiation Tips</Text>
                </View>
                <Text style={styles.tipsText}>
                  {responseType === 'COUNTER'
                    ? '• Move closer to their price to show willingness\n• Consider quantity adjustments for better pricing\n• Keep communication professional and positive'
                    : responseType === 'ACCEPT'
                      ? '• Accepting builds trust for future deals\n• Consider the long-term relationship value\n• Quick acceptance can expedite delivery'
                      : '• Provide clear reasoning for rejection\n• Leave door open for future negotiations\n• Consider alternative suppliers before rejecting'}
                </Text>
              </GlassCard>
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
                  label={
                    isSubmitting
                      ? '...'
                      : responseType === 'ACCEPT'
                        ? 'Accept'
                        : responseType === 'REJECT'
                          ? 'Reject'
                          : 'Send Counter'
                  }
                  onPress={handleSubmit}
                  variant={getSubmitVariant()}
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
  comparisonCard: { marginBottom: 16 },
  comparisonLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  comparisonRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  comparisonTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  counterReason: { color: COLORS.info, fontSize: 11, fontStyle: 'italic', marginTop: 6 },
  errorRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 6, marginBottom: 4 },
  errorText: { color: COLORS.danger, flex: 1, fontSize: 12 },
  footer: { borderTopColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1, padding: 20 },
  footerBtn: { flex: 1 },
  footerButtons: { flexDirection: 'row', gap: 12 },
  goldPrice: { color: COLORS.accentGold, fontFamily: 'monospace', fontSize: 14, fontWeight: '700' },
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
  indicatorCard: { marginBottom: 12, padding: 12 },
  indicatorLabel: { fontSize: 13, fontWeight: '700' },
  indicatorRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  indicatorSub: { fontSize: 12 },
  kav: { height: '95%', paddingHorizontal: 16, width: '100%' },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    flex: 1,
    justifyContent: 'center',
  },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  tipsLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  tipsRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 6 },
  tipsText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },
  typeBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  typeBtnActive: { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.4)' },
  typeBtnGreen: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'rgba(74,222,128,0.4)' },
  typeBtnRed: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.4)' },
  typeBtnText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  typeBtnTextActive: { color: COLORS.info },
  typeIcon: { marginBottom: 4 },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
});
