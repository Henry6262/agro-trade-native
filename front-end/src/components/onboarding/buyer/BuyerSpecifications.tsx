import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native'
import { Plus, ChevronUp, Package, Calendar } from 'lucide-react-native'
import type { ProductSpecification } from '../../../types/onboarding'
import { useOnboardingStore } from '../../../store/onboardingStore'
import { OnboardingLayout } from '../shared/OnboardingLayout'
import { ResponsiveGrid } from '../shared/ResponsiveGrid'

interface BuyerSpecificationsProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
}

export function BuyerSpecifications({
  selectedProducts,
  specifications,
  onSpecificationsChange,
}: BuyerSpecificationsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const { selectedProductsMetadata, setSelectedProductsMetadata } = useOnboardingStore()
  const [loading, setLoading] = useState(false)

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

  const addQualityRequirement = (productId: string, requirement: string) => {
    const spec = specifications.find((s) => s.productId === productId)
    if (spec && requirement.trim()) {
      const currentRequirements = spec.qualityRequirements || []
      updateSpecification(productId, 'qualityRequirements', [...currentRequirements, requirement.trim()])
    }
  }

  const removeQualityRequirement = (productId: string, index: number) => {
    const spec = specifications.find((s) => s.productId === productId)
    if (spec && spec.qualityRequirements) {
      const updated = spec.qualityRequirements.filter((_, i) => i !== index)
      updateSpecification(productId, 'qualityRequirements', updated)
    }
  }

  const renderSpecificationCard = (productId: string, index: number) => {
    // Use metadata from store
    const product = selectedProductsMetadata.find((p) => p.category === productId)
    const spec = specifications.find((s) => s.productId === productId)
    if (!product || !spec) return null

    const isExpanded = expandedCards.has(productId)
    const hasRequiredFields = spec.quantity && spec.pricePerKilo
    const isCompleted = hasRequiredFields && spec.quantity.toString().trim() !== '' && spec.pricePerKilo.toString().trim() !== ''

    return (
      <View className={`border rounded-lg overflow-hidden ${
        isCompleted 
          ? 'bg-emerald-500/10 border-emerald-500' 
          : 'bg-gray-800 border-gray-700'
      }`}>
        {/* Card Header */}
        <View className="p-4 border-b border-gray-700 relative">
          <View className="flex-row items-center">
            {product.image ? (
              <Image 
                source={{ uri: product.image }}
                className="w-16 h-16 rounded-lg mr-3"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-lg bg-gray-700 items-center justify-center mr-3">
                <Package size={28} color="#9CA3AF" />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-bold text-lg text-white">{product.name || product.category}</Text>
            </View>
            {isCompleted && (
              <View className="absolute top-2 right-2 bg-emerald-500 rounded-full w-6 h-6 items-center justify-center">
                <Text className="text-white text-sm font-bold">✓</Text>
              </View>
            )}
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
                placeholder="50"
                keyboardType="numeric"
                maxLength={6}
                className={`border-2 rounded-lg px-2 py-2 bg-gray-900 text-white text-center ${
                  !spec.quantity ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Max Price Field */}
            <View className="flex-1 px-1">
              <Text className="text-xs font-semibold text-gray-400 mb-2">
                Max Price/Kilo (€) <Text className="text-red-500">*</Text>
              </Text>
              <View className="relative">
                <Text className="absolute left-3 top-3.5 text-gray-400 text-base z-10">€</Text>
                <TextInput
                  value={spec.pricePerKilo?.toString() || ''}
                  onChangeText={(text) => updateSpecification(productId, 'pricePerKilo', text)}
                  placeholder="30"
                  keyboardType="decimal-pad"
                  maxLength={6}
                  className={`border-2 rounded-lg pl-6 pr-2 py-2 bg-gray-900 text-white text-center ${
                    !spec.pricePerKilo ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          </View>

          {/* Delivery Deadline */}
          <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-400 mb-2">
                Delivery Deadline
              </Text>
              <View className="relative">
                <Calendar size={16} color="#6B7280" className="absolute left-3 top-3.5 z-10" />
                <TextInput
                  value={spec.deliveryDeadline || ''}
                  onChangeText={(text) => updateSpecification(productId, 'deliveryDeadline', text)}
                  placeholder="DD/MM/YYYY"
                  className="border-2 border-gray-600 rounded-lg pl-10 pr-3 py-3 bg-gray-900 text-white"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

          {/* Quality Requirements Button */}
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
              {isExpanded ? 'Hide' : 'Add'} Quality Requirements
            </Text>
          </TouchableOpacity>

          {/* Expanded Quality Requirements */}
          {isExpanded && (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-gray-400 mb-2">
                Quality Requirements
              </Text>
              
              {/* Existing Requirements */}
              {spec.qualityRequirements && spec.qualityRequirements.length > 0 && (
                <View className="mb-3 space-y-2">
                  {spec.qualityRequirements.map((req, idx) => (
                    <View key={idx} className="flex-row items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                      <Text className="text-sm text-gray-300 flex-1">{req}</Text>
                      <TouchableOpacity
                        onPress={() => removeQualityRequirement(productId, idx)}
                        className="ml-2 p-1"
                      >
                        <Text className="text-red-500 text-xs">Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add New Requirement */}
              <View className="flex-row">
                <TextInput
                  placeholder="e.g., Organic certified, Grade A"
                  onSubmitEditing={(e) => {
                    addQualityRequirement(productId, e.nativeEvent.text)
                    e.nativeEvent.text = ''
                  }}
                  className="flex-1 border-2 border-gray-600 rounded-lg px-3 py-2 bg-gray-900 text-white mr-2"
                  placeholderTextColor="#6B7280"
                />
                <TouchableOpacity 
                  className="bg-blue-600 rounded-lg px-4 py-2 justify-center"
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Additional Notes */}
              <View className="mt-4">
                <Text className="text-xs font-semibold text-gray-400 mb-2">
                  Additional Notes
                </Text>
                <TextInput
                  value={spec.notes || ''}
                  onChangeText={(text) => updateSpecification(productId, 'notes', text)}
                  placeholder="Any other requirements or preferences..."
                  multiline
                  numberOfLines={3}
                  className="border-2 border-gray-600 rounded-lg px-3 py-2 bg-gray-900 text-white"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  // Loading state
  if (loading) {
    return (
      <OnboardingLayout>
        <View className="flex-1 items-center justify-center">
          <Package size={48} color="#9CA3AF" />
          <Text className="text-gray-400 mt-4">Loading product details...</Text>
        </View>
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout>
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-blue-500 mb-3">
          Purchase Requirements
        </Text>
        <Text className="text-gray-400 text-base">
          Specify quantity in tons and maximum price per kilo in euros.
          {'\n'}Add quality requirements to find the best suppliers.
        </Text>
      </View>

      {/* Product Cards Grid */}
      {specifications.length > 0 ? (
        <ResponsiveGrid minItemWidth={300} maxItemWidth={400} spacing={16}>
          {specifications.map((spec, index) => 
            renderSpecificationCard(spec.productId, index)
          )}
        </ResponsiveGrid>
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
    </OnboardingLayout>
  )
}