import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import { API_URL } from '../../config/api'

interface Base {
  id: string
  name: string
  code: string | null
  type: string
  isPrimary: boolean
  isActive: boolean
  address: string
  city: string
  region: string | null
  country: string
  postalCode: string | null
  latitude: number
  longitude: number
  contactPerson: string | null
  contactPhone: string | null
  contactEmail: string | null
  storageCapacity: number | null
  currentUsage: number | null
  features: string[] | null
  certifications: string[] | null
}

const BASE_TYPES = [
  { value: 'WAREHOUSE', label: 'Warehouse', icon: 'business-outline' },
  { value: 'SILO', label: 'Silo', icon: 'cube-outline' },
  { value: 'DEPOT', label: 'Distribution Depot', icon: 'git-network-outline' },
  { value: 'OFFICE', label: 'Office', icon: 'briefcase-outline' },
  { value: 'PORT', label: 'Port Facility', icon: 'boat-outline' },
  { value: 'FACTORY', label: 'Processing Factory', icon: 'construct-outline' },
  { value: 'FARM', label: 'Farm Location', icon: 'leaf-outline' },
]

export default function BaseManagementScreen() {
  const navigation = useNavigation()
  const { token, user } = useAuthStore()
  const [bases, setBases] = useState<Base[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBase, setSelectedBase] = useState<Base | null>(null)
  const [newBase, setNewBase] = useState({
    name: '',
    code: '',
    type: 'WAREHOUSE',
    address: '',
    city: '',
    region: '',
    country: 'Bulgaria',
    postalCode: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    storageCapacity: '',
  })

  useEffect(() => {
    fetchBases()
  }, [])

  const fetchBases = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/bases/my-bases`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBases(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch bases:', error)
      Alert.alert('Error', 'Failed to load your bases')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBase = async () => {
    if (!newBase.name || !newBase.address || !newBase.city) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    try {
      // First geocode the address
      const geocodeResponse = await axios.post(
        `${API_URL}/location/geocode`,
        { address: `${newBase.address}, ${newBase.city}, ${newBase.country}` },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const { latitude, longitude } = geocodeResponse.data

      const baseData = {
        ...newBase,
        latitude,
        longitude,
        storageCapacity: newBase.storageCapacity ? parseFloat(newBase.storageCapacity) : null,
      }

      const response = await axios.post(`${API_URL}/bases`, baseData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setBases([...bases, response.data.data])
      setShowAddModal(false)
      resetNewBase()
      Alert.alert('Success', 'Base created successfully')
    } catch (error) {
      console.error('Failed to create base:', error)
      Alert.alert('Error', 'Failed to create base')
    }
  }

  const handleSetPrimary = async (baseId: string) => {
    try {
      await axios.put(
        `${API_URL}/bases/${baseId}/set-primary`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      await fetchBases()
      Alert.alert('Success', 'Primary base updated')
    } catch (error) {
      console.error('Failed to set primary base:', error)
      Alert.alert('Error', 'Failed to update primary base')
    }
  }

  const handleDeleteBase = async (baseId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this base?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/bases/${baseId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              setBases(bases.filter((b) => b.id !== baseId))
              Alert.alert('Success', 'Base deleted successfully')
            } catch (error) {
              console.error('Failed to delete base:', error)
              Alert.alert('Error', 'Failed to delete base')
            }
          },
        },
      ]
    )
  }

  const resetNewBase = () => {
    setNewBase({
      name: '',
      code: '',
      type: 'WAREHOUSE',
      address: '',
      city: '',
      region: '',
      country: 'Bulgaria',
      postalCode: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      storageCapacity: '',
    })
  }

  const getBaseTypeIcon = (type: string) => {
    const baseType = BASE_TYPES.find((t) => t.value === type)
    return baseType?.icon || 'cube-outline'
  }

  const getBaseTypeLabel = (type: string) => {
    const baseType = BASE_TYPES.find((t) => t.value === type)
    return baseType?.label || type
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-4">Loading your bases...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">Base Management</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Add Base</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bases List */}
      <ScrollView className="flex-1 px-6 py-4">
        {bases.length === 0 ? (
          <View className="bg-gray-800 rounded-xl p-8 items-center">
            <Ionicons name="business-outline" size={48} color="#6B7280" />
            <Text className="text-gray-400 text-lg mt-4">No bases added yet</Text>
            <Text className="text-gray-500 text-sm mt-2 text-center">
              Add your warehouses, silos, and distribution centers to manage your operations
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
            >
              <Text className="text-white font-medium">Add Your First Base</Text>
            </TouchableOpacity>
          </View>
        ) : (
          bases.map((base) => (
            <TouchableOpacity
              key={base.id}
              onPress={() => setSelectedBase(base)}
              className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  {/* Base Header */}
                  <View className="flex-row items-center mb-2">
                    <View className="bg-gray-700 p-2 rounded-lg mr-3">
                      <Ionicons
                        name={getBaseTypeIcon(base.type) as any}
                        size={24}
                        color="#3B82F6"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold text-lg">
                          {base.name}
                        </Text>
                        {base.isPrimary && (
                          <View className="bg-green-500/20 px-2 py-1 rounded ml-2">
                            <Text className="text-green-500 text-xs">Primary</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-400 text-sm">
                        {getBaseTypeLabel(base.type)}
                        {base.code && ` • ${base.code}`}
                      </Text>
                    </View>
                  </View>

                  {/* Location */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-1">
                      {base.address}, {base.city}
                      {base.region && `, ${base.region}`}, {base.country}
                    </Text>
                  </View>

                  {/* Capacity */}
                  {base.storageCapacity && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="cube-outline" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 text-sm ml-1">
                        Capacity: {base.storageCapacity} tons
                        {base.currentUsage && ` (${Math.round((base.currentUsage / base.storageCapacity) * 100)}% used)`}
                      </Text>
                    </View>
                  )}

                  {/* Contact */}
                  {base.contactPerson && (
                    <View className="flex-row items-center">
                      <Ionicons name="person-outline" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 text-sm ml-1">
                        {base.contactPerson}
                        {base.contactPhone && ` • ${base.contactPhone}`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View className="ml-2">
                  {!base.isPrimary && (
                    <TouchableOpacity
                      onPress={() => handleSetPrimary(base.id)}
                      className="p-2 mb-2"
                    >
                      <Ionicons name="star-outline" size={20} color="#F59E0B" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteBase(base.id)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add Base Modal */}
      {showAddModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center p-6">
          <ScrollView className="w-full max-w-md">
            <View className="bg-gray-800 rounded-xl p-6">
              <Text className="text-white text-xl font-bold mb-4">Add New Base</Text>

              {/* Base Type Selection */}
              <Text className="text-gray-400 text-sm mb-2">Base Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {BASE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setNewBase({ ...newBase, type: type.value })}
                    className={`px-4 py-3 rounded-lg mr-2 flex-row items-center ${
                      newBase.type === type.value ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={newBase.type === type.value ? 'white' : '#9CA3AF'}
                    />
                    <Text
                      className={`ml-2 ${
                        newBase.type === type.value ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
                placeholder="Base name *"
                placeholderTextColor="#6B7280"
                value={newBase.name}
                onChangeText={(text) => setNewBase({ ...newBase, name: text })}
              />

              <TextInput
                className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
                placeholder="Code (optional, e.g., WH-01)"
                placeholderTextColor="#6B7280"
                value={newBase.code}
                onChangeText={(text) => setNewBase({ ...newBase, code: text })}
              />

              <TextInput
                className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
                placeholder="Address *"
                placeholderTextColor="#6B7280"
                value={newBase.address}
                onChangeText={(text) => setNewBase({ ...newBase, address: text })}
              />

              <View className="flex-row mb-3">
                <TextInput
                  className="bg-gray-700 text-white rounded-lg px-4 py-3 flex-1 mr-2"
                  placeholder="City *"
                  placeholderTextColor="#6B7280"
                  value={newBase.city}
                  onChangeText={(text) => setNewBase({ ...newBase, city: text })}
                />
                <TextInput
                  className="bg-gray-700 text-white rounded-lg px-4 py-3 flex-1"
                  placeholder="Postal Code"
                  placeholderTextColor="#6B7280"
                  value={newBase.postalCode}
                  onChangeText={(text) => setNewBase({ ...newBase, postalCode: text })}
                />
              </View>

              <TextInput
                className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
                placeholder="Storage Capacity (tons)"
                placeholderTextColor="#6B7280"
                value={newBase.storageCapacity}
                onChangeText={(text) => setNewBase({ ...newBase, storageCapacity: text })}
                keyboardType="numeric"
              />

              <TextInput
                className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
                placeholder="Contact Person"
                placeholderTextColor="#6B7280"
                value={newBase.contactPerson}
                onChangeText={(text) => setNewBase({ ...newBase, contactPerson: text })}
              />

              <TextInput
                className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-3"
                placeholder="Contact Phone"
                placeholderTextColor="#6B7280"
                value={newBase.contactPhone}
                onChangeText={(text) => setNewBase({ ...newBase, contactPhone: text })}
                keyboardType="phone-pad"
              />

              <TextInput
                className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-4"
                placeholder="Contact Email"
                placeholderTextColor="#6B7280"
                value={newBase.contactEmail}
                onChangeText={(text) => setNewBase({ ...newBase, contactEmail: text })}
                keyboardType="email-address"
              />

              <View className="flex-row justify-end">
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false)
                    resetNewBase()
                  }}
                  className="px-4 py-2 mr-2"
                >
                  <Text className="text-gray-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateBase}
                  className="bg-blue-600 px-6 py-2 rounded-lg"
                >
                  <Text className="text-white font-medium">Create Base</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  )
}