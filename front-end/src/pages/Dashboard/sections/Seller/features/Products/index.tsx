import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { Package, Plus, Building2 } from 'lucide-react-native';

import { GlassButton, COLORS } from '@design-system';
import { LoadingSpinner } from '@shared/components/LoadingSpinner';
import { ErrorState } from '@shared/components/ErrorState';
import { ProductCreationFlow } from '@features/dashboard/screens/seller/product-creation/ProductCreationFlow';
import { ProductEditDrawer } from '@shared/components/ProductEditDrawer';
import { SellerOffersDrawer } from '@shared/components/SellerOffersDrawer';
import { SellerProductCard } from './components';
import { useSellerProducts } from './hooks';
import { sellerProductsService } from './service';
import { getOfferSummary, getProductImage } from './utils';
import type { ProductMetadata, SellerOfferMock, SellerProduct } from './types';

export default function SellerProductsFeature() {
  const { sellerProducts, isLoadingProducts, productsError, refreshProducts, productMetadata } =
    useSellerProducts();

  const [showProductCreationFlow, setShowProductCreationFlow] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [showOffersDrawer, setShowOffersDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    product: SellerProduct;
    offers: SellerOfferMock[];
  } | null>(null);

  const handleProductCreationSuccess = useCallback(() => {
    setShowProductCreationFlow(false);
  }, []);

  const handleProductCreationError = useCallback((error: string) => {
    console.error('Product creation error:', error);
  }, []);

  const startAddProductFlow = () => setShowProductCreationFlow(true);

  const handleEditProduct = (product: SellerProduct) => {
    setEditingProduct({
      ...product,
      image: getProductImage(product, productMetadata as ProductMetadata[]),
      specifications: product.specifications || {},
    });
    setShowEditDrawer(true);
  };

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return undefined;
  };

  const handleUpdateProduct = async (updatedProduct: SellerProduct) => {
    try {
      await sellerProductsService.updateProduct({
        id: updatedProduct.id,
        quantity: updatedProduct.quantity,
        unit: updatedProduct.unit,
        location: updatedProduct.location,
        specifications: updatedProduct.specifications,
      });
      await refreshProducts();
      Alert.alert('Success', 'Product updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      Alert.alert('Error', getErrorMessage(error) || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    try {
      await sellerProductsService.deleteProduct(editingProduct.id);
      await refreshProducts();
      Alert.alert('Success', 'Product deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', getErrorMessage(error) || 'Failed to delete product');
    }
  };

  const handleViewOffers = (product: SellerProduct, offers: SellerOfferMock[]) => {
    setSelectedProduct({ product, offers });
    setShowOffersDrawer(true);
  };

  const renderProductCard = ({ item }: { item: SellerProduct }) => {
    const offerSummary = getOfferSummary(item.id);
    return (
      <SellerProductCard
        product={item}
        metadata={productMetadata as ProductMetadata[]}
        offerSummary={offerSummary}
        onEdit={handleEditProduct}
        onViewOffers={handleViewOffers}
      />
    );
  };

  if (isLoadingProducts && sellerProducts.length === 0) {
    return (
      <View style={styles.centered}>
        <LoadingSpinner message="Loading products..." />
      </View>
    );
  }

  if (productsError && sellerProducts.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <ErrorState message={productsError} onRetry={refreshProducts} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={sellerProducts as any as SellerProduct[]}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshProducts}
        refreshing={isLoadingProducts}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>My Products</Text>
              <Text style={styles.subtitle}>Manage your agricultural products and listings</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Manage Bases',
                    'You can manage your bases from your Profile settings. Tap your avatar in the top bar to open your profile.'
                  )
                }
                style={styles.manageBasesBtn}
              >
                <Building2 color={COLORS.textSecondary} size={16} />
                <Text style={styles.manageBasesBtnText}>Manage Bases</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={startAddProductFlow} style={styles.addBtn}>
                <Plus color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Package color={COLORS.textMuted} size={64} />
            <Text style={styles.emptyText}>No products listed yet</Text>
            <GlassButton
              label="Add Your First Product"
              onPress={startAddProductFlow}
              variant="primary"
              style={styles.emptyBtn}
            />
          </View>
        )}
      />

      <ProductCreationFlow
        visible={showProductCreationFlow}
        onClose={() => setShowProductCreationFlow(false)}
        onSuccess={handleProductCreationSuccess}
        onError={handleProductCreationError}
      />

      {showEditDrawer && editingProduct && (
        <ProductEditDrawer
          visible={showEditDrawer}
          productData={editingProduct}
          onClose={() => {
            setShowEditDrawer(false);
            setEditingProduct(null);
          }}
          onSave={handleUpdateProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {showOffersDrawer && selectedProduct && (
        <SellerOffersDrawer
          visible={showOffersDrawer}
          onClose={() => {
            setShowOffersDrawer(false);
            setSelectedProduct(null);
          }}
          offers={selectedProduct.offers as any[]}
          sellerProduct={selectedProduct.product}
          productName={selectedProduct.product.name}
          productId={selectedProduct.product.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 99,
    elevation: 6,
    padding: 12,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
  },
  emptyBtn: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginBottom: 20,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  manageBasesBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageBasesBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
