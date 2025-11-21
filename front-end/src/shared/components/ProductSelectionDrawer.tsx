import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useProductStore } from '@stores/product.store';

interface ProductSelectionDrawerProps {
  visible: boolean;
  onClose: () => void;
  onProductSelect: (productId: string, productData: any) => void;
  mode?: 'single' | 'multiple';
  selectedProducts?: string[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ProductSelectionDrawer: React.FC<ProductSelectionDrawerProps> = ({
  visible,
  onClose,
  onProductSelect,
  mode = 'single',
  selectedProducts = [],
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(selectedProducts);

  // Ensure products is always an array, handle both direct array and response object
  const productsRaw = useProductStore((state) => state.products);
  const products = Array.isArray(productsRaw) ? productsRaw : productsRaw?.data || [];
  const isLoadingProducts = useProductStore((state) => state.isLoadingProducts) || false;
  const fetchAllData = useProductStore((state) => state.fetchAllData);

  useEffect(() => {
    // Fetch products only when drawer opens and products aren't loaded
    // Check isLoadingProducts to prevent multiple simultaneous fetches
    if (visible && !isLoadingProducts) {
      // Check if we need to fetch products
      const currentProducts = Array.isArray(productsRaw) ? productsRaw : productsRaw?.data || [];
      if (currentProducts.length === 0) {
        fetchAllData().catch((error) => {
          console.error('Error fetching products:', error);
        });
      }
    }
  }, [visible, isLoadingProducts]); // Depend on visible and isLoadingProducts only

  useEffect(() => {
    setSelectedProductIds(selectedProducts);
  }, [selectedProducts]);

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (mode === 'single') {
      // For single selection, immediately call onProductSelect
      onProductSelect(productId, {
        id: product.id,
        category: product.category,
        name: product.displayName || product.name,
        image: product.image || null,
        specifications: product.specifications || [],
        defaultUnit: product.defaultUnit || 'ton',
        priceRangeMin: product.priceRangeMin,
        priceRangeMax: product.priceRangeMax,
      });
    } else {
      // For multiple selection, toggle selection
      const newSelection = selectedProductIds.includes(productId)
        ? selectedProductIds.filter((id) => id !== productId)
        : [...selectedProductIds, productId];

      setSelectedProductIds(newSelection);
    }
  };

  const handleConfirmMultiple = () => {
    const selectedProductsData = selectedProductIds.map((id) => {
      const product = products.find((p) => p.id === id);
      return {
        id: product?.id,
        category: product?.category,
        name: product?.displayName || product?.name || 'Unknown Product',
        image: product?.image || null,
        specifications: product?.specifications || [],
        defaultUnit: product?.defaultUnit || 'ton',
        priceRangeMin: product?.priceRangeMin,
        priceRangeMax: product?.priceRangeMax,
      };
    });

    selectedProductIds.forEach((id, index) => {
      onProductSelect(id, selectedProductsData[index]);
    });
  };

  // Group products by category - handle undefined/null products array
  const groupedProducts = (products || []).reduce(
    (acc, product) => {
      const category = product.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    },
    {} as Record<string, typeof products>
  );

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: Record<string, string> = {
      SOFT_WHEAT: 'Soft Wheat',
      HARD_WHEAT: 'Hard Wheat',
      CORN: 'Corn',
      SOYBEANS: 'Soybeans',
      RICE: 'Rice',
      BARLEY: 'Barley',
      OATS: 'Oats',
      VEGETABLES: 'Vegetables',
      FRUITS: 'Fruits',
      DAIRY: 'Dairy',
      LIVESTOCK: 'Livestock',
    };
    return categoryNames[category] || category;
  };

  // Fallback image for products without images
  const getFallbackImage = (category: string) => {
    // Return a default image URL based on category
    return 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=Product';
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="bg-neutral-900 rounded-t-3xl"
          style={{
            flex: 1,
            marginTop: Platform.OS === 'web' ? 80 : 100,
            backgroundColor: '#171717',
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-neutral-700">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-400 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Select Product</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Content */}
          {isLoadingProducts ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#10B981" />
              <Text className="mt-4 text-gray-400">Loading products...</Text>
            </View>
          ) : Object.keys(groupedProducts).length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-400">No products available</Text>
              <TouchableOpacity
                onPress={() => fetchAllData()}
                className="mt-4 bg-green-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <View key={category} className="mb-6">
                  <Text className="text-lg font-semibold text-green-400 px-6 py-2">
                    {getCategoryDisplayName(category)}
                  </Text>

                  <View className="flex-row flex-wrap px-4">
                    {categoryProducts.map((product) => {
                      const isSelected = selectedProductIds.includes(product.id);

                      return (
                        <TouchableOpacity
                          key={product.id}
                          onPress={() => handleProductSelect(product.id)}
                          className="w-1/2 p-2"
                        >
                          <View
                            className={`bg-neutral-800 rounded-lg overflow-hidden border-2 ${
                              isSelected ? 'border-green-500' : 'border-transparent'
                            }`}
                          >
                            {/* Product Image */}
                            <View className="aspect-square bg-neutral-700">
                              <Image
                                source={{
                                  uri: product.image || getFallbackImage(product.category),
                                }}
                                className="w-full h-full"
                                resizeMode="cover"
                              />

                              {/* Selection Indicator */}
                              {isSelected && (
                                <View className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                  <Check color="#ffffff" size={16} />
                                </View>
                              )}
                            </View>

                            {/* Product Info */}
                            <View className="p-3">
                              <Text className="text-white font-medium text-sm" numberOfLines={2}>
                                {product.displayName || product.name}
                              </Text>

                              {/* Price Range */}
                              {product.priceRangeMin && product.priceRangeMax && (
                                <Text className="text-gray-400 text-xs mt-1">
                                  €{product.priceRangeMin} - €{product.priceRangeMax}/ton
                                </Text>
                              )}

                              {/* Harvest Season */}
                              {product.harvestSeason && (
                                <Text className="text-green-400 text-xs mt-1">
                                  {product.harvestSeason}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Footer for multiple selection */}
          {mode === 'multiple' && selectedProductIds.length > 0 && (
            <View className="absolute bottom-0 left-0 right-0 bg-neutral-800 border-t border-neutral-700 p-4">
              <TouchableOpacity
                onPress={handleConfirmMultiple}
                className="bg-green-500 py-3 px-6 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Select {selectedProductIds.length} Product
                  {selectedProductIds.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
