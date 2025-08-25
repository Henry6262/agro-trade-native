import React, { useEffect, useState } from 'react'
import {
  View,
  SafeAreaView,
} from 'react-native'
import type { StackScreenProps } from '@react-navigation/stack'
import { SellerOnboarding } from '../../../components/onboarding/seller/SellerOnboarding'
import { useOnboardingStore } from '../../../store/onboardingStore'
import type { OnboardingStackParamList } from '../../../navigation/types'
import { AuthModal } from '../../../components/onboarding/shared/AuthModal'

type Props = StackScreenProps<OnboardingStackParamList, 'SellerOnboardingFlow'>

export function SellerOnboardingFlowScreen({ navigation, route }: Props) {
  const onboardingStore = useOnboardingStore()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Set user role to seller when entering this flow
    onboardingStore.setRole('seller')
    
    // Save onboarding data when component mounts
    onboardingStore.saveOnboardingData().catch(console.error)
    
    // Check if we're returning from Google OAuth
    const googleAuthData = (onboardingStore as any).googleAuthData
    if (googleAuthData?.isAuthenticated) {
      console.log('Returning from Google OAuth, showing modal with pre-filled data')
      // Show the auth modal with the second step (business details)
      setShowAuthModal(true)
    }
    
    // Reset store if needed (optional, depending on your requirements)
    return () => {
      // onboardingStore.resetOnboarding() // Uncomment if you want to reset on exit
    }
  }, [])

  const handleComplete = async () => {
    try {
      // Save current onboarding data before showing auth modal
      await onboardingStore.saveOnboardingData()
      // Show authentication modal instead of directly navigating
      setShowAuthModal(true)
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      // Still show auth modal even if save fails
      setShowAuthModal(true)
    }
  }

  const handleAuthComplete = () => {
    setShowAuthModal(false)
    navigation.navigate('OnboardingComplete')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SellerOnboarding onComplete={handleComplete} />
      
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onComplete={handleAuthComplete}
        userRole="seller"
      />
    </SafeAreaView>
  )
}