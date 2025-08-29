import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native'
import * as Location from 'expo-location'
import { Card } from '../../common/Card'
import { productService } from '../../../services/productService'

interface LocationPickerProps {
  currentLocation?: {
    latitude: number
    longitude: number
    address?: string
  } | null
  onLocationUpdate: (location: { latitude: number; longitude: number; address?: string }) => Promise<void>
  title?: string
  description?: string
  showPricingPreview?: boolean
}

interface PricingPreview {
  pricingZoneName: string
  currency: string
  productPrices: Array<{
    productName: string
    displayRange: string
  }>
}

export function LocationPicker({ 
  currentLocation, 
  onLocationUpdate, 
  title = "Set Your Location",
  description = "We need your location to show accurate pricing",
  showPricingPreview = false
}: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(null)
  const [locationText, setLocationText] = useState('')

  useEffect(() => {
    if (currentLocation?.address) {
      setLocationText(currentLocation.address)
    }
  }, [currentLocation])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need location permission to provide accurate pricing for your area.',
          [{ text: 'OK' }]
        )
        return false
      }
      return true
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    
    try {
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        setIsGettingLocation(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const { latitude, longitude } = location.coords

      // Get address from coordinates
      const addressResult = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })

      let address = 'Unknown location'
      if (addressResult && addressResult.length > 0) {
        const addr = addressResult[0]
        address = [
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean).join(', ')
      }

      setLocationText(address)
      await onLocationUpdate({ latitude, longitude, address })

      // Get pricing preview if enabled
      if (showPricingPreview) {
        await fetchPricingPreview(latitude, longitude)
      }

    } catch (error) {
      console.error('Location error:', error)
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please enter your address manually.',
        [{ text: 'OK' }]
      )
    }
    
    setIsGettingLocation(false)
  }

  const handleManualAddress = async () => {
    if (!manualAddress.trim()) {
      Alert.alert('Error', 'Please enter an address')
      return
    }

    setIsLoading(true)
    
    try {
      // Use the backend geocoding service
      const response = await fetch(`${productService.baseURL}/location/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: manualAddress,
        }),
      })

      const result = await response.json()

      if (!result.success || !result.data) {
        Alert.alert('Address Not Found', 'Could not find the entered address. Please try again.')
        setIsLoading(false)
        return
      }

      const { latitude, longitude, formattedAddress } = result.data
      setLocationText(formattedAddress)
      await onLocationUpdate({ latitude, longitude, address: formattedAddress })

      // Get pricing preview if enabled
      if (showPricingPreview) {
        await fetchPricingPreview(latitude, longitude)
      }

      setManualAddress('')
    } catch (error) {
      console.error('Geocoding error:', error)
      Alert.alert('Error', 'Unable to process the address. Please try again.')
    }
    
    setIsLoading(false)
  }

  const fetchPricingPreview = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`${productService.baseURL}/location/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setPricingPreview({
          pricingZoneName: result.data.pricingZoneName,
          currency: result.data.currency,
          productPrices: result.data.productPrices.slice(0, 5), // Show top 5 products
        })
      }
    } catch (error) {
      console.error('Failed to fetch pricing preview:', error)
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-900 p-6">
      <View className="max-w-2xl self-center w-full">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold mb-2">{title}</Text>
          <Text className="text-gray-400 text-lg">{description}</Text>
        </View>

        {/* Current Location Display */}
        {locationText && (
          <Card className="mb-6 p-4 bg-green-900/20 border-green-500/30">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-green-400 text-sm font-semibold">Current Location</Text>
                <Text className="text-white text-base">{locationText}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Location Actions */}
        <Card className="mb-6 p-6">
          <Text className="text-white text-xl font-semibold mb-4">Get Your Location</Text>
          
          {/* Auto-detect location */}
          <TouchableOpacity
            className={`bg-blue-600 rounded-xl p-4 mb-4 ${isGettingLocation ? 'opacity-50' : ''}`}
            onPress={getCurrentLocation}
            disabled={isGettingLocation}
          >
            <View className="flex-row items-center justify-center">
              {isGettingLocation ? (
                <ActivityIndicator color="white" className="mr-2" />
              ) : (
                <Text className="text-white text-lg mr-2">📍</Text>
              )}
              <Text className="text-white font-semibold text-lg">
                {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
              </Text>
            </View>
          </TouchableOpacity>

          <Text className="text-gray-400 text-center mb-4">or</Text>

          {/* Manual address input */}
          <View>
            <Text className="text-white text-base font-medium mb-2">Enter Address Manually</Text>
            <TextInput
              className="bg-gray-800 text-white rounded-lg p-4 mb-4 text-base"
              placeholder="Enter your city or address..."
              placeholderTextColor="#9CA3AF"
              value={manualAddress}
              onChangeText={setManualAddress}
              multiline={false}
            />
            <TouchableOpacity
              className={`bg-gray-700 rounded-xl p-4 ${isLoading || !manualAddress.trim() ? 'opacity-50' : ''}`}
              onPress={handleManualAddress}
              disabled={isLoading || !manualAddress.trim()}
            >
              <View className="flex-row items-center justify-center">
                {isLoading ? (
                  <ActivityIndicator color="white" className="mr-2" />
                ) : (
                  <Text className="text-white text-lg mr-2">🔍</Text>
                )}
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? 'Searching...' : 'Find Address'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Pricing Preview */}
        {showPricingPreview && pricingPreview && (
          <Card className="p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <View className="mb-4">
              <Text className="text-white text-xl font-semibold mb-1">💰 Pricing Preview</Text>
              <Text className="text-gray-300">Market: {pricingPreview.pricingZoneName}</Text>
            </View>

            <View className="space-y-3">
              {pricingPreview.productPrices.map((product, index) => (
                <View key={index} className="flex-row justify-between items-center">
                  <Text className="text-gray-300 text-base">{product.productName}</Text>
                  <Text className="text-white font-semibold">{product.displayRange}/ton</Text>
                </View>
              ))}
            </View>

            <Text className="text-xs text-gray-400 mt-4 text-center">
              Prices shown are market estimates and may vary
            </Text>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 p-4 bg-blue-900/20 border-blue-500/30">
          <Text className="text-blue-300 text-sm">
            <Text className="font-semibold">Privacy Note:</Text> Your location is used only to provide 
            accurate market pricing and is stored securely. You can change it anytime in your profile.
          </Text>
        </Card>
      </View>
    </ScrollView>
  )
}