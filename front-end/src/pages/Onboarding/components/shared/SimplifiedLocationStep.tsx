import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { API_URL } from '@shared/constants'
import { useOnboardingStore } from '@stores/onboarding.store'

interface SimplifiedLocationStepProps {
  onLocationSet?: (location: { latitude: number; longitude: number; city?: string; country?: string }) => void
}

export function SimplifiedLocationStep({ onLocationSet }: SimplifiedLocationStepProps) {
  const { updateLocation } = useOnboardingStore()
  const [loading, setLoading] = useState(false)
  const [locationText, setLocationText] = useState('')
  const [detectedLocation, setDetectedLocation] = useState<any>(null)
  const [manualInput, setManualInput] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  const requestLocationPermission = async () => {
    try {
      setLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'We need location access to show you pricing specific to your area. You can also enter your location manually.',
          [
            { text: 'Enter Manually', onPress: () => setManualInput(true) },
            { text: 'Try Again', onPress: requestLocationPermission },
          ]
        )
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      
      // Reverse geocode to get city and country
      try {
        const response = await axios.post(`${API_URL}/location/reverse-geocode`, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
        
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: response.data.city,
          country: response.data.country,
        }
        
        setDetectedLocation(locationData)
        setLocationText(`${response.data.city}, ${response.data.country}`)
        updateLocation(locationData)
        onLocationSet?.(locationData)
      } catch (error) {
        console.error('Reverse geocoding failed:', error)
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
        setDetectedLocation(locationData)
        updateLocation(locationData)
        onLocationSet?.(locationData)
      }
    } catch (error) {
      console.error('Location detection failed:', error)
      Alert.alert(
        'Location Error',
        'Unable to detect your location. Please enter it manually.',
        [{ text: 'OK', onPress: () => setManualInput(true) }]
      )
    } finally {
      setLoading(false)
    }
  }

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await axios.get(`${API_URL}/location/cities/search`, {
        params: { q: query },
      })
      setSearchResults(response.data.data || [])
    } catch (error) {
      console.error('City search failed:', error)
    }
  }

  const selectCity = async (city: any) => {
    const locationData = {
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
      country: city.country,
    }
    
    setDetectedLocation(locationData)
    setLocationText(`${city.name}, ${city.country}`)
    setSearchResults([])
    updateLocation(locationData)
    onLocationSet?.(locationData)
  }

  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestLocationPermission()
    } else {
      setManualInput(true)
    }
  }, [])

  return (
    <View className="flex-1 p-6 bg-gray-800 rounded-xl m-4">
      <View className="mb-6">
        <Text className="text-white text-2xl font-bold mb-2">Your Location</Text>
        <Text className="text-gray-400">
          We'll show you pricing and opportunities specific to your area
        </Text>
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-400 mt-4">Detecting your location...</Text>
        </View>
      ) : (
        <View>
          {!manualInput && detectedLocation ? (
            <View className="bg-gray-700 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="location" size={24} color="#10B981" />
                <Text className="text-green-400 ml-2 font-medium">Location Detected</Text>
              </View>
              <Text className="text-white text-lg mb-1">{locationText}</Text>
              <Text className="text-gray-400 text-sm mb-4">
                Coordinates: {detectedLocation.latitude.toFixed(4)}, {detectedLocation.longitude.toFixed(4)}
              </Text>
              <TouchableOpacity
                onPress={() => setManualInput(true)}
                className="py-2"
              >
                <Text className="text-blue-400">Change location manually</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  onPress={requestLocationPermission}
                  className="bg-blue-600 rounded-lg p-4 flex-row items-center justify-center mb-4"
                >
                  <Ionicons name="location" size={20} color="white" />
                  <Text className="text-white font-medium ml-2">Detect My Location</Text>
                </TouchableOpacity>
              )}

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Or enter your city:</Text>
                <TextInput
                  className="bg-gray-700 text-white rounded-lg px-4 py-3"
                  placeholder="e.g., Sofia, Bulgaria"
                  placeholderTextColor="#6B7280"
                  value={locationText}
                  onChangeText={(text) => {
                    setLocationText(text)
                    searchCities(text)
                  }}
                />
              </View>

              {searchResults.length > 0 && (
                <View className="bg-gray-700 rounded-lg max-h-48">
                  {searchResults.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      onPress={() => selectCity(city)}
                      className="p-3 border-b border-gray-600"
                    >
                      <View className="flex-row items-center">
                        <Text className="text-lg mr-2">{city.flagEmoji}</Text>
                        <View className="flex-1">
                          <Text className="text-white">{city.name}</Text>
                          <Text className="text-gray-400 text-sm">
                            {city.region}, {city.country}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <View className="mt-8 bg-gray-700 rounded-lg p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#60A5FA" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-400 font-medium mb-1">Why we need your location</Text>
                <Text className="text-gray-400 text-sm">
                  • Show you local market prices
                  {"\n"}• Connect you with nearby traders
                  {"\n"}• Calculate accurate shipping costs
                  {"\n"}• Display relevant opportunities in your area
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}