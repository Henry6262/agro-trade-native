import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Building2,
  ShoppingCart,
  ClipboardList,
  Truck,
  MapPin,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react-native';

import { useOnboardingStore } from '../../stores/onboarding.store';
import { productService } from '../../services/productService';
import { Product } from '../../shared/types';
import {
  GradientBackground,
  GlassCard,
  GlassButton,
  GlassInput,
  COLORS,
} from '../../design-system';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';

const STEPS = [
  { id: 0, title: 'Company', icon: Building2 },
  { id: 1, title: 'Products', icon: ShoppingCart },
  { id: 2, title: 'Requirements', icon: ClipboardList },
  { id: 3, title: 'Delivery', icon: Truck },
  { id: 4, title: 'Location', icon: MapPin },
  { id: 5, title: 'Review', icon: CheckCircle2 },
];

export default function BuyerOnboardingFlowScreen() {
  const navigation = useNavigation();
  const store = useOnboardingStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const {
    currentStep,
    totalSteps,
    buyerData,
    selectedRole,
    isSubmitting,
    error,
    nextStep,
    previousStep,
    setStep,
    addBuyerRequirement,
    removeBuyerRequirement,
    updateBuyerRequirement,
    setLocation,
    submitOnboarding,
  } = store;

  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [deliveryPreference, setDeliveryPreference] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationCountry, setLocationCountry] = useState('');

  useEffect(() => {
    if (selectedRole !== 'buyer') {
      setStep(0);
    }
  }, [selectedRole, setStep]);

  useEffect(() => {
    if (currentStep === 1) {
      loadProducts();
    }
  }, [currentStep]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await productService.getProducts();
      setProducts(res.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load products. Please check your connection and try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!companyName.trim() || !companyEmail.trim()) {
        Alert.alert('Required', 'Please fill in company name and email');
        return;
      }
    }
    if (currentStep === 1) {
      if (!buyerData?.requiredProducts?.length) {
        Alert.alert('Required', 'Please select at least one product');
        return;
      }
    }
    nextStep();
  };

  const handleSubmit = async () => {
    try {
      await submitOnboarding(
        {
          companyName,
          email: companyEmail,
          phoneNumber: companyPhone,
        } as any,
        { name: companyName, email: companyEmail, phone: companyPhone }
      );
      navigation.navigate('OnboardingComplete' as never);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to complete onboarding');
    }
  };

  const toggleProduct = (product: Product) => {
    const existing = buyerData?.requiredProducts?.find((p) => p.productId === product.id);
    if (existing) {
      removeBuyerRequirement(product.id);
    } else {
      addBuyerRequirement({
        productId: product.id,
        productName: product.name,
        category: product.category?.name || 'General',
        quantity: {
          amount: 0,
          unit: (product.unit || 'tons') as 'kg' | 'tons' | 'bags' | 'boxes' | 'liters',
        },
        maxPrice: product.price,
      });
    }
  };

  const updateQuantity = (productId: string, amount: string) => {
    updateBuyerRequirement(productId, {
      quantity: { amount: Number(amount) || 0, unit: 'tons' },
    });
  };

  const updateMaxPrice = (productId: string, price: string) => {
    updateBuyerRequirement(productId, {
      maxPrice: Number(price) || 0,
    });
  };

  const isSelected = (productId: string) =>
    buyerData?.requiredProducts?.some((p) => p.productId === productId) ?? false;

  const renderProgress = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.progressScroll}>
      <View style={styles.progressRow}>
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          const Icon = step.icon;
          return (
            <View key={step.id} style={styles.progressItem}>
              <View
                style={[
                  styles.progressCircle,
                  isActive && styles.progressCircleActive,
                  isDone && styles.progressCircleDone,
                ]}
              >
                <Icon
                  size={14}
                  color={isActive ? '#0a0f0a' : isDone ? COLORS.accentGreen : COLORS.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  isActive && styles.progressLabelActive,
                  isDone && styles.progressLabelDone,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderCompanyStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tell us about your company</Text>
      <GlassInput
        label="Company Name"
        placeholder="Fresh Market Co"
        value={companyName}
        onChangeText={setCompanyName}
      />
      <GlassInput
        label="Email"
        placeholder="buyer@company.com"
        value={companyEmail}
        onChangeText={setCompanyEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <GlassInput
        label="Phone"
        placeholder="+1 234 567 890"
        value={companyPhone}
        onChangeText={setCompanyPhone}
        keyboardType="phone-pad"
      />
    </View>
  );

  const renderProductsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What products do you need?</Text>
      {loadingProducts ? (
        <LoadingSpinner message="Loading products..." />
      ) : (
        <View style={styles.productGrid}>
          {products.map((product) => {
            const selected = isSelected(product.id);
            return (
              <TouchableOpacity
                key={product.id}
                onPress={() => toggleProduct(product)}
                activeOpacity={0.8}
              >
                <GlassCard
                  tier={selected ? 'strong' : 'medium'}
                  style={[styles.productCard, selected && styles.productCardSelected]}
                  animate={false}
                >
                  <View style={styles.productCardHeader}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    {selected && <CheckCircle2 size={16} color={COLORS.accentGreen} />}
                  </View>
                  <Text style={styles.productCategory}>{product.category?.name || 'General'}</Text>
                  <Text style={styles.productPrice}>
                    ${product.price}/{product.unit}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {buyerData?.requiredProducts?.length ? (
        <Text style={styles.selectedCount}>{buyerData.requiredProducts.length} selected</Text>
      ) : null}
    </View>
  );

  const renderRequirementsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Set your requirements</Text>
      {buyerData?.requiredProducts?.map((product) => (
        <GlassCard key={product.productId} tier="medium" style={styles.specCard} animate={false}>
          <Text style={styles.specProductName}>{product.productName}</Text>
          <GlassInput
            label="Quantity Needed (tons)"
            placeholder="0"
            value={String(product.quantity?.amount || '')}
            onChangeText={(text) => updateQuantity(product.productId, text)}
            keyboardType="numeric"
          />
          <GlassInput
            label="Max Price per Unit ($)"
            placeholder="0"
            value={String(product.maxPrice || '')}
            onChangeText={(text) => updateMaxPrice(product.productId, text)}
            keyboardType="numeric"
          />
        </GlassCard>
      ))}
    </View>
  );

  const renderDeliveryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Delivery preferences</Text>
      <GlassInput
        label="Preferred Delivery Method"
        placeholder="e.g. FOB, CIF, Door-to-door"
        value={deliveryPreference}
        onChangeText={setDeliveryPreference}
      />
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Delivery location</Text>
      <GlassInput
        label="Address"
        placeholder="123 Warehouse Ave"
        value={locationAddress}
        onChangeText={setLocationAddress}
      />
      <GlassInput
        label="City"
        placeholder="Chicago"
        value={locationCity}
        onChangeText={setLocationCity}
      />
      <GlassInput
        label="Country"
        placeholder="USA"
        value={locationCountry}
        onChangeText={setLocationCountry}
      />
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review your profile</Text>
      <GlassCard tier="medium" style={styles.reviewCard} animate={false}>
        <Text style={styles.reviewSection}>Company</Text>
        <Text style={styles.reviewText}>{companyName}</Text>
        <Text style={styles.reviewText}>{companyEmail}</Text>
        <Text style={styles.reviewText}>{companyPhone}</Text>
      </GlassCard>
      <GlassCard tier="medium" style={styles.reviewCard} animate={false}>
        <Text style={styles.reviewSection}>Products Needed</Text>
        {buyerData?.requiredProducts?.map((p) => (
          <View key={p.productId} style={styles.reviewItem}>
            <Text style={styles.reviewText}>
              {p.productName} — {p.quantity?.amount || 0} {p.quantity?.unit} @ max ${p.maxPrice}
              /unit
            </Text>
          </View>
        ))}
      </GlassCard>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderCompanyStep();
      case 1:
        return renderProductsStep();
      case 2:
        return renderRequirementsStep();
      case 3:
        return renderDeliveryStep();
      case 4:
        return renderLocationStep();
      case 5:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (currentStep > 0 ? previousStep() : navigation.goBack())}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyer Onboarding</Text>
          <View style={styles.backBtn} />
        </View>

        {renderProgress()}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 0 && (
            <GlassButton
              label="Back"
              onPress={previousStep}
              variant="ghost"
              size="md"
              style={styles.backButton}
            />
          )}
          {currentStep < totalSteps - 1 ? (
            <GlassButton
              label="Continue"
              onPress={handleNext}
              variant="primary"
              size="md"
              style={styles.nextButton}
            />
          ) : (
            <GlassButton
              label={isSubmitting ? 'Submitting...' : 'Complete Setup'}
              onPress={handleSubmit}
              variant="primary"
              size="md"
              loading={isSubmitting}
              style={styles.nextButton}
            />
          )}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  backButton: { flex: 1 },
  container: { flex: 1, paddingTop: 60 },
  errorText: { color: '#F87171', fontSize: 14, marginTop: 12, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 32 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  nextButton: { flex: 2 },
  productCard: { minWidth: '47%', padding: 12 },
  productCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCardSelected: { borderColor: COLORS.accentGreen, borderWidth: 1 },
  productCategory: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productName: { color: '#fff', flex: 1, fontSize: 14, fontWeight: '700' },
  productPrice: { color: COLORS.accentGold, fontSize: 13, fontWeight: '700', marginTop: 6 },
  progressCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  progressCircleActive: { backgroundColor: COLORS.accentGreen },
  progressCircleDone: { backgroundColor: 'rgba(74,222,128,0.2)' },
  progressItem: { alignItems: 'center', gap: 6, minWidth: 56 },
  progressLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  progressLabelActive: { color: COLORS.accentGreen },
  progressLabelDone: { color: COLORS.accentGreen },
  progressRow: { flexDirection: 'row', gap: 16, paddingBottom: 16, paddingHorizontal: 16 },
  progressScroll: { maxHeight: 70 },
  reviewCard: { marginBottom: 12, padding: 16 },
  reviewItem: { marginBottom: 10 },
  reviewSection: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  reviewText: { color: '#fff', fontSize: 14, marginBottom: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  selectedCount: {
    color: COLORS.accentGreen,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  specCard: { marginBottom: 12, padding: 12 },
  specProductName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  stepContent: { flex: 1 },
  stepTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20 },
});
