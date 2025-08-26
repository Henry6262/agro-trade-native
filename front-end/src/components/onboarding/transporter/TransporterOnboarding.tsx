import React, { useState, useEffect } from 'react'
import { View, ScrollView, SafeAreaView } from 'react-native'
import type { OnboardingStep } from '../../../types/onboarding'
import { roleSteps } from '../../../constants/onboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { FleetInformation } from './FleetInformation'
import { LocationInformation } from './LocationInformation'
import { TransporterListing } from './TransporterListing'
import { BaseManagementFlow } from '../base-management/BaseManagementUI'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface TransporterOnboardingProps {
  onComplete?: () => void
}

export function TransporterOnboarding({ onComplete }: TransporterOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0) // Start from fleet step (which is now first)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [progressLineHeight, setProgressLineHeight] = useState(0)

  const { transportData } = useOnboardingStore()

  useEffect(() => {
    const transporterSteps = roleSteps.transporter.map((step) => ({
      ...step,
      completed: false, // No steps completed initially
    }))
    setSteps(transporterSteps)
  }, [])

  useEffect(() => {
    // Calculate progress based on completed steps
    const completedSteps = currentStepIndex // Current step index starts from 0
    const totalSteps = steps.length - 1 // Total steps excluding the current one
    const progressPercentage = totalSteps > 0 ? Math.max(0, (completedSteps / totalSteps) * 100) : 0
    setProgressLineHeight(Math.min(progressPercentage, 100))
  }, [currentStepIndex, steps.length])

  const handleNext = () => {
    if (!canProceedToNext() || isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      if (currentStepIndex === steps.length - 1) {
        // Last step, complete onboarding
        onComplete?.()
      } else {
        setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
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
    if (currentStepIndex === 0 || isAnimating) return // Can't go back before fleet step

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
      case 'fleet':
        return transportData?.fleetInfo?.vehicleCount > 0
      case 'bases':
        // For now, allow proceeding without bases - user can add them later
        return true
      case 'location':
        // Allow proceeding without requiring location data
        return true
      case 'listing':
        return true
      default:
        return true
    }
  }

  const renderStepContent = () => {
    const currentStep = steps[currentStepIndex]
    if (!currentStep) return null

    switch (currentStep.id) {
      case 'fleet':
        return <FleetInformation />
      case 'bases':
        return <BaseManagementFlow />
      case 'location':
        return <LocationInformation />
      case 'listing':
        return <TransporterListing onComplete={onComplete} />
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
            className="flex-1" 
            contentContainerStyle={{ paddingBottom: 100 }}
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