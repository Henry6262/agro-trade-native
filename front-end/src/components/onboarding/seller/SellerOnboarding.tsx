import React, { useState, useEffect } from 'react'
import { View, ScrollView, SafeAreaView } from 'react-native'
import type { OnboardingStep, ProductSpecification } from '../../../types/onboarding'
import { roleSteps } from '../../../constants/onboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { ProductSelectionBackend } from '../ProductSelectionBackend'
import { ProductSpecifications } from './ProductSpecifications'
import { MarketOverview } from './MarketOverview'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface SellerOnboardingProps {
  onComplete?: () => void
}

export function SellerOnboarding({ onComplete }: SellerOnboardingProps) {
  const { 
    selectedProducts, 
    setSelectedProducts, 
    sellerSpecifications, 
    updateSellerSpecification,
    setSellerProducts,
    sellerData,
    currentStep,
    setStep
  } = useOnboardingStore()
  
  // Initialize with saved step or default to 1 (products step)
  const [currentStepIndex, setCurrentStepIndex] = useState(currentStep > 0 ? currentStep : 1)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [productSpecifications, setProductSpecifications] = useState<ProductSpecification[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [progressLineHeight, setProgressLineHeight] = useState(0)

  useEffect(() => {
    const sellerSteps = roleSteps.seller.map((step, index) => ({
      ...step,
      completed: index === 0, // First step (role) is already completed
    }))
    setSteps(sellerSteps)
  }, [])

  useEffect(() => {
    // Calculate progress based on completed steps
    const completedSteps = currentStepIndex - 1 // Current step index starts from 1, so subtract 1 for completed
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

  // Update Zustand store when specifications change
  useEffect(() => {
    productSpecifications.forEach(spec => {
      updateSellerSpecification(spec.productId, spec)
    })
  }, [productSpecifications]) // Removed updateSellerSpecification dependency since it's stable

  const handleNext = () => {
    if (!canProceedToNext() || isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
      setSteps((prev) =>
        prev.map((step, index) => ({
          ...step,
          completed: index <= currentStepIndex,
        })),
      )
      setIsAnimating(false)
    }, 300)
  }

  const handleBack = () => {
    if (currentStepIndex === 1 || isAnimating) return // Can't go back before products step

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.max(prev - 1, 1))
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
      case 'market':
        return (
          <MarketOverview
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#111827', position: 'relative' }}>
        {/* Fixed Progress Sidebar */}
        <ProgressSidebar
          steps={steps}
          currentStepIndex={currentStepIndex}
          progressLineHeight={progressLineHeight}
          isAnimating={isAnimating}
        />

        {/* Main Content */}
        <View style={{ flex: 1, position: 'relative' }}>
          <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1,
              padding: 24, 
              paddingBottom: 100 
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>
              {renderStepContent()}
            </View>
          </ScrollView>

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