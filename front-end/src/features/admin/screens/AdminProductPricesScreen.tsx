import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@services/api';
import { Picker } from '@react-native-picker/picker';
import { GradientBackground } from '../../../design-system/GradientBackground';
import { GlassCard } from '../../../design-system/GlassCard';
import { GlassButton } from '../../../design-system/GlassButton';
import { GlassInput } from '../../../design-system/GlassInput';
import { COLORS } from '../../../design-system/tokens';

type AdminNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PricingZone {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  displayName: string;
  category: string;
}

interface ProductPrice {
  id: string;
  productId: string;
  pricingZoneId: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  unit: string;
  qualityGrade?: string;
  effectiveDate: string;
  expiresDate?: string;
  product: {
    id: string;
    displayName: string;
    category: string;
  };
  pricingZone: {
    id: string;
    name: string;
    color?: string;
  };
}

interface NewPriceForm {
  productId: string;
  pricingZoneId: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  unit: string;
  qualityGrade: string;
  effectiveDate: string;
  expiresDate: string;
}

export function AdminProductPricesScreen() {
  const navigation = useNavigation<AdminNavigationProp>();
  const [pricingZones, setPricingZones] = useState<PricingZone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newPrice, setNewPrice] = useState<NewPriceForm>({
    productId: '',
    pricingZoneId: '',
    minPrice: '',
    maxPrice: '',
    currency: 'BGN',
    unit: 'TON',
    qualityGrade: 'Standard',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiresDate: '',
  });

  const currencies = ['BGN', 'EUR', 'USD'];
  const units = ['TON', 'KG'];
  const qualityGrades = ['Standard', 'Premium', 'Grade A', 'Grade B', 'Feed Grade'];
  const categories = [
    'WHEAT',
    'CORN',
    'SUNFLOWER',
    'BARLEY',
    'OATS',
    'RAPESEED',
    'PEAS',
    'SOYBEAN_MEAL',
    'WHEAT_BRAN',
    'ALFALFA',
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedZone === 'all') {
      fetchAllProductPrices();
    } else {
      fetchProductPricesForZone(selectedZone);
    }
  }, [selectedZone]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [zonesResponse, productsResponse] = await Promise.all([
        apiClient.get('/admin/pricing-zones'),
        apiClient.get('/products'),
      ]);
      setPricingZones(zonesResponse.data.data.filter((zone: PricingZone) => zone.isActive));
      setProducts(productsResponse.data.data);
      await fetchAllProductPrices();
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProductPrices = async () => {
    try {
      const promises = pricingZones.map((zone) =>
        apiClient.get(`/admin/pricing-zones/${zone.id}/product-prices`)
      );
      const responses = await Promise.all(promises);
      const allPrices = responses.flatMap((response) => response.data.data);
      setProductPrices(allPrices);
    } catch (error) {
      console.error('Failed to fetch product prices:', error);
    }
  };

  const fetchProductPricesForZone = async (zoneId: string) => {
    try {
      const response = await apiClient.get(`/admin/pricing-zones/${zoneId}/product-prices`);
      setProductPrices(response.data.data);
    } catch (error) {
      console.error('Failed to fetch product prices for zone:', error);
    }
  };

  const createProductPrice = async () => {
    if (
      !newPrice.productId ||
      !newPrice.pricingZoneId ||
      !newPrice.minPrice ||
      !newPrice.maxPrice
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    const minPrice = parseFloat(newPrice.minPrice);
    const maxPrice = parseFloat(newPrice.maxPrice);
    if (isNaN(minPrice) || isNaN(maxPrice)) {
      Alert.alert('Error', 'Please enter valid prices');
      return;
    }
    if (minPrice >= maxPrice) {
      Alert.alert('Error', 'Minimum price must be less than maximum price');
      return;
    }
    try {
      setIsCreating(true);
      const priceData = {
        productId: newPrice.productId,
        pricingZoneId: newPrice.pricingZoneId,
        minPrice,
        maxPrice,
        currency: newPrice.currency,
        unit: newPrice.unit,
        qualityGrade: newPrice.qualityGrade,
        effectiveDate: new Date(newPrice.effectiveDate),
        expiresDate: newPrice.expiresDate ? new Date(newPrice.expiresDate) : undefined,
      };
      const response = await apiClient.post('/admin/product-prices', priceData);
      setProductPrices([...productPrices, response.data.data]);
      setNewPrice({
        productId: '',
        pricingZoneId: '',
        minPrice: '',
        maxPrice: '',
        currency: 'BGN',
        unit: 'TON',
        qualityGrade: 'Standard',
        effectiveDate: new Date().toISOString().split('T')[0],
        expiresDate: '',
      });
      setShowCreateModal(false);
      Alert.alert('Success', 'Product price created successfully');
    } catch (error: any) {
      console.error('Failed to create product price:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create product price');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProductPrice = async (priceId: string) => {
    Alert.alert('Delete Price', 'Are you sure you want to delete this product price?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/admin/product-prices/${priceId}`);
            setProductPrices(productPrices.filter((price) => price.id !== priceId));
            Alert.alert('Success', 'Product price deleted successfully');
          } catch (error: any) {
            console.error('Failed to delete product price:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete product price');
          }
        },
      },
    ]);
  };

  const filteredPrices = productPrices.filter((price) => {
    const matchesSearch =
      price.product.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.pricingZone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || price.product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPrices = filteredPrices.reduce(
    (acc, price) => {
      const key = `${price.product.displayName}-${price.pricingZone.name}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(price);
      return acc;
    },
    {} as Record<string, ProductPrice[]>
  );

  if (isLoading) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#4ADE80" size="large" />
          <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>
            Loading product prices...
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.headerMid}>
            <Text style={styles.headerTitle}>Product Pricing</Text>
            <Text style={styles.headerSub}>Manage product prices by zone</Text>
          </View>

          <GlassButton
            label="Add"
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            size="sm"
            leftIcon={<Ionicons name="add" size={16} color="#FFFFFF" />}
          />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {/* Search */}
          <GlassInput
            placeholder="Search products or zones..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            leftIcon={<Ionicons name="search" size={18} color={COLORS.textMuted} />}
            rightIcon={
              searchTerm.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : undefined
            }
            containerStyle={{ marginBottom: 12 }}
          />

          {/* Zone + Category pickers */}
          <View style={styles.pickerRow}>
            <View style={styles.pickerWrap}>
              <Text style={styles.pickerLabel}>ZONE</Text>
              <GlassCard tier="subtle" animate={false} style={styles.pickerCard}>
                <Picker
                  selectedValue={selectedZone}
                  onValueChange={setSelectedZone}
                  style={{ color: COLORS.textPrimary }}
                  dropdownIconColor={COLORS.textMuted}
                  itemStyle={{ color: COLORS.textPrimary }}
                >
                  <Picker.Item label="All Zones" value="all" />
                  {pricingZones.map((zone) => (
                    <Picker.Item key={zone.id} label={zone.name} value={zone.id} />
                  ))}
                </Picker>
              </GlassCard>
            </View>

            <View style={styles.pickerWrap}>
              <Text style={styles.pickerLabel}>CATEGORY</Text>
              <GlassCard tier="subtle" animate={false} style={styles.pickerCard}>
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={setSelectedCategory}
                  style={{ color: COLORS.textPrimary }}
                  dropdownIconColor={COLORS.textMuted}
                  itemStyle={{ color: COLORS.textPrimary }}
                >
                  <Picker.Item label="All Categories" value="all" />
                  {categories.map((category) => (
                    <Picker.Item key={category} label={category} value={category} />
                  ))}
                </Picker>
              </GlassCard>
            </View>
          </View>
        </View>

        {/* Prices List */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {Object.entries(groupedPrices).map(([key, prices]) => (
            <GlassCard key={key} tier="subtle" style={{ marginBottom: 12 }}>
              {/* Product Header */}
              <View style={styles.productHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{prices[0].product.displayName}</Text>
                  <View style={styles.productMeta}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{prices[0].product.category}</Text>
                    </View>
                    <View
                      style={[
                        styles.zoneDot,
                        { backgroundColor: prices[0].pricingZone.color || '#60A5FA' },
                      ]}
                    />
                    <Text style={styles.zoneName}>{prices[0].pricingZone.name}</Text>
                  </View>
                </View>
              </View>

              {/* Price Variations */}
              {prices.map((price) => (
                <GlassCard key={price.id} tier="medium" animate={false} style={{ marginBottom: 8 }}>
                  <View style={styles.priceRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.priceValueRow}>
                        <Text style={styles.priceValue}>
                          {price.currency}{' '}
                          <Text style={styles.priceNumbers}>
                            {price.minPrice} – {price.maxPrice}
                          </Text>
                        </Text>
                        <Text style={styles.perUnit}> / {price.unit}</Text>
                        <View style={styles.gradeBadge}>
                          <Text style={styles.gradeText}>{price.qualityGrade || 'Standard'}</Text>
                        </View>
                      </View>
                      <Text style={styles.dateText}>
                        Effective: {new Date(price.effectiveDate).toLocaleDateString()}
                        {price.expiresDate &&
                          `  ·  Expires: ${new Date(price.expiresDate).toLocaleDateString()}`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => deleteProductPrice(price.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}
            </GlassCard>
          ))}

          {Object.keys(groupedPrices).length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>
                {searchTerm ? 'No prices found' : 'No product prices yet'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchTerm
                  ? 'Try adjusting your search terms or filters'
                  : 'Create your first product price to get started'}
              </Text>
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>

      {/* Create Price Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product Price</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 20 }}>
              {/* Product */}
              <Text style={styles.modalLabel}>PRODUCT *</Text>
              <GlassCard tier="subtle" animate={false} style={{ marginBottom: 16 }}>
                <Picker
                  selectedValue={newPrice.productId}
                  onValueChange={(value) => setNewPrice({ ...newPrice, productId: value })}
                  style={{ color: COLORS.textPrimary }}
                  dropdownIconColor={COLORS.textMuted}
                >
                  <Picker.Item label="Select Product" value="" />
                  {products.map((product) => (
                    <Picker.Item key={product.id} label={product.displayName} value={product.id} />
                  ))}
                </Picker>
              </GlassCard>

              {/* Zone */}
              <Text style={styles.modalLabel}>PRICING ZONE *</Text>
              <GlassCard tier="subtle" animate={false} style={{ marginBottom: 16 }}>
                <Picker
                  selectedValue={newPrice.pricingZoneId}
                  onValueChange={(value) => setNewPrice({ ...newPrice, pricingZoneId: value })}
                  style={{ color: COLORS.textPrimary }}
                  dropdownIconColor={COLORS.textMuted}
                >
                  <Picker.Item label="Select Zone" value="" />
                  {pricingZones.map((zone) => (
                    <Picker.Item key={zone.id} label={zone.name} value={zone.id} />
                  ))}
                </Picker>
              </GlassCard>

              {/* Price Range */}
              <View style={styles.priceInputRow}>
                <GlassInput
                  label="Min Price *"
                  placeholder="0.00"
                  value={newPrice.minPrice}
                  onChangeText={(text) => setNewPrice({ ...newPrice, minPrice: text })}
                  keyboardType="decimal-pad"
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <GlassInput
                  label="Max Price *"
                  placeholder="0.00"
                  value={newPrice.maxPrice}
                  onChangeText={(text) => setNewPrice({ ...newPrice, maxPrice: text })}
                  keyboardType="decimal-pad"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              {/* Currency & Unit */}
              <View style={styles.priceInputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.modalLabel}>CURRENCY</Text>
                  <GlassCard tier="subtle" animate={false} style={{ marginBottom: 0 }}>
                    <Picker
                      selectedValue={newPrice.currency}
                      onValueChange={(value) => setNewPrice({ ...newPrice, currency: value })}
                      style={{ color: COLORS.textPrimary }}
                      dropdownIconColor={COLORS.textMuted}
                    >
                      {currencies.map((c) => (
                        <Picker.Item key={c} label={c} value={c} />
                      ))}
                    </Picker>
                  </GlassCard>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>UNIT</Text>
                  <GlassCard tier="subtle" animate={false} style={{ marginBottom: 0 }}>
                    <Picker
                      selectedValue={newPrice.unit}
                      onValueChange={(value) => setNewPrice({ ...newPrice, unit: value })}
                      style={{ color: COLORS.textPrimary }}
                      dropdownIconColor={COLORS.textMuted}
                    >
                      {units.map((u) => (
                        <Picker.Item key={u} label={u} value={u} />
                      ))}
                    </Picker>
                  </GlassCard>
                </View>
              </View>

              {/* Quality Grade */}
              <Text style={[styles.modalLabel, { marginTop: 16 }]}>QUALITY GRADE</Text>
              <GlassCard tier="subtle" animate={false} style={{ marginBottom: 16 }}>
                <Picker
                  selectedValue={newPrice.qualityGrade}
                  onValueChange={(value) => setNewPrice({ ...newPrice, qualityGrade: value })}
                  style={{ color: COLORS.textPrimary }}
                  dropdownIconColor={COLORS.textMuted}
                >
                  {qualityGrades.map((grade) => (
                    <Picker.Item key={grade} label={grade} value={grade} />
                  ))}
                </Picker>
              </GlassCard>

              {/* Dates */}
              <View style={styles.priceInputRow}>
                <GlassInput
                  label="Effective Date"
                  placeholder="YYYY-MM-DD"
                  value={newPrice.effectiveDate}
                  onChangeText={(text) => setNewPrice({ ...newPrice, effectiveDate: text })}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <GlassInput
                  label="Expires (Optional)"
                  placeholder="YYYY-MM-DD"
                  value={newPrice.expiresDate}
                  onChangeText={(text) => setNewPrice({ ...newPrice, expiresDate: text })}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <GlassButton
                label="Cancel"
                onPress={() => setShowCreateModal(false)}
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
              />
              <GlassButton
                label={isCreating ? 'Creating...' : 'Create Price'}
                onPress={createProductPrice}
                variant="primary"
                disabled={isCreating}
                loading={isCreating}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 8,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  filters: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    padding: 16,
  },
  gradeBadge: {
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gradeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  headerMid: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalFooter: {
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'rgba(5,46,22,0.98)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  perUnit: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  pickerCard: {
    padding: 0,
  },
  pickerLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerWrap: {
    flex: 1,
  },
  priceInputRow: {
    flexDirection: 'row',
  },
  priceNumbers: {
    color: '#FCD34D',
    fontWeight: '700',
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  priceValue: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  priceValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  productHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productMeta: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  zoneDot: {
    borderRadius: 5,
    height: 10,
    marginRight: 6,
    width: 10,
  },
  zoneName: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
