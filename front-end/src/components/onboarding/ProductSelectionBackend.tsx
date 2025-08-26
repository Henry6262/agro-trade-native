import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { WebScrollView } from '../common/WebScrollView'
import { Search, X, AlertCircle } from 'lucide-react-native'
import { useOnboardingStore } from '../../store/onboardingStore'
import { Badge } from '../common/Badge'
import { productService } from '../../services/productService'

interface CategoryWithMetadata {
  category: string;
  name: string;
  image: string | null;
  description: string | null;
  availableProducts: number;
}

export function ProductSelectionBackend() {
  const { selectedProducts, setSelectedProducts, setSelectedProductsMetadata } = useOnboardingStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data from backend
  const [products, setProducts] = useState<CategoryWithMetadata[]>([])

  // Fetch data from backend
  useEffect(() => {
    loadProductData()
  }, [])

  const loadProductData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch categories which represent available products
      const categoriesResponse = await productService.getCategoriesWithMetadata()
      setProducts(categoriesResponse)
    } catch (err) {
      console.error('Error loading product data:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  const toggleProduct = (productCategory: string) => {
    const newSelected = selectedProducts.includes(productCategory)
      ? selectedProducts.filter((cat) => cat !== productCategory)
      : [...selectedProducts, productCategory]
    setSelectedProducts(newSelected)
    
    // Also update metadata
    const selectedMetadata = products.filter(p => newSelected.includes(p.category))
    setSelectedProductsMetadata(selectedMetadata)
  }

  const clearAllProducts = () => {
    setSelectedProducts([])
    setSelectedProductsMetadata([])
  }

  const renderProductItem = ({ item: product }: { item: CategoryWithMetadata }) => (
    <TouchableOpacity
      key={product.category}
      style={{
        width: '31%',
        marginHorizontal: '1%',
        marginBottom: 16,
      }}
      onPress={() => toggleProduct(product.category)}
      activeOpacity={0.8}
    >
      <View
        style={{
          backgroundColor: selectedProducts.includes(product.category) 
            ? 'rgba(34, 197, 94, 0.1)' 
            : '#1F2937',
          borderWidth: 2,
          borderColor: selectedProducts.includes(product.category) 
            ? '#22C55E' 
            : '#374151',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Square Image Container */}
        <View 
          style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: '#111827',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
          }}
        >
          {product.image ? (
            <Image 
              source={{ uri: product.image }}
              style={{ 
                width: '100%', 
                height: '100%',
                resizeMode: 'contain'
              }}
            />
          ) : (
            <View 
              style={{ 
                width: '70%', 
                height: '70%', 
                backgroundColor: '#374151',
                borderRadius: 8,
              }}
            />
          )}
        </View>
        
        {/* Product Name Section */}
        <View 
          style={{
            padding: 8,
            minHeight: 45,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selectedProducts.includes(product.category)
              ? 'rgba(34, 197, 94, 0.05)'
              : '#1F2937',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: selectedProducts.includes(product.category) ? '600' : '500',
              color: selectedProducts.includes(product.category) ? '#22C55E' : '#D1D5DB',
              textAlign: 'center',
              lineHeight: 16,
            }}
            numberOfLines={2}
          >
            {product.name}
          </Text>
        </View>
      </View>
      
      {/* Selection Checkmark */}
      {selectedProducts.includes(product.category) && (
        <View 
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 24,
            height: 24,
            backgroundColor: '#22C55E',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#111827',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-400 mt-4">Loading products...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900 p-6">
        <View className="w-16 h-16 bg-red-600 rounded-full items-center justify-center mb-4">
          <AlertCircle size={32} color="#FFFFFF" />
        </View>
        <Text className="text-lg font-semibold text-white mb-2">
          Error Loading Products
        </Text>
        <Text className="text-sm text-gray-400 text-center mb-6">
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadProductData}
          className="px-6 py-3 bg-primary-500 rounded-lg"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <WebScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1,
          padding: 16 
        }}
      >
        <View className="space-y-6">
          {/* Header */}
          <View className="items-center space-y-2">
            <Text className="text-3xl font-bold text-white text-center">
              What do you trade?
            </Text>
            <Text className="text-base text-gray-400 text-center">
              Select all the agricultural products you work with
            </Text>
          </View>

          {/* Search Bar */}
          <View className="space-y-4">
            <View className="relative">
              <View className="absolute left-3 top-3.5 z-10">
                <Search size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className={`
                  pl-11 py-3 text-base border-2 border-gray-600 rounded-lg bg-gray-800 text-white
                  ${searchQuery ? 'pr-11' : 'pr-4'}
                `}
                placeholderTextColor="#6B7280"
              />
              {searchQuery && (
                <TouchableOpacity
                  className="absolute right-3 top-3.5 w-6 h-6 items-center justify-center"
                  onPress={() => setSearchQuery('')}
                >
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Selection Info */}
            {selectedProducts.length > 0 && (
              <View className="flex-row items-center justify-between">
                <Badge className="bg-primary-500 px-3 py-1.5">
                  {`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} selected`}
                </Badge>
                <TouchableOpacity onPress={clearAllProducts}>
                  <Text className="text-sm text-red-500 font-medium">Clear all</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Agricultural Products Section */}
          <View>
            <View className="mb-4">
              <Text className="text-xl font-semibold text-white mb-1">
                Agricultural Products
              </Text>
              <Text className="text-sm text-gray-400">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
              </Text>
            </View>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                numColumns={3}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.category}
              />
            ) : (
              <View className="p-8 items-center bg-gray-800 border border-gray-600 rounded-lg">
                <View className="space-y-4 items-center">
                  <View className="w-16 h-16 bg-gray-600 rounded-full items-center justify-center">
                    <Search size={32} color="#6B7280" />
                  </View>
                  <View className="items-center space-y-1">
                    <Text className="text-lg font-semibold text-white">
                      No products found
                    </Text>
                    <Text className="text-sm text-gray-400 text-center">
                      Try adjusting your search
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Summary */}
          {selectedProducts.length > 0 && (
            <View className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
              <Text className="text-base text-primary-500 font-semibold text-center">
                Great! You've selected {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''}
              </Text>
              <Text className="text-sm text-green-500 text-center mt-1">
                You can proceed to the next step
              </Text>
            </View>
          )}
        </View>
      </WebScrollView>
    </SafeAreaView>
  )
}

export default ProductSelectionBackend