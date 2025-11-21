import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useProductStore } from '@stores/product.store';

interface ProductSelectionDrawerSimpleProps {
  visible: boolean;
  onClose: () => void;
  onProductSelect: (productId: string, productData: any) => void;
  mode?: 'single' | 'multiple';
  selectedProducts?: string[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ProductSelectionDrawerSimple: React.FC<ProductSelectionDrawerSimpleProps> = ({
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

  // Group products by category
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

  if (!visible) {
    return null;
  }

  // Use absolute positioning instead of Modal
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 999,
      }}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={{
            flex: 1,
            marginTop: Platform.OS === 'web' ? 80 : 100,
            backgroundColor: '#171717',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          onStartShouldSetResponder={() => true}
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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="p-6 space-y-6">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <View key={category}>
                    <Text className="text-lg font-semibold text-white mb-3">
                      {getCategoryDisplayName(category)}
                    </Text>
                    <View className="space-y-3">
                      {categoryProducts.map((product) => (
                        <TouchableOpacity
                          key={product.id}
                          onPress={() => handleProductSelect(product.id)}
                          className={`flex-row items-center p-4 bg-neutral-800 rounded-xl border ${
                            selectedProductIds.includes(product.id)
                              ? 'border-green-500'
                              : 'border-neutral-700'
                          }`}
                        >
                          <Image
                            source={{
                              uri:
                                product.image ||
                                'https://via.placeholder.com/200x200/10B981/FFFFFF?text=Product',
                            }}
                            className="w-16 h-16 rounded-lg"
                            resizeMode="cover"
                          />
                          <View className="flex-1 ml-4">
                            <Text className="text-white font-semibold">
                              {product.displayName || product.name}
                            </Text>
                            <Text className="text-gray-400 text-sm mt-1">
                              {product.description || 'Premium quality product'}
                            </Text>
                          </View>
                          {selectedProductIds.includes(product.id) && (
                            <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center">
                              <Check color="#ffffff" size={16} />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};
