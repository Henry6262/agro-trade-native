"use client"

import { useState, useEffect } from "react"
import { ProgressSidebar } from "../shared/progress-sidebar"
import { Navigation } from "../shared/navigation"
import { FleetInformation } from "./fleet-information"
import { LocationInformation } from "./location-information"
import { TransporterListing } from "./transporter-listing"
import { useOnboardingStore } from "@/stores/onboarding-store"
import type { OnboardingStep } from "../types"

const TRANSPORTER_STEPS: OnboardingStep[] = [
  {
    id: "fleet",
    title: "Fleet",
    description: "Your trucks",
    completed: false,
  },
  {
    id: "location",
    title: "Location",
    description: "Your base",
    completed: false,
  },
  {
    id: "listing",
    title: "Listing",
    description: "Create profile",
    completed: false,
  },
]

export function TransporterOnboarding() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progressLineHeight, setProgressLineHeight] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const { transporterFleet, transporterLocation } = useOnboardingStore()

  useEffect(() => {
    const newProgress = ((currentStepIndex + 1) / TRANSPORTER_STEPS.length) * 100
    setProgressLineHeight(newProgress)
  }, [currentStepIndex])

  const handleNext = () => {
    if (currentStepIndex < TRANSPORTER_STEPS.length - 1) {
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
    switch (currentStepIndex) {
      case 0:
        return transporterFleet.length > 0
      case 1:
        return transporterLocation.city && transporterLocation.state && transporterLocation.country
      default:
        return true
    }
  }

  const renderCurrentStep = () => {
    switch (currentStepIndex) {
      case 0:
        return <FleetInformation />
      case 1:
        return <LocationInformation />
      case 2:
        return <TransporterListing />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <ProgressSidebar
        steps={TRANSPORTER_STEPS}
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
          totalSteps={TRANSPORTER_STEPS.length}
          canProceedToNext={canProceed()}
          isAnimating={isAnimating}
          onBack={handleBack}
          onNext={handleNext}
        />
      </div>
    </div>
  )
}
