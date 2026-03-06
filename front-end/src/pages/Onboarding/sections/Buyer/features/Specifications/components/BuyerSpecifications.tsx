import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Package } from 'lucide-react-native';
import type { ProductSpecification } from '@shared/types/onboarding';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { ProductSpecificationInput } from '@pages/Onboarding/components/shared/ProductSpecificationInput';
import { getApiUrl } from '@shared/utils/environment';

interface BuyerSpecificationsProps {
  selectedProducts: string[];
  specifications: ProductSpecification[];
  onSpecificationsChange: (specifications: ProductSpecification[]) => void;
}

export function BuyerSpecifications({
  selectedProducts,
  specifications,
  onSpecificationsChange,
}: BuyerSpecificationsProps) {
  const { selectedProductsMetadata, updateBuyerSpecification, buyerSpecifications } =
    useOnboardingStore();
  const { products, getProductSpecifications } = useProductStore();

  const [loading, setLoading] = useState(false);
  const [productSpecs, setProductSpecs] = useState<any[]>([]);
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');

  const selectedProductId = selectedProducts[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const productMetadata = selectedProductsMetadata.find((m) => m.id === selectedProductId);
  const currentSpecs = buyerSpecifications[selectedProductId] || {};

  useEffect(() => {
    if (selectedProductId) {
      setLoading(true);
      try {
        const specs = getProductSpecifications(selectedProductId);
        setProductSpecs(specs);

        const existingSpec =
          specifications.find((s) => s.productId === selectedProductId) || currentSpecs;
        if (existingSpec) {
          const values: Record<string, string> = {};
          specs.forEach((spec: any) => {
            const key = spec.code || spec.id;
            if (existingSpec[key]) {
              values[key] = existingSpec[key].toString();
            }
          });
          setSpecValues(values);
          setAdditionalNotes(existingSpec.notes || '');
        }
      } catch (error) {
        console.error('Error loading specifications:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedProductId]);

  const handleSpecChange = (specKey: string, value: string) => {
    setSpecValues((prev) => ({ ...prev, [specKey]: value }));
    updateSpec(specKey, value);
  };

  const handleNotesChange = (text: string) => {
    setAdditionalNotes(text);
    updateSpec('notes', text);
  };

  const updateSpec = (key: string, value: string) => {
    const updatedSpec = {
      ...currentSpecs,
      productId: selectedProductId,
      ...specValues,
      [key]: value,
      notes: additionalNotes,
      quantity: currentSpecs.quantity || '',
      unit: currentSpecs.unit || 'tons',
      pricePerKilo: currentSpecs.pricePerKilo || '',
    };
    onSpecificationsChange([updatedSpec]);
    updateBuyerSpecification(selectedProductId, updatedSpec);
  };

  const productImage = selectedProduct?.image || productMetadata?.image;
  const imageUrl = productImage
    ? productImage.startsWith('http')
      ? productImage
      : `${getApiUrl().replace('/api', '')}/static/${productImage}`
    : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.loadingText}>Loading product specifications...</Text>
      </View>
    );
  }

  if (!selectedProduct) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Package size={32} color="rgba(255,255,255,0.3)" />
        </View>
        <Text style={styles.emptyTitle}>No Product Selected</Text>
        <Text style={styles.emptySubtitle}>Please go back and select a product first</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Product Specifications</Text>
        <Text style={styles.subtitle}>
          Specify your requirements for {selectedProduct.displayName || selectedProduct.name}
        </Text>
      </View>

      {/* Selected Product */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={20} color="#4ADE80" />
          <Text style={styles.sectionTitle}>Selected Product</Text>
        </View>
        <View style={styles.productRow}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImageFallback}>
              <Package size={28} color="rgba(255,255,255,0.25)" />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>
              {selectedProduct.displayName || selectedProduct.name}
            </Text>
            <Text style={styles.productCategory}>{selectedProduct.category}</Text>
          </View>
        </View>
      </View>

      {/* Product Requirements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={20} color="#4ADE80" />
          <Text style={styles.sectionTitle}>Product Requirements</Text>
        </View>

        {productSpecs && productSpecs.length > 0 ? (
          <>
            <Text style={styles.specHint}>Specify your requirements for each field</Text>
            {productSpecs.map((spec: any) => {
              const specKey = spec.code || spec.id || '';
              return (
                <ProductSpecificationInput
                  key={specKey}
                  spec={spec}
                  value={specValues[specKey] || ''}
                  onChange={(value) => handleSpecChange(specKey, value)}
                />
              );
            })}
          </>
        ) : (
          <Text style={styles.noSpecsText}>No specifications available for this product</Text>
        )}
      </View>

      {/* Additional Requirements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Package size={20} color="#4ADE80" />
          <Text style={styles.sectionTitle}>Additional Requirements</Text>
        </View>
        <Text style={styles.fieldLabel}>Notes or Special Requirements</Text>
        <TextInput
          value={additionalNotes}
          onChangeText={handleNotesChange}
          placeholder="Enter any additional requirements, quality standards, certification needs, etc."
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          numberOfLines={4}
          style={styles.notesInput}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );
}

const GLASS_BG = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.1)';
const GREEN = '#4ADE80';

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 40,
    height: 72,
    justifyContent: 'center',
    marginBottom: 16,
    width: 72,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  header: {
    marginBottom: 20,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 12,
  },
  noSpecsText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 110,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productCategory: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  productImage: {
    borderRadius: 12,
    height: 72,
    marginRight: 14,
    width: 72,
  },
  productImageFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    height: 72,
    justifyContent: 'center',
    marginRight: 14,
    width: 72,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  productRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  section: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
  },
  specHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginBottom: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: GREEN,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
