import React from 'react'
import {
  View,
  TouchableOpacity,
  Text,
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

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000, // Increased z-index to ensure always visible
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(55, 65, 81, 0.5)',
      backgroundColor: '#111827', // Solid background to ensure visibility
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 10 // Increased elevation for better visibility on Android
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
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
            opacity: isBackDisabled ? 0.5 : 1
          }}
          onPress={onBack}
          disabled={isBackDisabled}
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color="#9CA3AF" />
          <Text style={{ color: '#9CA3AF', fontWeight: '500', marginLeft: 8 }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 8,
            paddingHorizontal: 24,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 6,
            backgroundColor: isNextDisabled ? '#374151' : '#22C55E',
            opacity: isNextDisabled ? 0.5 : 1
          }}
          onPress={onNext}
          disabled={isNextDisabled}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Next</Text>
          <ChevronRight size={16} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  )
}