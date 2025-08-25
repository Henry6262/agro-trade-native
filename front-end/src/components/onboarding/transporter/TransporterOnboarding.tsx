import React, { useState, useEffect } from 'react'
import { View, SafeAreaView, ScrollView } from 'react-native'
import type { OnboardingStep } from '../../../types/onboarding'
import { roleSteps } from '../../../constants/onboarding'
import { ProgressSidebar } from '../shared/ProgressSidebar'
import { Navigation } from '../shared/Navigation'
import { FleetInformation } from './FleetInformation'
import { LocationInformation } from './LocationInformation'
import { TransporterListing } from './TransporterListing'
import { useOnboardingStore } from '../../../stores/onboarding-store'

interface TransporterOnboardingProps {
  onComplete?: () => void
}

export function TransporterOnboarding({ onComplete }: TransporterOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(1) // Start from fleet step (role is already selected)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [progressLineHeight, setProgressLineHeight] = useState(0)

  const { transportData } = useOnboardingStore()

  useEffect(() => {
    const transporterSteps = roleSteps.transporter.map((step, index) => ({
      ...step,
      completed: index === 0, // First step (role) is already completed
    }))
    setSteps(transporterSteps)
  }, [])

  useEffect(() => {
    // Calculate progress based on completed steps
    const completedSteps = currentStepIndex - 1 // Current step index starts from 1, so subtract 1 for completed
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
    if (currentStepIndex === 1 || isAnimating) return // Can't go back before fleet step

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
      case 'fleet':
        return transportData?.fleetInfo.vehicleCount > 0
      case 'location':
        const location = transportData?.fleetInfo.baseLocation
        return location?.city && location?.state && location?.country
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
      case 'location':
        return <LocationInformation />
      case 'listing':
        return <TransporterListing onComplete={onComplete} />
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#111827' }}>
        <ProgressSidebar
          steps={steps}
          currentStepIndex={currentStepIndex}
          progressLineHeight={progressLineHeight}
          isAnimating={isAnimating}
        />

        <View style={{ flex: 1, position: 'relative' }}>
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
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