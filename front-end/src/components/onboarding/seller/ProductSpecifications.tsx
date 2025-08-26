import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native'
import { Package, ChevronDown, ChevronUp, Plus } from 'lucide-react-native'
import type { ProductSpecification } from '../../../types/onboarding'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface ProductSpecificationsProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
}

export function ProductSpecifications({
  selectedProducts,
  specifications,
  onSpecificationsChange,
}: ProductSpecificationsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const { selectedProductsMetadata, setSelectedProductsMetadata } = useOnboardingStore()
  const [loading, setLoading] = useState(false)
  const { width } = Dimensions.get('window')
  const isLargeScreen = width >= 768

  // Load product metadata if missing
  useEffect(() => {
    if (selectedProducts.length > 0 && selectedProductsMetadata.length === 0) {
      loadProductMetadata()
    }
  }, [selectedProducts])

  const loadProductMetadata = async () => {
    try {
      setLoading(true)
      const { productService } = await import('../../../services/productService')
      const categoriesResponse = await productService.getCategoriesWithMetadata()
      // Filter to only include selected products
      const selectedMetadata = categoriesResponse.filter(cat => 
        selectedProducts.includes(cat.category)
      )
      setSelectedProductsMetadata(selectedMetadata)
    } catch (err) {
      console.error('Error loading product metadata:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSpecification = (productId: string, field: string, value: any) => {
    const updatedSpecs = specifications.map((spec) => {
      if (spec.productId === productId) {
        const updates = { ...spec, [field]: value }
        // Always set unit to tons
        if (field === 'quantity') {
          updates.unit = 'tons'
        }
        return updates
      }
      return spec
    })
    onSpecificationsChange(updatedSpecs)
  }

  const toggleCardExpansion = (productId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedCards(newExpanded)
  }

  const renderSpecificationCard = (productId: string, index: number) => {
    // Use metadata from store
    const product = selectedProductsMetadata.find((p) => p.category === productId)
    const spec = specifications.find((s) => s.productId === productId)
    if (!product || !spec) return null

    const isExpanded = expandedCards.has(productId)

    return (
      <View 
        key={productId} 
        className={`${isLargeScreen ? 'w-1/2' : 'w-full'} p-2`}
      >
        <View className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {/* Card Header */}
          <View className="p-4 border-b border-gray-700">
            <View className="flex-row items-center">
              {product.image ? (
                <Image 
                  source={{ uri: product.image }}
                  className="w-12 h-12 rounded-lg mr-3"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-12 h-12 rounded-lg bg-gray-700 items-center justify-center mr-3">
                  <Package size={24} color="#9CA3AF" />
                </View>
              )}
              <View className="flex-1">
                <Text className="font-bold text-lg text-white">{product.name || product.category}</Text>
              </View>
            </View>
          </View>

          {/* Card Content */}
          <View className="p-4">
            {/* Required Fields in One Row */}
            <View className="flex-row -mx-1 mb-4">
              {/* Quantity Field */}
              <View className="flex-1 px-1">
                <Text className="text-xs font-semibold text-gray-400 mb-2">
                  Quantity (tons) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={spec.quantity?.toString() || ''}
                  onChangeText={(text) => updateSpecification(productId, 'quantity', text)}
                  placeholder="e.g., 100"
                  keyboardType="numeric"
                  className={`border-2 rounded-lg px-3 py-3 bg-gray-900 text-white ${
                    !spec.quantity ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Price Field */}
              <View className="flex-1 px-1">
                <Text className="text-xs font-semibold text-gray-400 mb-2">
                  Price/Kilo (€) <Text className="text-red-500">*</Text>
                </Text>
                <View className="relative">
                  <Text className="absolute left-3 top-3.5 text-gray-400 text-base z-10">€</Text>
                  <TextInput
                    value={spec.pricePerKilo?.toString() || ''}
                    onChangeText={(text) => updateSpecification(productId, 'pricePerKilo', text)}
                    placeholder="25.50"
                    keyboardType="decimal-pad"
                    className={`border-2 rounded-lg pl-8 pr-3 py-3 bg-gray-900 text-white ${
                      !spec.pricePerKilo ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>
            </View>

            {/* Optional Fields Button */}
            <TouchableOpacity
              onPress={() => toggleCardExpansion(productId)}
              className="border-2 border-dashed border-gray-700 rounded-lg py-3 flex-row items-center justify-center bg-gray-900/50"
            >
              {isExpanded ? (
                <ChevronUp size={16} color="#9CA3AF" />
              ) : (
                <Plus size={16} color="#9CA3AF" />
              )}
              <Text className="text-gray-400 ml-2 text-sm">
                {isExpanded ? 'Hide' : 'Add'} Optional Details
              </Text>
            </TouchableOpacity>

            {/* Expanded Optional Fields */}
            {isExpanded && (
              <View className="mt-4 space-y-3">
                <View>
                  <Text className="text-xs font-semibold text-gray-400 mb-2">
                    Harvest Date
                  </Text>
                  <TextInput
                    value={spec.harvestDate || ''}
                    onChangeText={(text) => updateSpecification(productId, 'harvestDate', text)}
                    placeholder="DD/MM/YYYY"
                    className="border-2 border-gray-600 rounded-lg px-3 py-3 bg-gray-900 text-white"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-gray-400 mb-2">
                    Storage Location
                  </Text>
                  <TextInput
                    value={spec.storageLocation || ''}
                    onChangeText={(text) => updateSpecification(productId, 'storageLocation', text)}
                    placeholder="e.g., Warehouse A, City"
                    className="border-2 border-gray-600 rounded-lg px-3 py-3 bg-gray-900 text-white"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View>
                  <Text className="text-xs font-semibold text-gray-400 mb-2">
                    Quality Notes
                  </Text>
                  <TextInput
                    value={spec.qualityNotes || ''}
                    onChangeText={(text) => updateSpecification(productId, 'qualityNotes', text)}
                    placeholder="e.g., Organic certified, Premium grade"
                    multiline
                    numberOfLines={3}
                    className="border-2 border-gray-600 rounded-lg px-3 py-3 bg-gray-900 text-white"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <Package size={48} color="#9CA3AF" />
        <Text className="text-gray-400 mt-4">Loading product details...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold text-green-500 text-center mb-3">
              Product Details
            </Text>
            <Text className="text-gray-400 text-base text-center max-w-lg">
              Set quantity in tons and price per kilo in euros for your selected products
            </Text>
          </View>

          {/* Product Cards Grid */}
          {specifications.length > 0 ? (
            <View className={`${isLargeScreen ? 'flex-row flex-wrap -mx-2' : ''}`}>
              {specifications.map((spec, index) => 
                renderSpecificationCard(spec.productId, index)
              )}
            </View>
          ) : (
            <View className="bg-gray-800 border border-gray-700 rounded-lg p-8 items-center">
              <View className="w-16 h-16 bg-gray-700 rounded-full items-center justify-center mb-4">
                <Package size={32} color="#6B7280" />
              </View>
              <Text className="text-lg font-semibold text-white mb-2">
                No Products Selected
              </Text>
              <Text className="text-sm text-gray-400 text-center">
                Go back to select products first
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}