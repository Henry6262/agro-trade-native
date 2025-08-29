import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native'
import { Card } from '../../common/Card'
import { useOnboardingStore } from '../../../store/onboardingStore'

interface OnboardingCompleteProps {
  role: 'seller' | 'buyer' | 'transporter'
  selectedProducts?: string[]
  onComplete?: () => void
}

export function OnboardingComplete({ role, selectedProducts = [], onComplete }: OnboardingCompleteProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const { 
    sellerSpecifications, 
    buyerRequirements,
    userLocation,
    saveOnboardingData,
    clearOnboardingData
  } = useOnboardingStore()

  const getRoleEmoji = () => {
    switch (role) {
      case 'seller': return '🌾'
      case 'buyer': return '🏢'
      case 'transporter': return '🚛'
      default: return '✅'
    }
  }

  const getRoleTitle = () => {
    switch (role) {
      case 'seller': return 'Ready to Sell!'
      case 'buyer': return 'Ready to Buy!'
      case 'transporter': return 'Ready to Transport!'
      default: return 'Setup Complete!'
    }
  }

  const getRoleDescription = () => {
    switch (role) {
      case 'seller': return "You're all set to list your products and connect with buyers."
      case 'buyer': return "You're all set to browse products and connect with sellers."
      case 'transporter': return "You're all set to find transport opportunities."
      default: return "Your profile is complete and ready to use."
    }
  }

  const getSummaryData = () => {
    if (role === 'seller') {
      const products = selectedProducts.length
      const specifications = Object.keys(sellerSpecifications).length
      return [
        { label: 'Products Selected', value: products.toString() },
        { label: 'Specifications Added', value: specifications.toString() },
        { label: 'Location Set', value: userLocation ? 'Yes' : 'No' },
      ]
    } else if (role === 'buyer') {
      const requirements = Object.keys(buyerRequirements).length
      return [
        { label: 'Requirements Set', value: requirements.toString() },
        { label: 'Location Set', value: userLocation ? 'Yes' : 'No' },
      ]
    }
    return []
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    
    try {
      // Save final onboarding data
      await saveOnboardingData()
      
      // Mark onboarding as complete in your backend
      // This would typically call an API endpoint to update user status
      
      // Clear the onboarding state
      clearOnboardingData()
      
      // Navigate to dashboard
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
    
    setIsCompleting(false)
  }

  return (
    <ScrollView className="flex-1 bg-gray-900 p-6">
      <View className="max-w-2xl self-center w-full">
        {/* Success Header */}
        <View className="items-center mb-8">
          <Text className="text-6xl mb-4">{getRoleEmoji()}</Text>
          <Text className="text-white text-4xl font-bold text-center mb-2">
            {getRoleTitle()}
          </Text>
          <Text className="text-gray-300 text-lg text-center">
            {getRoleDescription()}
          </Text>
        </View>

        {/* Summary Card */}
        <Card className="mb-6 p-6">
          <Text className="text-white text-xl font-semibold mb-4">Setup Summary</Text>
          
          {getSummaryData().map((item, index) => (
            <View key={index} className="flex-row justify-between items-center py-2">
              <Text className="text-gray-300 text-base">{item.label}</Text>
              <Text className="text-white font-semibold">{item.value}</Text>
            </View>
          ))}

          {userLocation && (
            <View className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <Text className="text-green-400 text-sm font-semibold mb-1">📍 Your Location</Text>
              <Text className="text-gray-300">{userLocation.address}</Text>
            </View>
          )}
        </Card>

        {/* Next Steps */}
        <Card className="mb-6 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <Text className="text-white text-xl font-semibold mb-4">What's Next?</Text>
          
          {role === 'seller' && (
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Text className="text-blue-400 text-lg mr-3">📝</Text>
                <View className="flex-1">
                  <Text className="text-white font-medium">Create Product Listings</Text>
                  <Text className="text-gray-400 text-sm">List your products with detailed specifications</Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Text className="text-blue-400 text-lg mr-3">🏪</Text>
                <View className="flex-1">
                  <Text className="text-white font-medium">Manage Your Bases</Text>
                  <Text className="text-gray-400 text-sm">Add warehouses and storage locations</Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Text className="text-blue-400 text-lg mr-3">📊</Text>
                <View className="flex-1">
                  <Text className="text-white font-medium">Track Performance</Text>
                  <Text className="text-gray-400 text-sm">Monitor your sales and market insights</Text>
                </View>
              </View>
            </View>
          )}

          {role === 'buyer' && (
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Text className="text-blue-400 text-lg mr-3">🔍</Text>
                <View className="flex-1">
                  <Text className="text-white font-medium">Browse Products</Text>
                  <Text className="text-gray-400 text-sm">Find products that match your requirements</Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Text className="text-blue-400 text-lg mr-3">🏢</Text>
                <View className="flex-1">
                  <Text className="text-white font-medium">Manage Your Bases</Text>
                  <Text className="text-gray-400 text-sm">Add procurement offices and facilities</Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <Text className="text-blue-400 text-lg mr-3">📈</Text>
                <View className="flex-1">
                  <Text className="text-white font-medium">Market Analytics</Text>
                  <Text className="text-gray-400 text-sm">Access market trends and pricing data</Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Complete Button */}
        <TouchableOpacity
          className={`bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 shadow-lg ${isCompleting ? 'opacity-50' : ''}`}
          onPress={handleComplete}
          disabled={isCompleting}
        >
          <View className="flex-row items-center justify-center">
            {isCompleting ? (
              <ActivityIndicator color="white" className="mr-3" />
            ) : (
              <Text className="text-white text-2xl mr-3">🚀</Text>
            )}
            <Text className="text-white text-xl font-bold">
              {isCompleting ? 'Setting up...' : 'Go to Dashboard'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Support Info */}
        <Card className="mt-6 p-4 bg-gray-800/50">
          <Text className="text-gray-300 text-sm text-center">
            Need help getting started? Contact our support team or check out our getting started guide.
          </Text>
        </Card>
      </View>
    </ScrollView>
  )
}