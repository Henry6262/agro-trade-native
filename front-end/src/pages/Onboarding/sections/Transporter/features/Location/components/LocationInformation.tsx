import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native'
import { MapPin, Plus, X, Truck } from 'lucide-react-native'
import { Badge } from '@shared/components/Badge'
import { useOnboardingStore } from '@stores/onboarding.store'
import { OnboardingLayout } from '@pages/Onboarding/components/shared/OnboardingLayout'

interface BaseLocation {
  id: string
  name: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  assignedTrucks: string[]
  isMainBase: boolean
}

export function LocationInformation() {
  const { transportData, setFleetInfo } = useOnboardingStore()
  
  // Local state for managing bases
  const [bases, setBases] = useState<BaseLocation[]>(() => {
    const existingBase = transportData?.fleetInfo?.baseLocation
    if (existingBase && (existingBase.city || existingBase.address)) {
      return [{
        id: 'base-1',
        name: 'Main Base',
        address: existingBase.address || '',
        city: existingBase.city || '',
        state: existingBase.state || '',
        country: existingBase.country || '',
        zipCode: existingBase.zipCode || '',
        assignedTrucks: [],
        isMainBase: true
      }]
    }
    return []
  })
  
  const [showAddBaseModal, setShowAddBaseModal] = useState(false)
  const [showTruckAssignmentModal, setShowTruckAssignmentModal] = useState(false)
  const [selectedBaseForAssignment, setSelectedBaseForAssignment] = useState<string | null>(null)
  const [newBase, setNewBase] = useState<Omit<BaseLocation, 'id' | 'assignedTrucks' | 'isMainBase'>>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  })

  // Get available trucks from fleet
  const availableFleet = transportData?.fleetInfo?.vehicleTypes || []

  const handleLocationChange = (field: string, value: string) => {
    // Update the main base if it exists
    if (bases.length > 0 && bases[0].isMainBase) {
      const updatedBases = bases.map(base => 
        base.isMainBase ? { ...base, [field]: value } : base
      )
      setBases(updatedBases)
      
      // Also update the store
      setFleetInfo({
        ...transportData?.fleetInfo,
        baseLocation: {
          id: updatedBases[0].id,
          address: updatedBases[0].address,
          city: updatedBases[0].city,
          state: updatedBases[0].state,
          country: updatedBases[0].country,
          zipCode: updatedBases[0].zipCode,
        },
        vehicleCount: transportData?.fleetInfo?.vehicleCount || 0,
        vehicleTypes: transportData?.fleetInfo?.vehicleTypes || [],
        capacity: transportData?.fleetInfo?.capacity || { total: 0, unit: 'tons' },
        bases: updatedBases,
      })
    }
  }

  const addBase = () => {
    if (newBase.name && newBase.city && newBase.country) {
      const base: BaseLocation = {
        id: `base-${Date.now()}`,
        ...newBase,
        assignedTrucks: [],
        isMainBase: bases.length === 0
      }
      
      const updatedBases = [...bases, base]
      setBases(updatedBases)
      
      // Update store
      setFleetInfo({
        ...transportData?.fleetInfo,
        baseLocation: base.isMainBase ? {
          id: base.id,
          address: base.address,
          city: base.city,
          state: base.state,
          country: base.country,
          zipCode: base.zipCode,
        } : transportData?.fleetInfo?.baseLocation,
        vehicleCount: transportData?.fleetInfo?.vehicleCount || 0,
        vehicleTypes: transportData?.fleetInfo?.vehicleTypes || [],
        capacity: transportData?.fleetInfo?.capacity || { total: 0, unit: 'tons' },
        bases: updatedBases,
      })
      
      setNewBase({ name: '', address: '', city: '', state: '', country: '', zipCode: '' })
      setShowAddBaseModal(false)
    }
  }

  const removeBase = (baseId: string) => {
    const baseToRemove = bases.find(b => b.id === baseId)
    if (baseToRemove?.isMainBase) {
      Alert.alert('Cannot Remove', 'Cannot remove the main base')
      return
    }
    
    const updatedBases = bases.filter(b => b.id !== baseId)
    setBases(updatedBases)
    
    // Update store
    setFleetInfo({
      ...transportData?.fleetInfo,
      bases: updatedBases,
    })
  }

  const assignTrucksToBase = (baseId: string, truckIds: string[]) => {
    const updatedBases = bases.map(base => {
      if (base.id === baseId) {
        return { ...base, assignedTrucks: truckIds }
      }
      // Remove trucks from other bases
      return { ...base, assignedTrucks: base.assignedTrucks.filter(id => !truckIds.includes(id)) }
    })
    
    setBases(updatedBases)
    setFleetInfo({
      ...transportData?.fleetInfo,
      bases: updatedBases,
    })
  }

  const TruckAssignmentModal = () => {
    const selectedBase = bases.find(b => b.id === selectedBaseForAssignment)
    const [selectedTrucks, setSelectedTrucks] = useState<string[]>(selectedBase?.assignedTrucks || [])

    return (
      <Modal visible={showTruckAssignmentModal} transparent animationType="fade">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}
          onPress={() => setShowTruckAssignmentModal(false)}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={{ backgroundColor: '#1F2937', borderRadius: 12, padding: 24, maxHeight: '80%' }}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                Assign Trucks to {selectedBase?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowTruckAssignmentModal(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {availableFleet.map((truck, index) => (
                <TouchableOpacity
                  key={truck.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: selectedTrucks.includes(truck.id) ? 'rgba(37, 99, 235, 0.1)' : '#374151',
                    borderWidth: 1,
                    borderColor: selectedTrucks.includes(truck.id) ? '#2563eb' : '#374151',
                    marginBottom: 8
                  }}
                  onPress={() => {
                    setSelectedTrucks(prev =>
                      prev.includes(truck.id) 
                        ? prev.filter(id => id !== truck.id)
                        : [...prev, truck.id]
                    )
                  }}
                >
                  <Truck size={20} color={selectedTrucks.includes(truck.id) ? '#2563eb' : '#9CA3AF'} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>Truck {index + 1}</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{truck.capacity} {truck.unit} - {truck.type}</Text>
                  </View>
                  {selectedTrucks.includes(truck.id) && (
                    <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: '#2563eb',
                borderRadius: 8,
                paddingVertical: 12,
                marginTop: 16
              }}
              onPress={() => {
                if (selectedBaseForAssignment) {
                  assignTrucksToBase(selectedBaseForAssignment, selectedTrucks)
                }
                setShowTruckAssignmentModal(false)
              }}
            >
              <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
                Assign {selectedTrucks.length} Trucks
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <OnboardingLayout>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 64, height: 64, backgroundColor: 'rgba(37, 99, 235, 0.2)', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MapPin size={32} color="#2563eb" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 }}>Business Locations</Text>
            <Text style={{ color: '#9CA3AF', maxWidth: 600, textAlign: 'center', fontSize: 16 }}>
              Set up your main base and additional locations. Assign trucks to each base for better service coverage.
            </Text>
          </View>

          {/* Add Base Button */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2563eb',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
              marginBottom: 24
            }}
            onPress={() => setShowAddBaseModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 8 }}>
              Add New Base
            </Text>
          </TouchableOpacity>

          {/* Bases List */}
          {bases.map((base, index) => (
            <View key={base.id} style={{ padding: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>{base.name}</Text>
                    {base.isMainBase && (
                      <Badge style={{ backgroundColor: '#2563eb', marginLeft: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10 }}>MAIN</Text>
                      </Badge>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <MapPin size={16} color="#9CA3AF" />
                    <Text style={{ color: '#9CA3AF', marginLeft: 8 }}>
                      {base.city}, {base.state}, {base.country}
                    </Text>
                  </View>
                </View>
                
                {!base.isMainBase && (
                  <TouchableOpacity
                    onPress={() => removeBase(base.id)}
                    style={{ padding: 8 }}
                  >
                    <X size={16} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>

              
            </View>
          ))}

          {bases.length === 0 && (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <MapPin size={48} color="#9CA3AF" />
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>
                No Bases Added
              </Text>
              <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>
                Add your first base to get started with location management
              </Text>
            </View>
          )}
      </OnboardingLayout>

      {/* Add Base Modal */}
      <Modal visible={showAddBaseModal} transparent animationType="fade">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}
          onPress={() => setShowAddBaseModal(false)}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={{ backgroundColor: '#1F2937', borderRadius: 12, padding: 24, maxHeight: '80%' }}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>Add New Base</Text>
              <TouchableOpacity onPress={() => setShowAddBaseModal(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>Base Name *</Text>
                <TextInput
                  placeholder="e.g., Downtown Office, Warehouse 2"
                  value={newBase.name}
                  onChangeText={(text) => setNewBase({ ...newBase, name: text })}
                  style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>City *</Text>
                <TextInput
                  placeholder="Enter city"
                  value={newBase.city}
                  onChangeText={(text) => setNewBase({ ...newBase, city: text })}
                  style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>State</Text>
                  <TextInput
                    placeholder="State/Province"
                    value={newBase.state}
                    onChangeText={(text) => setNewBase({ ...newBase, state: text })}
                    style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>Country *</Text>
                  <TextInput
                    placeholder="Country"
                    value={newBase.country}
                    onChangeText={(text) => setNewBase({ ...newBase, country: text })}
                    style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>Address</Text>
                <TextInput
                  placeholder="Full address (optional)"
                  value={newBase.address}
                  onChangeText={(text) => setNewBase({ ...newBase, address: text })}
                  multiline
                  numberOfLines={2}
                  style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF', textAlignVertical: 'top' }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>ZIP Code</Text>
                <TextInput
                  placeholder="Postal/ZIP code"
                  value={newBase.zipCode}
                  onChangeText={(text) => setNewBase({ ...newBase, zipCode: text })}
                  style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: newBase.name && newBase.city && newBase.country ? '#2563eb' : '#374151',
                borderRadius: 8,
                paddingVertical: 12,
                marginTop: 8
              }}
              onPress={addBase}
              disabled={!newBase.name || !newBase.city || !newBase.country}
            >
              <Text style={{ color: '#FFFFFF', textAlign: 'center', fontWeight: '600' }}>
                Add Base
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <TruckAssignmentModal />
    </SafeAreaView>
  )
}