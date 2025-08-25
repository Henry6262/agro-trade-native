import React, { useState, useEffect } from 'react'
import { View, StatusBar } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { OnboardingStackParamList } from '../../../navigation/types'
import { BuyerOnboarding } from '../../../components/onboarding'
import { AuthModal } from '../../../components/onboarding/shared/AuthModal'
import { useOnboardingStore } from '../../../store/onboardingStore'

type BuyerOnboardingFlowScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'BuyerOnboardingFlow'
>

export function BuyerOnboardingFlowScreen() {
  const navigation = useNavigation<BuyerOnboardingFlowScreenNavigationProp>()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const onboardingStore = useOnboardingStore()

  useEffect(() => {
    // Set user role to buyer when entering this flow
    onboardingStore.setRole('buyer')
    
    // Save onboarding data when component mounts
    onboardingStore.saveOnboardingData().catch(console.error)
    
    // Check if we're returning from Google OAuth
    const googleAuthData = (onboardingStore as any).googleAuthData
    if (googleAuthData?.isAuthenticated) {
      console.log('Returning from Google OAuth, showing modal with pre-filled data')
      // Show the auth modal with the second step (business details)
      setShowAuthModal(true)
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
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <BuyerOnboarding onComplete={handleComplete} />
      
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onComplete={handleAuthComplete}
        userRole="buyer"
      />
    </View>
  )
}