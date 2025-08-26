import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView } from 'react-native'
import type { OnboardingStep, ProductSpecification } from '../../../types/onboarding'
import { roleSteps } from '../../../constants/onboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { ProductSelectionBackend } from '../ProductSelectionBackend' // Use simplified backend-integrated product selection
import { BuyerSpecifications } from './BuyerSpecifications'
import { BuyerMarketRequest } from './BuyerMarketRequest'
import { BaseManagementFlow } from '../base-management/BaseManagementUI'
import { MultiProductDistribution } from '../base-management/MultiProductDistribution'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface BuyerOnboardingProps {
  onComplete?: () => void
}

export function BuyerOnboarding({ onComplete }: BuyerOnboardingProps) {
  const { 
    selectedProducts, 
    setSelectedProducts,
    selectedProductsMetadata, 
    buyerSpecifications, 
    updateBuyerSpecification,
    setBuyerRequirements,
    buyerData,
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
    const buyerSteps = roleSteps.buyer.map((step) => ({
      ...step,
      completed: false, // No steps completed initially
    }))
    setSteps(buyerSteps)
  }, [])

  useEffect(() => {
    // Calculate progress based on completed steps
    const completedSteps = currentStepIndex // Current step index starts from 0
    const totalSteps = steps.length - 1 // Total steps excluding the current one
    const progressPercentage = totalSteps > 0 ? Math.max(0, (completedSteps / totalSteps) * 100) : 0
    setProgressLineHeight(Math.min(progressPercentage, 100))
  }, [currentStepIndex, steps.length])

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
        ...buyerSpecifications[productId]
      }
    })
    
    // Only update if there's a meaningful difference
    const hasChanges = newSpecs.length !== productSpecifications.length || 
      newSpecs.some((spec, index) => 
        !productSpecifications[index] || 
        spec.productId !== productSpecifications[index].productId
      )
    
    if (hasChanges) {
      setProductSpecifications(newSpecs)
    }
  }, [selectedProducts, buyerSpecifications, productSpecifications])

  // Sync selectedProducts to buyerData.requiredProducts
  useEffect(() => {
    if (selectedProducts.length > 0) {
      // Import products data to get product names and categories
      const { products } = require('../../../constants/onboarding')
      
      const requirements = selectedProducts.map(productId => {
        const product = products.find((p: any) => p.id === productId)
        const specs = buyerSpecifications[productId] || {}
        
        return {
          productId,
          productName: product?.name || 'Unknown Product',
          category: product?.category || 'Other',
          quantity: {
            amount: specs.quantity || 0,
            unit: specs.unit || 'tons' as const
          },
          maxPrice: specs.pricePerKilo ? parseFloat(specs.pricePerKilo) : undefined,
          qualityRequirements: specs.qualityRequirements || [],
          deliveryDeadline: specs.deliveryDeadline
        }
      })
      
      setBuyerRequirements(requirements)
    }
  }, [selectedProducts, buyerSpecifications, setBuyerRequirements])

  // Update Zustand store when specifications change - use callback to prevent circular updates
  const updateStoreSpecs = useCallback(() => {
    productSpecifications.forEach(spec => {
      const currentStoreSpec = buyerSpecifications[spec.productId]
      const hasStoreChanges = !currentStoreSpec || 
        Object.keys(spec).some(key => spec[key] !== currentStoreSpec[key])
      
      if (hasStoreChanges) {
        updateBuyerSpecification(spec.productId, spec)
      }
    })
  }, [productSpecifications, buyerSpecifications, updateBuyerSpecification])

  useEffect(() => {
    if (productSpecifications.length > 0) {
      updateStoreSpecs()
    }
  }, [updateStoreSpecs])

  const handleNext = () => {
    if (!canProceedToNext() || isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      if (currentStepIndex === steps.length - 1) {
        // Last step, complete onboarding
        onComplete?.()
      } else {
        const nextStep = Math.min(currentStepIndex + 1, steps.length - 1)
        setCurrentStepIndex(nextStep)
        setStep(nextStep) // Save to store
        setSteps((prev) =>
          prev.map((step, index) => ({
            ...step,
            completed: index <= currentStepIndex,
          })),
        )
      }
      setIsAnimating(false)
    }, 300)
  }

  const handleBack = () => {
    if (currentStepIndex === 0 || isAnimating) return // Can't go back before products step

    setIsAnimating(true)
    setTimeout(() => {
      const prevStep = Math.max(currentStepIndex - 1, 0)
      setCurrentStepIndex(prevStep)
      setStep(prevStep) // Save to store
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
        return productSpecifications.every((spec) => 
          spec.quantity && spec.quantity.toString().trim() !== '' && 
          spec.unit && spec.unit.toString().trim() !== '' &&
          spec.pricePerKilo && spec.pricePerKilo.toString().trim() !== ''
        )
      case 'bases':
        // Allow proceeding without bases - user can add them later
        return true
      case 'distribution':
        // Check if all products are distributed
        const distributions = useOnboardingStore.getState().buyerData?.distributions || []
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
          <BuyerSpecifications
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
        }).filter(p => p.totalQuantity > 0) // Only include products with quantity
        
        return (
          <View className="flex-1">
            {products.length > 0 ? (
              <MultiProductDistribution
                userType="buyer"
                products={products}
                onComplete={(distributions) => {
                  console.log('All distributions complete:', distributions);
                  // Save to store
                  useOnboardingStore.getState().setBuyerDistributions(distributions);
                }}
              />
            ) : (
              <View className="flex-1 bg-gray-900 p-4">
                <View className="bg-gray-800 rounded-xl p-6 items-center">
                  <Text className="text-white text-lg font-bold">No Products to Distribute</Text>
                  <Text className="text-gray-400 text-sm text-center mt-2">
                    Please add product quantities in the specifications step
                  </Text>
                </View>
              </View>
            )}
          </View>
        )
      case 'market':
        return (
          <BuyerMarketRequest
            selectedProducts={selectedProducts}
            specifications={productSpecifications}
            onSpecificationsChange={setProductSpecifications}
            onComplete={onComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <View className="flex-1 flex-row bg-gray-900">
      {/* Fixed Progress Sidebar */}
      <ProgressSidebar
        steps={steps}
        currentStepIndex={currentStepIndex}
        progressLineHeight={progressLineHeight}
        isAnimating={isAnimating}
      />

      {/* Main Content */}
      <View className="flex-1">
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: 100 
          }}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
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
  )
}