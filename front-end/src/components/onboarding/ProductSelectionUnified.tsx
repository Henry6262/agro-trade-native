import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useOnboardingStore } from '../../store/onboardingStore';

interface Product {
  id: string;
  category: string;
  name: string;
  description?: string;
  image?: string;
}

export const ProductSelectionUnified: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { 
    role,
    setSelectedProducts: updateSelectedProducts,
    setSelectedProductsMetadata,
    nextStep,
    selectedProducts: storeSelectedProducts,
  } = useOnboardingStore();

  useEffect(() => {
    fetchProducts();
    // Initialize with stored selections
    if (storeSelectedProducts && storeSelectedProducts.length > 0) {
      setSelectedProductIds(storeSelectedProducts);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/metadata`);
      
      // Handle nested response structure
      const productsData = response.data.data || response.data;
      const productsArray = Array.isArray(productsData) ? productsData : [];
      
      // Format products consistently
      const formattedProducts = productsArray.map(p => ({
        id: p.category || p.id,
        category: p.category,
        name: p.name || p.displayName,
        description: p.description,
        image: p.image,
      }));
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelection = selectedProductIds.includes(productId)
      ? selectedProductIds.filter(id => id !== productId)
      : [...selectedProductIds, productId];
    
    setSelectedProductIds(newSelection);
    
    // Update store immediately
    updateSelectedProducts(newSelection);
    
    // Update metadata
    const metadata = newSelection.map(id => {
      const product = products.find(p => p.id === id);
      return {
        category: id,
        name: product?.name || 'Unknown Product',
        image: product?.image || null,
      };
    });
    setSelectedProductsMetadata(metadata);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-4 bg-gray-900">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-400">Loading products...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-4 pb-24">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-primary-500 mb-2">
            {role === 'buyer' ? 'What do you need?' : 'What do you offer?'}
          </Text>
          <Text className="text-gray-400">
            Select the agricultural products you want to {role === 'buyer' ? 'purchase' : 'sell'}
          </Text>
        </View>

        {/* Product Grid */}
        <View className="flex-row flex-wrap -mx-2">
          {products && products.length > 0 ? products.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            
            return (
              <View key={product.id} className="w-1/2 p-2">
                <TouchableOpacity
                  onPress={() => toggleProduct(product.id)}
                  className={`rounded-xl overflow-hidden border ${
                    isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500' 
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(31, 41, 55, 0.5)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {/* Product Image */}
                  {product.image && (
                    <View className="relative" style={{ aspectRatio: 1 }}>
                      <Image
                        source={{ 
                          uri: product.image.startsWith('http') 
                            ? product.image 
                            : `${API_URL.replace('/api', '')}/static/${product.image}`
                        }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      {isSelected && (
                        <View className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Product Info */}
                  <View className="p-3">
                    <Text className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {product.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }) : (
            <View className="w-full p-4">
              <Text className="text-center text-gray-500">Loading products...</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};