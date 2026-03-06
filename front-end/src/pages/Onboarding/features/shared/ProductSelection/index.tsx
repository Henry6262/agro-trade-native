import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@stores/onboarding.store';
import { useProductStore } from '@stores/product.store';
import { productSelectionService } from './service';
import type {} from './types';

export const ProductSelectionUnified: React.FC = () => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const {
    selectedRole: role,
    setSelectedProducts: updateSelectedProducts,
    setSelectedProductsMetadata,
    nextStep,
    selectedProducts: storeSelectedProducts,
  } = useOnboardingStore();

  const { products, isLoadingProducts, fetchAllData } = useProductStore();

  useEffect(() => {
    if (storeSelectedProducts && storeSelectedProducts.length > 0) {
      setSelectedProductIds(storeSelectedProducts);
    }
    if (products.length === 0) {
      fetchAllData().catch((error) => {
        console.error('Error fetching products:', error);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      });
    }
  }, []);

  const toggleProduct = (productId: string) => {
    if (role === 'seller' || role === 'buyer') {
      setSelectedProductIds([productId]);
      updateSelectedProducts([productId]);
      const metadata = productSelectionService.buildMetadata(products, [productId]);
      setSelectedProductsMetadata(metadata);
      setTimeout(() => {
        nextStep();
      }, 100);
    } else {
      const newSelection = selectedProductIds.includes(productId)
        ? selectedProductIds.filter((id) => id !== productId)
        : [...selectedProductIds, productId];
      setSelectedProductIds(newSelection);
      updateSelectedProducts(newSelection);
      setSelectedProductsMetadata(productSelectionService.buildMetadata(products, newSelection));
    }
  };

  if (isLoadingProducts) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {role === 'buyer' ? 'What do you need?' : 'What do you offer?'}
        </Text>
        <Text style={styles.subtitle}>
          {role === 'buyer'
            ? 'Select one agricultural product you want to purchase'
            : 'Select one agricultural product you want to sell'}
        </Text>
      </View>

      {/* Product Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {products && products.length > 0 ? (
          <View>
            {Array.from({ length: Math.ceil(products.length / 2) }, (_, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {products.slice(rowIndex * 2, rowIndex * 2 + 2).map((product, colIndex) => {
                  const isSelected =
                    selectedProductIds.includes(product.id) ||
                    selectedProductIds.includes(product.category);

                  return (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => toggleProduct(product.id)}
                      activeOpacity={0.82}
                      style={[
                        styles.card,
                        colIndex === 0 ? styles.cardLeft : styles.cardRight,
                        isSelected && styles.cardSelected,
                      ]}
                    >
                      {/* Image fills most of the card */}
                      <View style={styles.imageContainer}>
                        {product.image ? (
                          <Image
                            source={{
                              uri:
                                productSelectionService.resolveImageUri(product.image || null) ??
                                undefined,
                            }}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder} />
                        )}

                        {/* Gradient overlay at bottom */}
                        <View style={styles.imageOverlay} />

                        {/* Selected checkmark */}
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={13} color="#052e16" />
                          </View>
                        )}
                      </View>

                      {/* Product name footer */}
                      <View style={styles.footer}>
                        <Text
                          style={[styles.productName, isSelected && styles.productNameSelected]}
                          numberOfLines={1}
                        >
                          {product.displayName || product.name}
                        </Text>
                        <Text style={styles.tapHint}>Tap to select</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* Filler for odd row */}
                {rowIndex === Math.ceil(products.length / 2) - 1 && products.length % 2 === 1 && (
                  <View style={[styles.card, styles.cardRight, styles.cardFiller]} />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  cardFiller: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  cardLeft: {
    marginRight: 6,
  },
  cardRight: {
    marginLeft: 6,
  },
  cardSelected: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderColor: 'rgba(74,222,128,0.55)',
    elevation: 8,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    borderRadius: 10,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
  footer: {
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  header: {
    marginBottom: 20,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    height: 130,
    position: 'relative',
    width: '100%',
  },
  imageOverlay: {
    backgroundColor: 'rgba(3,15,9,0.35)',
    bottom: 0,
    height: 40,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  imagePlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 12,
  },
  productName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  productNameSelected: {
    color: '#4ADE80',
  },
  root: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  title: {
    color: '#4ADE80',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
