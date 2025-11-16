import React, { useState, useEffect } from 'react'
import { View, ScrollView, SafeAreaView, Text } from 'react-native'
import type { OnboardingStep } from '@shared/types/onboarding'
import { simplifiedRoleSteps } from '@shared/constants/simplifiedOnboarding'
import { ProgressSidebar } from '@pages/Onboarding/components/shared/ProgressSidebar'
import { Navigation } from '@pages/Onboarding/components/shared/Navigation'
import { FleetInformation } from '@pages/Onboarding/sections/Transporter/features/Fleet/components/FleetInformation'
import { LocationInformation } from '@pages/Onboarding/sections/Transporter/features/Location/components/LocationInformation'
import { TransporterListing } from '@pages/Onboarding/sections/Transporter/features/Listing/components/TransporterListing'
// Base management moved to dashboard
import { useOnboardingStore } from '@stores/onboarding.store'

interface TransporterOnboardingProps {
  onComplete?: () => void
}

export function TransporterOnboarding({ onComplete }: TransporterOnboardingProps) {
  const { transportData, currentStep, setStep, saveOnboardingData } = useOnboardingStore()
  
  const [currentStepIndex, setCurrentStepIndex] = useState(currentStep >= 0 ? currentStep : 0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [progressLineHeight, setProgressLineHeight] = useState(0)

  useEffect(() => {
    const transporterSteps = simplifiedRoleSteps.transporter.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex, // Mark previous steps as completed
    }))
    setSteps(transporterSteps)
    
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
    if (currentStepIndex === 0 || isAnimating) return // Can't go back before fleet step

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
      case 'fleet':
        return transportData?.fleetInfo?.vehicleCount > 0
      case 'coverage':
        // Allow proceeding without requiring coverage data for now
        return true
      case 'preferences':
        // Allow proceeding without preferences for now
        return true
      case 'overview':
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
      case 'coverage':
        return <LocationInformation />
      case 'preferences':
        // Job preferences component
        return (
          <View className="flex-1 p-6 bg-gray-800 rounded-xl m-4">
            <Text className="text-white text-xl font-bold mb-4">Job Preferences</Text>
            <Text className="text-gray-400 mb-6">
              Select your preferred cargo types and routes
            </Text>
          </View>
        )
      case 'overview':
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
