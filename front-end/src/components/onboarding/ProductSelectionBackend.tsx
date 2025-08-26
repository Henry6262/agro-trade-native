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
  const { selectedProducts, setSelectedProducts } = useOnboardingStore()
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
  }

  const clearAllProducts = () => {
    setSelectedProducts([])
  }

  const renderProductItem = ({ item: product }: { item: CategoryWithMetadata }) => (
    <TouchableOpacity
      key={product.category}
      style={{
        width: '31%',
        aspectRatio: 1,
        marginHorizontal: '1%',
        marginBottom: 12,
      }}
      onPress={() => toggleProduct(product.category)}
      activeOpacity={0.8}
    >
      <View
        style={{
          flex: 1,
          padding: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selectedProducts.includes(product.category) 
            ? 'rgba(34, 197, 94, 0.1)' 
            : '#1F2937',
          borderWidth: 2,
          borderColor: selectedProducts.includes(product.category) 
            ? '#22C55E' 
            : '#374151',
          borderRadius: 12,
        }}
      >
        {product.image ? (
          <Image 
            source={{ uri: product.image }}
            style={{ 
              width: 48, 
              height: 48, 
              marginBottom: 8,
              resizeMode: 'contain'
            }}
          />
        ) : (
          <View 
            style={{ 
              width: 48, 
              height: 48, 
              backgroundColor: '#374151',
              borderRadius: 24,
              marginBottom: 8
            }}
          />
        )}
        <Text
          style={{
            fontSize: 13,
            fontWeight: selectedProducts.includes(product.category) ? '600' : '500',
            color: selectedProducts.includes(product.category) ? '#22C55E' : '#D1D5DB',
            textAlign: 'center',
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {product.name}
        </Text>
      </View>
      {selectedProducts.includes(product.category) && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 24,
            height: 24,
            backgroundColor: '#22C55E',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#111827',
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={{ color: '#9CA3AF', marginTop: 16 }}>Loading products...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', padding: 24 }}>
        <View style={{
          width: 64,
          height: 64,
          backgroundColor: '#DC2626',
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertCircle size={32} color="#FFFFFF" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 8 }}>
          Error Loading Products
        </Text>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadProductData}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: '#22C55E',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <WebScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1,
          padding: 16 
        }}
      >
        <View style={{ gap: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
              What do you trade?
            </Text>
            <Text style={{ fontSize: 16, color: '#9CA3AF', textAlign: 'center' }}>
              Select all the agricultural products you work with
            </Text>
          </View>

          {/* Search Bar */}
          <View style={{ gap: 16 }}>
            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', left: 12, top: 14, zIndex: 10 }}>
                <Search size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  paddingLeft: 44,
                  paddingRight: searchQuery ? 44 : 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  borderWidth: 2,
                  borderColor: '#374151',
                  borderRadius: 8,
                  backgroundColor: '#1F2937',
                  color: '#FFFFFF',
                }}
                placeholderTextColor="#6B7280"
              />
              {searchQuery && (
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 14,
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setSearchQuery('')}
                >
                  <X size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Selection Info */}
            {selectedProducts.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Badge
                  style={{
                    backgroundColor: '#22C55E',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  {`${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} selected`}
                </Badge>
                <TouchableOpacity onPress={clearAllProducts}>
                  <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '500' }}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Agricultural Products Section */}
          <View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                Agricultural Products
              </Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
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
              <View
                style={{
                  padding: 32,
                  alignItems: 'center',
                  backgroundColor: '#1F2937',
                  borderWidth: 1,
                  borderColor: '#374151',
                  borderRadius: 8,
                }}
              >
                <View style={{ gap: 16, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: '#374151',
                      borderRadius: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Search size={32} color="#6B7280" />
                  </View>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                      No products found
                    </Text>
                    <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
                      Try adjusting your search
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Summary */}
          {selectedProducts.length > 0 && (
            <View
              style={{
                padding: 16,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.3)',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 16, color: '#22C55E', fontWeight: '600', textAlign: 'center' }}>
                Great! You've selected {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''}
              </Text>
              <Text style={{ fontSize: 14, color: '#10B981', textAlign: 'center', marginTop: 4 }}>
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