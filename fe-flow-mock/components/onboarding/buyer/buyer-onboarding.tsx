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
    const newProgress = ((currentStepIndex + 1) / BUYER_STEPS.length) * 100
    setProgressLineHeight(newProgress)
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
    console.log("[v0] canProceed check - currentStepIndex:", currentStepIndex, "selectedProducts:", selectedProducts)
    switch (currentStepIndex) {
      case 0:
        const canProceedStep0 = selectedProducts.length > 0
        console.log("[v0] canProceed step 0 result:", canProceedStep0)
        return canProceedStep0
      case 1:
        return selectedProducts.length > 0
      default:
        return true
    }
  }

  const renderCurrentStep = () => {
    switch (currentStepIndex) {
      case 0:
        return <ProductSelection />
      case 1:
        return <BuyerSpecifications />
      case 2:
        return <BuyerMarketRequest />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <ProgressSidebar
        steps={BUYER_STEPS}
        currentStepIndex={currentStepIndex}
        progressLineHeight={progressLineHeight}
        isAnimating={isAnimating}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-4xl mx-auto p-6 lg:p-8">{renderCurrentStep()}</div>
        </div>

        <Navigation
          currentStepIndex={currentStepIndex}
          totalSteps={BUYER_STEPS.length}
          canProceedToNext={canProceed()}
          isAnimating={isAnimating}
          onBack={handleBack}
          onNext={handleNext}
        />
      </div>
    </div>
  )
}
