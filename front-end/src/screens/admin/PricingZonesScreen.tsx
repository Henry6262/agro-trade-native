import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { API_URL } from '../../config/api'
import { useAuthStore } from '../../store/authStore'

interface PricingZone {
  id: string
  name: string
  description: string | null
  color: string | null
  isActive: boolean
  marketSize: string | null
  transportAccess: string | null
  storageCapacity: string | null
  _count: {
    cities: number
    productPrices: number
  }
  cities: Array<{
    city: {
      id: string
      name: string
      region: {
        name: string
        country: {
          name: string
          flagEmoji: string
        }
      }
    }
  }>
}

export default function PricingZonesScreen() {
  const navigation = useNavigation()
  const { token } = useAuthStore()
  const [zones, setZones] = useState<PricingZone[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    marketSize: '',
    transportAccess: '',
    storageCapacity: '',
  })

  useEffect(() => {
    fetchPricingZones()
  }, [])

  const fetchPricingZones = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/admin/pricing-zones`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setZones(response.data.data)
    } catch (error) {
      console.error('Failed to fetch pricing zones:', error)
      Alert.alert('Error', 'Failed to load pricing zones')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateZone = async () => {
    if (!newZone.name) {
      Alert.alert('Error', 'Zone name is required')
      return
    }

    try {
      const response = await axios.post(
        `${API_URL}/admin/pricing-zones`,
        newZone,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setZones([...zones, response.data.data])
      setShowAddModal(false)
      setNewZone({
        name: '',
        description: '',
        color: '#3B82F6',
        marketSize: '',
        transportAccess: '',
        storageCapacity: '',
      })
      Alert.alert('Success', 'Pricing zone created successfully')
    } catch (error) {
      console.error('Failed to create zone:', error)
      Alert.alert('Error', 'Failed to create pricing zone')
    }
  }

  const handleDeleteZone = async (zoneId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this pricing zone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/admin/pricing-zones/${zoneId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              setZones(zones.filter((z) => z.id !== zoneId))
              Alert.alert('Success', 'Pricing zone deleted successfully')
            } catch (error: any) {
              console.error('Failed to delete zone:', error)
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete pricing zone'
              )
            }
          },
        },
      ]
    )
  }

  const filteredZones = zones.filter(
    (zone) =>
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-4">Loading pricing zones...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 border-b border-gray-800">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white flex-1">Pricing Zones</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Add Zone</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="bg-gray-800 rounded-lg px-4 py-2 flex-row items-center">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 text-white ml-3"
            placeholder="Search zones..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Zones List */}
      <ScrollView className="flex-1 px-6 py-4">
        {filteredZones.map((zone) => (
          <TouchableOpacity
            key={zone.id}
            onPress={() => {
              setSelectedZone(zone.id)
              navigation.navigate('AdminZoneDetails' as any, { zoneId: zone.id })
            }}
            className={`bg-gray-800 rounded-xl p-4 mb-4 border ${
              selectedZone === zone.id ? 'border-blue-500' : 'border-gray-700'
            }`}
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: zone.color || '#3B82F6' }}
                  />
                  <Text className="text-white font-semibold text-lg">{zone.name}</Text>
                </View>
                {zone.description && (
                  <Text className="text-gray-400 text-sm mt-1">{zone.description}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteZone(zone.id)}
                className="ml-2 p-2"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Zone Info */}
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Cities</Text>
                <Text className="text-white text-sm">{zone._count.cities}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Product Prices</Text>
                <Text className="text-white text-sm">{zone._count.productPrices}</Text>
              </View>
              {zone.marketSize && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 text-sm">Market Size</Text>
                  <Text className="text-white text-sm">{zone.marketSize}</Text>
                </View>
              )}
            </View>

            {/* Cities Preview */}
            {zone.cities.length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-700">
                <Text className="text-gray-400 text-xs mb-2">Cities in this zone:</Text>
                <View className="flex-row flex-wrap">
                  {zone.cities.slice(0, 3).map((cityZone, index) => (
                    <View
                      key={index}
                      className="bg-gray-700 rounded-md px-2 py-1 mr-2 mb-1"
                    >
                      <Text className="text-white text-xs">
                        {cityZone.city.region.country.flagEmoji} {cityZone.city.name}
                      </Text>
                    </View>
                  ))}
                  {zone.cities.length > 3 && (
                    <View className="bg-gray-700 rounded-md px-2 py-1">
                      <Text className="text-gray-400 text-xs">
                        +{zone.cities.length - 3} more
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Zone Modal */}
      {showAddModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center p-6">
          <View className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <Text className="text-white text-xl font-bold mb-4">Create New Zone</Text>
            
            <TextInput
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
              placeholder="Zone name"
              placeholderTextColor="#6B7280"
              value={newZone.name}
              onChangeText={(text) => setNewZone({ ...newZone, name: text })}
            />
            
            <TextInput
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
              placeholder="Description"
              placeholderTextColor="#6B7280"
              value={newZone.description}
              onChangeText={(text) => setNewZone({ ...newZone, description: text })}
              multiline
            />
            
            <TextInput
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
              placeholder="Market size (e.g., Large, Medium)"
              placeholderTextColor="#6B7280"
              value={newZone.marketSize}
              onChangeText={(text) => setNewZone({ ...newZone, marketSize: text })}
            />
            
            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="px-4 py-2 mr-2"
              >
                <Text className="text-gray-400">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateZone}
                className="bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}