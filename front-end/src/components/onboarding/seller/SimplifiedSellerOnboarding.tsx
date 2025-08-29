import React, { useState, useEffect } from 'react'
import { View, ScrollView, SafeAreaView, Text, Alert } from 'react-native'
import type { OnboardingStep, ProductSpecification } from '../../../types/onboarding'
import { roleSteps } from '../../../constants/onboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { ProductSelectionBackend } from '../ProductSelectionBackend'
import { ProductSpecifications } from './ProductSpecifications'
import { MarketOverview } from './MarketOverview'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface SimplifiedSellerOnboardingProps {
  onComplete?: () => void
}

export function SimplifiedSellerOnboarding({ onComplete }: SimplifiedSellerOnboardingProps) {
  const { 
    selectedProducts, 
    setSelectedProducts,
    selectedProductsMetadata, 
    sellerSpecifications, 
    updateSellerSpecification,
    setSellerProducts,
    sellerData,
    currentStep,
    setStep,
    saveOnboardingData
  } = useOnboardingStore()
  
  // Simplified steps without base management
  const simplifiedSteps: OnboardingStep[] = [
    {
      id: 'products',
      title: 'Select Products',
      description: 'Choose the products you want to trade',
      completed: false
    },
    {
      id: 'specifications',
      title: 'Product Details',
      description: 'Add quantities and specifications',
      completed: false
    },
    {
      id: 'location',
      title: 'Your Location',
      description: 'Get pricing for your area',
      completed: false
    },
    {
      id: 'market',
      title: 'Market Overview',
      description: 'Review pricing and complete setup',
      completed: false
    }
  ]

  const [currentStepIndex, setCurrentStepIndex] = useState(currentStep >= 0 ? currentStep : 0)
  const [steps, setSteps] = useState<OnboardingStep[]>(simplifiedSteps)
  const [productSpecifications, setProductSpecifications] = useState<ProductSpecification[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [progressLineHeight, setProgressLineHeight] = useState(0)
  const [userLocation, setUserLocation] = useState<{city: string, country: string} | null>(null)

  useEffect(() => {
    // Mark previous steps as completed
    const updatedSteps = simplifiedSteps.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex
    }))
    setSteps(updatedSteps)
    
    // Sync current step index with store on mount
    if (currentStep !== currentStepIndex) {
      setCurrentStepIndex(currentStep)
    }
  }, [])

  useEffect(() => {
    // Calculate progress
    const completedSteps = currentStepIndex
    const totalSteps = steps.length - 1
    const progressPercentage = totalSteps > 0 ? Math.max(0, (completedSteps / totalSteps) * 100) : 0
    setProgressLineHeight(Math.min(progressPercentage, 100))
  }, [currentStepIndex, steps.length])

  // Sync selectedProducts to sellerData.selectedProducts
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const { products } = require('../../../constants/onboarding')
      
      const productSelections = selectedProducts.map(productId => {
        const product = products.find((p: any) => p.id === productId)
        const specs = sellerSpecifications[productId] || {}
        
        return {
          productId,
          productName: product?.name || 'Unknown Product',
          category: product?.category || 'Other',
          varieties: specs.varieties || [],
          quantity: {
            amount: specs.quantity || 0,
            unit: specs.unit || 'tons' as const
          },
          priceRange: specs.pricePerKilo ? {
            min: parseFloat(specs.pricePerKilo) * 0.9,
            max: parseFloat(specs.pricePerKilo) * 1.1,
            currency: 'EUR'
          } : undefined,
          qualitySpecs: specs.qualitySpecs || []
        }
      })
      
      setSellerProducts(productSelections)
    }
  }, [selectedProducts, sellerSpecifications, setSellerProducts])

  // Sync specifications
  useEffect(() => {
    const newSpecs = selectedProducts.map(productId => {
      const existingSpec = productSpecifications.find(spec => spec.productId === productId)
      if (existingSpec) {
        return existingSpec
      }
      return {
        productId,
        quantity: '',
        unit: '',
        pricePerKilo: '',
        ...sellerSpecifications[productId]
      }
    })
    setProductSpecifications(newSpecs)
  }, [selectedProducts])

  // Update store when specifications change
  useEffect(() => {
    productSpecifications.forEach(spec => {
      updateSellerSpecification(spec.productId, spec)
    })
    
    // Auto-save data when specifications change
    if (productSpecifications.length > 0) {
      const saveTimer = setTimeout(() => {
        saveOnboardingData().catch(console.error)
      }, 1000)
      
      return () => clearTimeout(saveTimer)
    }
  }, [productSpecifications, updateSellerSpecification, saveOnboardingData])

  const handleNext = async () => {
    if (!canProceedToNext() || isAnimating) return

    setIsAnimating(true)
    
    // Save current step to store
    const nextStep = Math.min(currentStepIndex + 1, steps.length - 1)
    setStep(nextStep)
    
    // Save onboarding data
    try {
      await saveOnboardingData()
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
    }
    
    setTimeout(() => {
      setCurrentStepIndex(nextStep)
      setSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          completed: index <= currentStepIndex,
        })),
      )
      setIsAnimating(false)
    }, 300)
  }

  const handleBack = async () => {
    if (currentStepIndex === 0 || isAnimating) return

    setIsAnimating(true)
    
    // Save current step to store
    const prevStep = Math.max(currentStepIndex - 1, 0)
    setStep(prevStep)
    
    // Save onboarding data
    try {
      await saveOnboardingData()
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
    }
    
    setTimeout(() => {
      setCurrentStepIndex(prevStep)
      setIsAnimating(false)
    }, 300)
  }

  const canProceedToNext = () => {
    const currentStep = steps[currentStepIndex]
    if (!currentStep) return false

    switch (currentStep.id) {
      case 'products':
        return selectedProducts.length > 0
      case 'specifications':
        return productSpecifications.every((spec) => spec.quantity.trim() !== '' && spec.unit.trim() !== '')
      case 'location':
        return userLocation !== null
      case 'market':
        return true
      default:
        return true
    }
  }

  const renderStepContent = () => {
    const currentStep = steps[currentStepIndex]
    if (!currentStep) return null

    switch (currentStep.id) {
      case 'products':
        return <ProductSelectionBackend />
      case 'specifications':
        return (
          <ProductSpecifications
            selectedProducts={selectedProducts}
            specifications={productSpecifications}
            onSpecificationsChange={setProductSpecifications}
          />
        )
      case 'location':
        return (
          <LocationSelector 
            onLocationSelected={setUserLocation}
            currentLocation={userLocation}
          />
        )
      case 'market':
        return (
          <MarketOverviewWithPricing
            selectedProducts={selectedProducts}
            specifications={productSpecifications}
            userLocation={userLocation}
            onComplete={onComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 flex-row bg-gray-900 relative">
        {/* Fixed Progress Sidebar */}
        <ProgressSidebar
          steps={steps}
          currentStepIndex={currentStepIndex}
          progressLineHeight={progressLineHeight}
          isAnimating={isAnimating}
        />

        {/* Main Content */}
        <View className="flex-1 relative">
          <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 100 
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className="max-w-4xl self-center w-full">
              {renderStepContent()}
            </View>
          </ScrollView>

          {/* Fixed Navigation Bar */}
          <Navigation
            canGoBack={currentStepIndex > 0}
            canProceedToNext={canProceedToNext()}
            isAnimating={isAnimating}
            onBack={handleBack}
            onNext={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

// Placeholder for Location Selector component
const LocationSelector = ({ onLocationSelected, currentLocation }: any) => {
  // This will be implemented with Google Geocoding API
  return (
    <View className="flex-1 p-6 bg-gray-800 rounded-xl m-4">
      <Text className="text-white text-xl font-bold mb-4">Select Your Location</Text>
      <Text className="text-gray-400 mb-6">
        We'll show you pricing specific to your area
      </Text>
      {/* Location detection/selection UI here */}
    </View>
  )
}

// Enhanced Market Overview with regional pricing
const MarketOverviewWithPricing = ({ selectedProducts, specifications, userLocation, onComplete }: any) => {
  return (
    <MarketOverview
      selectedProducts={selectedProducts}
      specifications={specifications}
      onComplete={onComplete}
      userLocation={userLocation}
    />
  )
}