import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import { Package, MapPin, ShoppingCart, Info, Check } from 'lucide-react-native'
import type { ProductSpecification } from '@shared/types/onboarding'
import { useOnboardingStore } from '@stores/onboarding.store'
import { OnboardingLayout } from '../shared/OnboardingLayout'
import { DynamicGrid } from '../shared/DynamicGrid'

interface BuyerMarketRequestProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
  onComplete?: () => void
}

export function BuyerMarketRequest({
  selectedProducts,
  specifications,
  onSpecificationsChange,
  onComplete,
}: BuyerMarketRequestProps) {
  const { width } = Dimensions.get('window')
  const isLargeScreen = width >= 768
  
  const { 
    selectedProductsMetadata, 
    userLocation,
    buyerSpecifications 
  } = useOnboardingStore()

  const handleComplete = () => {
    console.log('Completing purchase request with:', { selectedProducts, specifications })
    onComplete?.()
  }

  // Calculate totals
  const calculateTotals = () => {
    let totalQuantity = 0
    let totalBudget = 0

    specifications.forEach(spec => {
      const quantity = parseFloat(spec.quantity) || 0
      const pricePerKilo = parseFloat(spec.pricePerKilo) || 0
      const multiplier = spec.unit === 'tons' || spec.unit === 'ton' ? 1000 : 
                        spec.unit === 'quintal' ? 100 : 1
      const quantityInKg = quantity * multiplier
      totalQuantity += quantityInKg / 1000 // Convert to tons
      totalBudget += quantityInKg * pricePerKilo
    })

    return { totalQuantity, totalBudget }
  }

  const { totalQuantity, totalBudget } = calculateTotals()

  // Format currency with K, M suffixes
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}K`
    }
    return `€${value.toFixed(0)}`
  }

  const renderProductCard = (spec: ProductSpecification, index: number) => {
    const metadata = selectedProductsMetadata.find(m => m.category === spec.productId)
    const productName = metadata?.name || spec.productId
    
    const quantity = parseFloat(spec.quantity) || 0
    const pricePerKilo = parseFloat(spec.pricePerKilo) || 0
    const multiplier = spec.unit === 'tons' || spec.unit === 'ton' ? 1000 : 
                      spec.unit === 'quintal' ? 100 : 1
    const quantityInKg = quantity * multiplier
    const totalPrice = quantityInKg * pricePerKilo

    return (
        <View className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          {/* Product Image */}
          {metadata?.image && (
            <View className="relative">
              <Image
                source={{ uri: metadata.image }}
                style={{ width: '100%', height: 140 }}
                resizeMode="cover"
              />
              <View className="absolute top-2 right-2 bg-gray-900/80 px-2 py-1 rounded-lg">
                <Text className="text-white text-xs font-semibold">Request</Text>
              </View>
            </View>
          )}
          
          {/* Product Details */}
          <View className="p-4">
            <Text className="text-white font-bold text-lg mb-2">
              {productName}
            </Text>
            
            {/* Quantity Required */}
            <View className="flex-row items-center mb-3">
              <Package size={16} color="#9ca3af" />
              <Text className="text-gray-300 ml-2">
                {spec.quantity} {spec.unit} required
              </Text>
            </View>

            {/* Price and Budget Info */}
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-gray-500 text-xs mb-1">Max Price</Text>
                <Text className="text-gray-300 font-semibold">
                  €{pricePerKilo}/kg
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-1">Budget</Text>
                <Text className="text-white font-bold text-lg">
                  {formatCurrency(totalPrice)}
                </Text>
              </View>
            </View>
          </View>
        </View>
    )
  }

  return (
    <OnboardingLayout>
        {/* Header Section */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-primary-500 text-center mb-2">
            Purchase Request
          </Text>
          <Text className="text-gray-400 text-center">
            Review your complete request before submitting
          </Text>
        </View>

        {/* Delivery Location */}
        {userLocation && (
          <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <View className="flex-row items-center">
              <MapPin size={20} color="#3b82f6" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-400 text-sm">Delivery Location</Text>
                <Text className="text-white font-semibold">
                  {userLocation.city}{userLocation.country && `, ${userLocation.country}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Summary Stats - All in one row */}
        <View className="flex-row mb-6 -mx-1">
          <View className="flex-1 px-1">
            <View className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <Text className="text-gray-400 text-xs">Products</Text>
              <Text className="text-lg font-bold text-white">
                {selectedProducts.length}
              </Text>
            </View>
          </View>
          
          <View className="flex-1 px-1">
            <View className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <Text className="text-gray-400 text-xs">Volume</Text>
              <Text className="text-lg font-bold text-white">
                {totalQuantity.toFixed(1)}t
              </Text>
            </View>
          </View>
          
          <View className="flex-1 px-1">
            <View className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <Text className="text-gray-400 text-xs">Budget</Text>
              <Text className="text-lg font-bold text-white">
                {formatCurrency(totalBudget)}
              </Text>
            </View>
          </View>
        </View>

        {/* Products Grid */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-white mb-3">
            Products to Purchase ({selectedProducts.length})
          </Text>
          <DynamicGrid minItemWidth={200} maxItemWidth={350} spacing={12}>
            {specifications.map((spec, index) => renderProductCard(spec, index))}
          </DynamicGrid>
        </View>

        {/* Information Notice */}
        <View className="bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-700/30">
          <View className="flex-row">
            <Info size={20} color="#60a5fa" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-400 font-semibold mb-1">How it Works</Text>
              <Text className="text-blue-300 text-sm">
                Once submitted, your purchase request will be sent to verified sellers. 
                You'll receive quotes within 24-48 hours and can choose the best offer.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={handleComplete}
          className="bg-blue-500 rounded-xl py-4 px-6 flex-row justify-center items-center mb-3"
        >
          <ShoppingCart size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">
            Submit Purchase Request
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-800 rounded-xl py-3 px-6 flex-row justify-center items-center border border-gray-700"
        >
          <Text className="text-gray-400 font-medium">
            Save as Draft
          </Text>
        </TouchableOpacity>
    </OnboardingLayout>
  )
}