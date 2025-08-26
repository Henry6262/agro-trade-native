import React from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
} from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'

interface NavigationProps {
  currentStepIndex: number
  totalSteps: number
  canProceedToNext: boolean
  isAnimating: boolean
  onBack: () => void
  onNext: () => void
}

export function Navigation({
  currentStepIndex,
  totalSteps,
  canProceedToNext,
  isAnimating,
  onBack,
  onNext,
}: NavigationProps) {
  const isBackDisabled = currentStepIndex === 0 || isAnimating
  const isNextDisabled = !canProceedToNext || currentStepIndex === totalSteps - 1 || isAnimating
  const { width } = Dimensions.get('window')
  const isMobile = width < 768

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999, // Maximum z-index to ensure always on top
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 12 : 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : isMobile ? 12 : 16, // Account for iOS safe area
      borderTopWidth: 1,
      borderTopColor: 'rgba(55, 65, 81, 0.8)',
      backgroundColor: 'rgba(17, 24, 39, 0.98)', // Slightly transparent to show it's floating
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 20 // Maximum elevation for Android
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%'
      }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            borderWidth: 1,
            borderColor: '#4B5563',
            borderRadius: isMobile ? 6 : 8,
            paddingHorizontal: isMobile ? 12 : 16,
            paddingVertical: isMobile ? 10 : 12,
            minWidth: isMobile ? 80 : 100,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 3,
            opacity: isBackDisabled ? 0.4 : 1
          }}
          onPress={onBack}
          disabled={isBackDisabled}
          activeOpacity={0.7}
        >
          <ChevronLeft size={isMobile ? 14 : 16} color="#9CA3AF" />
          <Text style={{ 
            color: '#9CA3AF', 
            fontWeight: '500', 
            marginLeft: isMobile ? 4 : 8,
            fontSize: isMobile ? 14 : 15
          }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: isMobile ? 6 : 8,
            paddingHorizontal: isMobile ? 16 : 24,
            paddingVertical: isMobile ? 10 : 12,
            minWidth: isMobile ? 80 : 100,
            shadowColor: isNextDisabled ? '#000' : '#22C55E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
            backgroundColor: isNextDisabled ? '#374151' : '#22C55E',
            opacity: isNextDisabled ? 0.4 : 1,
            transform: [{ scale: 1 }]
          }}
          onPress={onNext}
          disabled={isNextDisabled}
          activeOpacity={0.8}
        >
          <Text style={{ 
            color: 'white', 
            fontWeight: '600',
            fontSize: isMobile ? 14 : 15
          }}>Next</Text>
          <ChevronRight size={isMobile ? 14 : 16} color="white" style={{ marginLeft: isMobile ? 4 : 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  )
}