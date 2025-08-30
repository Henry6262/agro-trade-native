import React, { useState, useEffect, useCallback } from 'react'
import { View, ScrollView, Text } from 'react-native'
import type { OnboardingStep, ProductSpecification } from '../../../types/onboarding'
import { simplifiedRoleSteps } from '../../../constants/simplifiedOnboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { ProductSelectionUnified } from '../ProductSelectionUnified' // Use unified product selection
import { BuyerSpecifications } from './BuyerSpecifications'
import { BuyerMarketRequest } from './BuyerMarketRequest'
import { SimplifiedLocationStep } from '../shared/SimplifiedLocationStep'
// Base management components moved to dashboard
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
    const buyerSteps = simplifiedRoleSteps.buyer.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex, // Mark previous steps as completed
    }))
    setSteps(buyerSteps)
    
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

  const handleNext = async () => {
    if (!canProceedToNext() || isAnimating) return

    setIsAnimating(true)
    
    // Save onboarding data to persist state
    try {
      await saveOnboardingData()
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
    }
    
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

  const handleBack = async () => {
    if (currentStepIndex === 0 || isAnimating) return // Can't go back before products step

    setIsAnimating(true)
    
    // Save onboarding data to persist state
    try {
      await saveOnboardingData()
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
    }
    
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
      case 'requirements':
        return productSpecifications.every((spec) => 
          spec.quantity && spec.quantity.toString().trim() !== '' && 
          spec.unit && spec.unit.toString().trim() !== '' &&
          spec.pricePerKilo && spec.pricePerKilo.toString().trim() !== ''
        )
      case 'location':
        // Location is optional for now
        return true
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
        return <ProductSelectionUnified />
      case 'requirements':
        return (
          <BuyerSpecifications
            selectedProducts={selectedProducts}
            specifications={productSpecifications}
            onSpecificationsChange={setProductSpecifications}
          />
        )
      case 'location':
        return <SimplifiedLocationStep />
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
  )
}