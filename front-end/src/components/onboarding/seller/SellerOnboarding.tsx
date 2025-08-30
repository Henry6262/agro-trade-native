import React, { useState, useEffect } from 'react'
import { View, ScrollView, SafeAreaView, Text } from 'react-native'
import type { OnboardingStep, ProductSpecification } from '../../../types/onboarding'
import { simplifiedRoleSteps } from '../../../constants/simplifiedOnboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { ProductSelectionUnified } from '../ProductSelectionUnified'
import { ProductSpecificationsWithLocation } from './ProductSpecificationsWithLocation'
import { SimplifiedMarketOverview } from './SimplifiedMarketOverview'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface SellerOnboardingProps {
  onComplete?: () => void
}

export function SellerOnboarding({ onComplete }: SellerOnboardingProps) {
  const { 
    selectedProducts, 
    sellerSpecifications, 
    updateSellerSpecification,
    setSellerProducts,
    currentStep,
    setStep,
    saveOnboardingData
  } = useOnboardingStore()
  
  // Initialize with saved step or default to 0 (products step is now first)
  const [currentStepIndex, setCurrentStepIndex] = useState(currentStep >= 0 ? currentStep : 0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [productSpecifications, setProductSpecifications] = useState<ProductSpecification[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [progressLineHeight, setProgressLineHeight] = useState(0)

  useEffect(() => {
    const sellerSteps = simplifiedRoleSteps.seller.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex, // Mark previous steps as completed
    }))
    setSteps(sellerSteps)
    
    // Sync current step index with store on mount
    if (currentStep !== currentStepIndex) {
      setCurrentStepIndex(currentStep)
    }
  }, [])

  useEffect(() => {
    // Calculate progress based on completed steps
    const completedSteps = currentStepIndex // Current step index starts from 0
    const totalSteps = steps.length - 1 // Total steps excluding the current one
    const progressPercentage = totalSteps > 0 ? Math.max(0, (completedSteps / totalSteps) * 100) : 0
    setProgressLineHeight(Math.min(progressPercentage, 100))
  }, [currentStepIndex, steps.length])

  // Sync selectedProducts to sellerData.selectedProducts
  useEffect(() => {
    if (selectedProducts.length > 0) {
      // Import products data to get product names and categories
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
            currency: 'USD'
          } : undefined,
          qualitySpecs: specs.qualitySpecs || []
        }
      })
      
      setSellerProducts(productSelections)
    }
  }, [selectedProducts, sellerSpecifications, setSellerProducts])

  // Sync selectedProducts with specifications
  useEffect(() => {
    const newSpecs = selectedProducts.map(productId => {
      const existingSpec = productSpecifications.find(spec => spec.productId === productId)
      if (existingSpec) {
        return existingSpec
      }
      // Create new specification for newly selected product
      return {
        productId,
        quantity: '',
        unit: '',
        pricePerKilo: '',
        ...sellerSpecifications[productId]
      }
    })
    setProductSpecifications(newSpecs)
  }, [selectedProducts]) // Removed sellerSpecifications dependency to prevent loop

  // Update Zustand store when specifications change and save data
  useEffect(() => {
    productSpecifications.forEach(spec => {
      updateSellerSpecification(spec.productId, spec)
    })
    
    // Auto-save data when specifications change
    if (productSpecifications.length > 0) {
      const saveTimer = setTimeout(() => {
        saveOnboardingData().catch(console.error)
      }, 1000) // Debounce save by 1 second
      
      return () => clearTimeout(saveTimer)
    }
  }, [productSpecifications, updateSellerSpecification, saveOnboardingData]) // Added back dependencies

  const handleNext = async () => {
    if (!canProceedToNext() || isAnimating) return

    setIsAnimating(true)
    
    // Save current step to store
    const nextStep = Math.min(currentStepIndex + 1, steps.length - 1)
    setStep(nextStep)
    
    // Save onboarding data to persist state
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
    if (currentStepIndex === 0 || isAnimating) return // Can't go back before products step

    setIsAnimating(true)
    
    // Save current step to store
    const prevStep = Math.max(currentStepIndex - 1, 0)
    setStep(prevStep)
    
    // Save onboarding data to persist state
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
      case 'details-location':
        // Check if all products have quantities and location in the store
        const store = useOnboardingStore.getState()
        const hasLocation = store.userLocation !== null
        const hasQuantities = selectedProducts.every(productId => {
          const spec = store.sellerSpecifications[productId]
          return spec && spec.quantity && parseFloat(spec.quantity) > 0
        })
        return hasLocation && hasQuantities
      case 'overview':
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
        return <ProductSelectionUnified />
      case 'details-location':
        return <ProductSpecificationsWithLocation />
      case 'overview':
        return (
          <SimplifiedMarketOverview
            selectedProducts={selectedProducts}
            specifications={productSpecifications}
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
          {renderStepContent()}

          <Navigation
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
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