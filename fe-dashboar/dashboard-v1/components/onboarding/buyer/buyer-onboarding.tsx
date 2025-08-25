"use client"

import { useState, useEffect } from "react"
import { ProgressSidebar } from "../shared/progress-sidebar"
import { Navigation } from "../shared/navigation"
import { ProductSelection } from "../seller/product-selection"
import { BuyerSpecifications } from "./buyer-specifications"
import { BuyerMarketRequest } from "./buyer-market-request"
import { useOnboardingStore } from "@/stores/onboarding-store"
import type { OnboardingStep } from "../types"

const BUYER_STEPS: OnboardingStep[] = [
  {
    id: "products",
    title: "Products",
    description: "What to buy",
  },
  {
    id: "specifications",
    title: "Requirements",
    description: "Your needs",
  },
  {
    id: "market",
    title: "Request",
    description: "Create offer",
  },
]

export function BuyerOnboarding() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progressLineHeight, setProgressLineHeight] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const { selectedProducts } = useOnboardingStore()

  useEffect(() => {
    const stepHeight = 100 / BUYER_STEPS.length
    const newProgress = Math.min(((currentStepIndex + 1) / BUYER_STEPS.length) * 100, 100)
    setProgressLineHeight(newProgress - stepHeight / 2)
  }, [currentStepIndex])

  const handleNext = () => {
    if (currentStepIndex < BUYER_STEPS.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1)
        setIsAnimating(false)
      }, 300)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex - 1)
        setIsAnimating(false)
      }, 300)
    }
  }

  const canProceed = () => {
    if (currentStepIndex === 0) {
      return selectedProducts.length > 0
    }
    return true
  }

  const renderStepContent = () => {
    const className = `transition-all duration-300 ${
      isAnimating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
    }`

    switch (currentStepIndex) {
      case 0:
        return (
          <div className={className}>
            <ProductSelection />
          </div>
        )
      case 1:
        return (
          <div className={className}>
            <BuyerSpecifications />
          </div>
        )
      case 2:
        return (
          <div className={className}>
            <BuyerMarketRequest />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <h1 className="text-2xl font-bold text-white mb-2">Buyer Onboarding</h1>
              <p className="text-sm text-neutral-400 mb-8">
                Complete these steps to start buying on AgraTrade
              </p>
              <ProgressSidebar
                steps={BUYER_STEPS}
                currentStepIndex={currentStepIndex}
                progressLineHeight={progressLineHeight}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-8">
              {renderStepContent()}
              
              {currentStepIndex < 2 && (
                <Navigation
                  onBack={handleBack}
                  onNext={handleNext}
                  canGoBack={currentStepIndex > 0}
                  canGoNext={canProceed()}
                  nextLabel={currentStepIndex === BUYER_STEPS.length - 1 ? "Complete" : "Continue"}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}