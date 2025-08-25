"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { OnboardingStep, ProductSpecification } from "../types"
import { roleSteps } from "../constants"
import { ProgressSidebar } from "../shared/progress-sidebar"
import { Navigation } from "../shared/navigation"
import { ProductSelection } from "./product-selection"
import { ProductSpecifications } from "./product-specifications"
import { MarketOverview } from "./market-overview"

interface SellerOnboardingProps {
  onComplete?: () => void
}

export function SellerOnboarding({ onComplete }: SellerOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
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
    const completedSteps = currentStepIndex
    const totalSteps = steps.length - 1 // Subtract 1 because we start from 0
    const newHeight = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    setProgressLineHeight(Math.min(newHeight, 100))
  }, [currentStepIndex, steps.length])

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
    if (currentStepIndex === 0 || isAnimating) return

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
      case "products":
        return selectedProducts.length > 0
      case "specifications":
        return productSpecifications.every((spec) => spec.quantity.trim() !== "")
      case "market":
        return true
      default:
        return true
    }
  }

  const renderStepContent = () => {
    const currentStep = steps[currentStepIndex]
    if (!currentStep) return null

    switch (currentStep.id) {
      case "products":
        return <ProductSelection selectedProducts={selectedProducts} onProductsChange={setSelectedProducts} />
      case "specifications":
        return (
          <ProductSpecifications
            selectedProducts={selectedProducts}
            specifications={productSpecifications}
            onSpecificationsChange={setProductSpecifications}
          />
        )
      case "market":
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
    <div className="min-h-screen flex">
      <ProgressSidebar
        steps={steps}
        currentStepIndex={currentStepIndex}
        progressLineHeight={progressLineHeight}
        isAnimating={isAnimating}
      />

      <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-slate-50">
        <div className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-md lg:max-w-6xl xl:max-w-7xl mx-auto"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <Navigation
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          canProceedToNext={canProceedToNext()}
          isAnimating={isAnimating}
          onBack={handleBack}
          onNext={handleNext}
        />
      </div>
    </div>
  )
}
