import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { WebScrollView } from '../common/WebScrollView'
import { Search, X, Filter, AlertCircle } from 'lucide-react-native'
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

export function ProductSelectionWithBackend() {
  const { selectedProducts, setSelectedProducts } = useOnboardingStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Data from backend - simplified to just categories
  const [categoriesData, setCategoriesData] = useState<CategoryWithMetadata[]>([])

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
      setCategoriesData(categoriesResponse)
    } catch (err) {
      console.error('Error loading product data:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = categoriesData.filter((product) => {
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
        width: '30%',
        aspectRatio: 0.85,
        marginHorizontal: '1.5%',
        marginBottom: 8,
      }}
      onPress={() => toggleProduct(product.category)}
      activeOpacity={0.8}
    >
      <View
        style={{
          flex: 1,
          padding: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selectedProducts.includes(product.category) 
            ? 'rgba(34, 197, 94, 0.1)' 
            : '#1F2937',
          borderWidth: 2,
          borderColor: selectedProducts.includes(product.category) 
            ? '#22C55E' 
            : '#374151',
          borderRadius: 6,
        }}
      >
        {product.image ? (
          <Image 
            source={{ uri: product.image }}
            style={{ 
              width: 32, 
              height: 32, 
              marginBottom: 4,
              resizeMode: 'contain'
            }}
          />
        ) : (
          <View 
            style={{ 
              width: 32, 
              height: 32, 
              backgroundColor: '#374151',
              borderRadius: 16,
              marginBottom: 4
            }}
          />
        )}
        <Text
          style={{
            fontSize: 11,
            fontWeight: selectedProducts.includes(product.category) ? '600' : '500',
            color: selectedProducts.includes(product.category) ? '#22C55E' : '#D1D5DB',
            textAlign: 'center',
            lineHeight: 14,
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
            top: -3,
            right: -3,
            width: 18,
            height: 18,
            backgroundColor: '#22C55E',
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
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
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
              What do you sell?
            </Text>
            <Text style={{ fontSize: 16, color: '#9CA3AF', textAlign: 'center' }}>
              Select the products you're interested in
            </Text>
          </View>

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
                  paddingRight: 44,
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

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Badge
                    style={{
                      backgroundColor: '#22C55E',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    All Categories
                  </Badge>
                  <TouchableOpacity
                    style={{
                      height: 28,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: '#374151',
                      borderRadius: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#1F2937',
                      gap: 4,
                    }}
                    onPress={() => setShowCategoryModal(true)}
                  >
                    <Filter size={14} color="#9CA3AF" />
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Filter</Text>
                  </TouchableOpacity>
                </View>
                {selectedProducts.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Badge
                      style={{
                        backgroundColor: '#374151',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      {`${selectedProducts.length} selected`}
                    </Badge>
                    <TouchableOpacity onPress={clearAllProducts}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {selectedCategories.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {selectedCategories.map((category) => {
                    const categoryInfo = categoriesData.find(c => c.category === category)
                    return (
                      <Badge
                        key={category}
                        style={{
                          backgroundColor: '#374151',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                      >
                        {categoryInfo?.name || category}
                      </Badge>
                    )
                  })}
                </View>
              )}
            </View>
          </View>

          <FlatList
            data={Object.entries(productsByCategory)}
            renderItem={renderCategorySection}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />

          {Object.keys(productsByCategory).length === 0 && (
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
                    Try adjusting your search or categories
                  </Text>
                </View>
              </View>
            </View>
          )}

          {selectedProducts.length > 0 && (
            <View
              style={{
                padding: 12,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.3)',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: '#22C55E' }}>
                {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
              </Text>
            </View>
          )}
        </View>
      </WebScrollView>

      {/* Category Filter Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#1F2937',
              borderRadius: 12,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              maxHeight: '80%',
              borderWidth: 1,
              borderColor: '#374151',
            }}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                Filter by Category
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={{ padding: 4 }}
              >
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#22C55E',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                  }}
                  onPress={selectAllCategories}
                >
                  <Text style={{ fontSize: 12, color: '#22C55E' }}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#EF4444',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                  }}
                  onPress={clearAllCategories}
                >
                  <Text style={{ fontSize: 12, color: '#EF4444' }}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {categoriesData.map((categoryData) => (
                    <TouchableOpacity
                      key={categoryData.category}
                      onPress={() => toggleCategory(categoryData.category)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 6,
                        backgroundColor: selectedCategories.includes(categoryData.category) ? '#22C55E' : '#374151',
                        borderWidth: 1,
                        borderColor: selectedCategories.includes(categoryData.category) ? '#22C55E' : '#374151',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: selectedCategories.includes(categoryData.category) ? '#FFFFFF' : '#9CA3AF',
                        }}
                      >
                        {categoryData.name}
                        {selectedCategories.includes(categoryData.category) && ' ✓'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={{
                  width: '100%',
                  height: 44,
                  backgroundColor: '#22C55E',
                  borderRadius: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Apply Filters ({selectedCategories.length})
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}