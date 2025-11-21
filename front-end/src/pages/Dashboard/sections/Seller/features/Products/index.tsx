import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Building2, Package, Plus } from 'lucide-react-native';

import { LoadingSpinner } from '@shared/components/LoadingSpinner';
import { ErrorState } from '@shared/components/ErrorState';
import { ProductCreationFlow } from '@features/dashboard/screens/seller/product-creation/ProductCreationFlow';
import { ProductEditDrawer } from '@shared/components/ProductEditDrawer';
import { SellerOffersDrawer } from '@shared/components/SellerOffersDrawer';
import { SellerProductCard } from './components';
import { useSellerProducts } from './hooks';
import { sellerProductsService } from './service';
import { getOfferSummary, getProductImage } from './utils';
import type { BuyerOffer, ProductMetadata, SellerOfferMock, SellerProduct } from './types';

export default function SellerProductsFeature() {
  const navigation = useNavigation();
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
      <View className="flex-1 bg-black items-center justify-center">
        <LoadingSpinner message="Loading products..." />
      </View>
    );
  }

  if (productsError && sellerProducts.length === 0) {
    return (
      <View className="flex-1 bg-black p-6">
        <ErrorState message={productsError} onRetry={refreshProducts} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <FlatList
        data={sellerProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshProducts}
        refreshing={isLoadingProducts}
        ListHeaderComponent={() => (
          <View className="mb-6">
            <View className="mb-4">
              <Text className="text-2xl font-bold text-white">My Products</Text>
              <Text className="text-neutral-400 text-sm">
                Manage your agricultural products and listings
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={() => navigation.navigate('BaseManagement' as never)}
                className="bg-neutral-700 text-white py-2 px-4 rounded flex-row items-center gap-2"
              >
                <Building2 color="#ffffff" size={16} />
                <Text className="text-white">Manage Bases</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startAddProductFlow}
                className="bg-green-500 rounded-full p-3 shadow-lg"
              >
                <Plus color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-12">
            <Package color="#6b7280" size={64} />
            <Text className="text-neutral-400 text-lg mt-4">No products listed yet</Text>
            <TouchableOpacity
              onPress={startAddProductFlow}
              className="bg-green-500 text-white py-2 px-6 rounded-full mt-4"
            >
              <Text className="text-white">Add Your First Product</Text>
            </TouchableOpacity>
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
          offers={selectedProduct.offers as BuyerOffer[]}
          sellerProduct={selectedProduct.product}
          productName={selectedProduct.product.name}
          productId={selectedProduct.product.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
