import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native'
import { WebScrollView } from '../../common/WebScrollView'
import { Search, X, Filter } from 'lucide-react-native'
import { products, categories } from '../../../constants/onboarding'
import { useOnboardingStore } from '../../../stores/onboarding-store'
import type { FilterState } from '../../../types/onboarding'
import { Badge } from '../../common/Badge'

export function ProductSelection() {
  const { selectedProducts, setSelectedProducts } = useOnboardingStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subcategory.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => product.category.toLowerCase().includes(cat.toLowerCase()))

    return matchesSearch && matchesCategory
  })

  const productsByCategory =
    selectedCategories.length === 0
      ? categories
          .filter((cat) => cat !== 'all')
          .reduce(
            (acc, category) => {
              const categoryProducts = filteredProducts.filter((product) =>
                product.category.toLowerCase().includes(category.toLowerCase()),
              )
              if (categoryProducts.length > 0) {
                acc[category] = categoryProducts
              }
              return acc
            },
            {} as Record<string, typeof products>,
          )
      : selectedCategories.reduce(
          (acc, category) => {
            const categoryProducts = filteredProducts.filter((product) =>
              product.category.toLowerCase().includes(category.toLowerCase()),
            )
            if (categoryProducts.length > 0) {
              acc[category] = categoryProducts
            }
            return acc
          },
          {} as Record<string, typeof products>,
        )

  const toggleProduct = (productId: string) => {
    const newSelected = selectedProducts.includes(productId)
      ? selectedProducts.filter((id) => id !== productId)
      : [...selectedProducts, productId]
    setSelectedProducts(newSelected)
  }

  const clearAllProducts = () => {
    setSelectedProducts([])
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((cat) => cat !== category) : [...prev, category],
    )
  }

  const selectAllCategories = () => {
    setSelectedCategories(categories.filter((cat) => cat !== 'all'))
  }

  const clearAllCategories = () => {
    setSelectedCategories([])
  }

  const renderProductItem = ({ item: product }: { item: typeof products[0] }) => (
    <TouchableOpacity
      key={product.id}
      style={{
        width: '30%',
        aspectRatio: 0.85, // Reduced aspect ratio to make cards smaller
        marginHorizontal: '1.5%',
        marginBottom: 8, // Reduced margin
      }}
      onPress={() => toggleProduct(product.id)}
      activeOpacity={0.8}
    >
      <View
        style={{
          flex: 1,
          padding: 8, // Reduced padding from 12 to 8
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selectedProducts.includes(product.id) 
            ? 'rgba(34, 197, 94, 0.1)' 
            : '#1F2937',
          borderWidth: 2,
          borderColor: selectedProducts.includes(product.id) 
            ? '#22C55E' 
            : '#374151',
          borderRadius: 6, // Slightly reduced border radius
        }}
      >
        <Text style={{ fontSize: 20, marginBottom: 4 }}>{product.icon}</Text>
        <Text
          style={{
            fontSize: 11, // Reduced font size
            fontWeight: selectedProducts.includes(product.id) ? '600' : '500',
            color: selectedProducts.includes(product.id) ? '#22C55E' : '#D1D5DB',
            textAlign: 'center',
            lineHeight: 14, // Reduced line height
          }}
          numberOfLines={2}
        >
          {product.name}
        </Text>
      </View>
      {selectedProducts.includes(product.id) && (
        <View
          style={{
            position: 'absolute',
            top: -3, // Adjusted position
            right: -3, // Adjusted position
            width: 18, // Reduced size
            height: 18, // Reduced size
            backgroundColor: '#22C55E',
            borderRadius: 9, // Adjusted radius
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  const renderCategorySection = ({ item }: { item: [string, typeof products] }) => {
    const [category, categoryProducts] = item
    
    return (
      <View key={category} style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', textTransform: 'capitalize' }}>
            {category}
          </Text>
          <Badge
            style={{
              backgroundColor: '#374151',
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            {`${categoryProducts.length} items`}
          </Badge>
        </View>

        <FlatList
          data={categoryProducts}
          renderItem={renderProductItem}
          numColumns={3}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
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
                    <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Categories</Text>
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
                  {selectedCategories.map((category) => (
                    <Badge
                      key={category}
                      style={{
                        backgroundColor: '#374151',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
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

      {/* Category Modal */}
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
                Select Categories
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
                  {categories
                    .filter((cat) => cat !== 'all')
                    .map((category) => (
                      <TouchableOpacity
                        key={category}
                        onPress={() => toggleCategory(category)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: selectedCategories.includes(category) ? '#22C55E' : '#374151',
                          borderWidth: 1,
                          borderColor: selectedCategories.includes(category) ? '#22C55E' : '#374151',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: selectedCategories.includes(category) ? '#FFFFFF' : '#9CA3AF',
                            textTransform: 'capitalize',
                          }}
                        >
                          {category}
                          {selectedCategories.includes(category) && ' ✓'}
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
                  Apply Categories ({selectedCategories.length})
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}