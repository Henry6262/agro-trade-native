import React, { useState, useEffect } from 'react'
import { View, ScrollView, SafeAreaView } from 'react-native'
import type { OnboardingStep, ProductSpecification } from '../../../types/onboarding'
import { roleSteps } from '../../../constants/onboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { ProductSelectionBackend } from '../ProductSelectionBackend'
import { ProductSpecifications } from './ProductSpecifications'
import { MarketOverview } from './MarketOverview'
import { BaseManagementFlow } from '../base-management/BaseManagementUI'
import { DraggableDistribution } from '../base-management/DraggableDistribution'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface SellerOnboardingProps {
  onComplete?: () => void
}

export function SellerOnboarding({ onComplete }: SellerOnboardingProps) {
  const { 
    selectedProducts, 
    setSelectedProducts,
    selectedProductsMetadata, 
    sellerSpecifications, 
    updateSellerSpecification,
    setSellerProducts,
    sellerData,
    currentStep,
    setStep
  } = useOnboardingStore()
  
  // Initialize with saved step or default to 0 (products step is now first)
  const [currentStepIndex, setCurrentStepIndex] = useState(currentStep >= 0 ? currentStep : 0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [productSpecifications, setProductSpecifications] = useState<ProductSpecification[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [progressLineHeight, setProgressLineHeight] = useState(0)

  useEffect(() => {
    const sellerSteps = roleSteps.seller.map((step, index) => ({
      ...step,
      completed: false, // No steps completed initially
    }))
    setSteps(sellerSteps)
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
    if (currentStepIndex === 0 || isAnimating) return // Can't go back before products step

    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
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
      case 'bases':
        // Allow proceeding without bases - user can add them later
        return true
      case 'distribution':
        // Check if all products are distributed
        const distributions = useOnboardingStore.getState().sellerData?.distributions || []
        return distributions.length > 0 && distributions.every(d => d.totalDistributed === d.totalQuantity)
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
      case 'bases':
        return <BaseManagementFlow />
      case 'distribution':
        const products = selectedProducts.map(productId => {
          const spec = productSpecifications.find(s => s.productId === productId)
          const metadata = selectedProductsMetadata.find(m => m.category === productId)
          return {
            id: productId,
            name: metadata?.name || productId,
            totalQuantity: parseFloat(spec?.quantity || '0'),
            unit: spec?.unit || 'tons',
            image: metadata?.image
          }
        })
        return (
          <View className="flex-1">
            {products.length > 0 && (
              <DraggableDistribution
                userType="seller"
                product={products[0]}
                onDistributionComplete={(dist) => {
                  console.log('Distribution complete:', dist);
                  // Save to store
                  useOnboardingStore.getState().setSellerDistributions?.([
                    { productId: products[0].id, distribution: dist }
                  ]);
                }}
              />
            )}
          </View>
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