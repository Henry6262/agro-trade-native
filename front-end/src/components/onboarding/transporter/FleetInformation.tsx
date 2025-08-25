import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native'
import { Plus, Truck, Trash2 } from 'lucide-react-native'
import { Card } from '../../common/Card'
import { Badge } from '../../common/Badge'
import { Button } from '../../common/Button'
import { useOnboardingStore } from '../../../stores/onboarding-store'

interface TruckInfo {
  id: string
  capacity: number
  unit: 'tons' | 'kg'
  type: string
  count?: number // Add count for grouped trucks
}

export function FleetInformation() {
  const { transportData, setFleetInfo } = useOnboardingStore()
  const [newTruck, setNewTruck] = useState({ capacity: '', unit: 'tons' as 'tons' | 'kg', type: 'Standard' })
  const [batchMode, setBatchMode] = useState(false)
  const [batchCount, setBatchCount] = useState('')
  
  // Get current fleet from store or initialize empty
  const currentFleet = transportData?.fleetInfo?.vehicleTypes || []
  const totalCapacity = transportData?.fleetInfo?.capacity?.total || 0

  const handleAddTruck = () => {
    if (newTruck.capacity && Number.parseFloat(newTruck.capacity) > 0) {
      const count = batchMode && batchCount ? Math.max(1, Number.parseInt(batchCount)) : 1
      
      // Check if a similar truck configuration already exists
      const existingTruckIndex = currentFleet.findIndex(
        truck => truck.capacity === Number.parseFloat(newTruck.capacity) && 
                 truck.unit === newTruck.unit && 
                 truck.type === newTruck.type
      )
      
      let updatedFleet: TruckInfo[]
      
      if (existingTruckIndex !== -1 && batchMode) {
        // Update existing truck count
        updatedFleet = [...currentFleet]
        const existingCount = updatedFleet[existingTruckIndex].count || 1
        updatedFleet[existingTruckIndex] = {
          ...updatedFleet[existingTruckIndex],
          count: existingCount + count
        }
      } else {
        // Add new truck with count
        const newTruckInfo: TruckInfo = {
          id: `truck-${Date.now()}`,
          capacity: Number.parseFloat(newTruck.capacity),
          unit: newTruck.unit,
          type: newTruck.type,
          count: count > 1 ? count : undefined
        }
        updatedFleet = [...currentFleet, newTruckInfo]
      }
      
      const newTotalCapacity = updatedFleet.reduce((sum, t) => {
        const truckCount = t.count || 1
        return sum + (t.capacity * truckCount)
      }, 0)
      
      const totalVehicleCount = updatedFleet.reduce((sum, truck) => sum + (truck.count || 1), 0)
      
      setFleetInfo({
        ...transportData?.fleetInfo,
        vehicleCount: totalVehicleCount,
        vehicleTypes: updatedFleet,
        capacity: { total: newTotalCapacity, unit: 'tons' },
        baseLocation: transportData?.fleetInfo?.baseLocation || {
          id: '',
          address: '',
          city: '',
          state: '',
          country: '',
          zipCode: '',
        },
      })

      setNewTruck({ capacity: '', unit: 'tons', type: 'Standard' })
      setBatchCount('')
    }
  }

  const handleRemoveTruck = (truckId: string) => {
    const updatedFleet = currentFleet.filter((truck) => truck.id !== truckId)
    const newTotalCapacity = updatedFleet.reduce((sum, t) => {
      const truckCount = t.count || 1
      return sum + (t.capacity * truckCount)
    }, 0)
    const totalVehicleCount = updatedFleet.reduce((sum, truck) => sum + (truck.count || 1), 0)
    
    setFleetInfo({
      ...transportData?.fleetInfo,
      vehicleCount: totalVehicleCount,
      vehicleTypes: updatedFleet,
      capacity: { total: newTotalCapacity, unit: 'tons' },
      baseLocation: transportData?.fleetInfo?.baseLocation || {
        id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingBottom: 96 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 64, height: 64, backgroundColor: 'rgba(234, 88, 12, 0.2)', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Truck size={32} color="#ea580c" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 12 }}>Fleet Information</Text>
            <Text style={{ color: '#9CA3AF', maxWidth: 600, textAlign: 'center', fontSize: 16 }}>
              Tell us about your transportation fleet. Add details about each truck including capacity to help buyers find the right transporter.
            </Text>
          </View>

          {currentFleet.length > 0 && (
            <Card style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', borderColor: '#ea580c', padding: 24, marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>Fleet Summary</Text>
                  <Text style={{ color: '#9CA3AF' }}>Total capacity across all vehicles</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ea580c' }}>{totalCapacity}</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF' }}>tons total capacity</Text>
                </View>
              </View>
            </Card>
          )}

          <Card style={{ padding: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#374151', backgroundColor: '#1F2937', marginBottom: 32 }}>
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Plus size={20} color="#ea580c" />
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginLeft: 8 }}>Add Truck to Fleet</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setBatchMode(!batchMode)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: batchMode ? '#ea580c' : '#374151',
                    borderWidth: 1,
                    borderColor: batchMode ? '#ea580c' : '#9CA3AF'
                  }}
                >
                  <Text style={{ fontSize: 12, color: batchMode ? '#FFFFFF' : '#9CA3AF', fontWeight: '500' }}>
                    Batch Mode
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>Capacity</Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="e.g., 10"
                    value={newTruck.capacity}
                    onChangeText={(text) => setNewTruck({ ...newTruck, capacity: text })}
                    style={{ fontSize: 16, borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                
                {batchMode && (
                  <View style={{ width: 80, marginRight: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>Count</Text>
                    <TextInput
                      keyboardType="numeric"
                      placeholder="1"
                      value={batchCount}
                      onChangeText={setBatchCount}
                      style={{ fontSize: 16, borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                )}
                
                <View style={{ width: 80 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>Unit</Text>
                  <View style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, backgroundColor: '#111827' }}>
                    <TextInput
                      value={newTruck.unit}
                      editable={false}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, color: '#FFFFFF' }}
                    />
                  </View>
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>Truck Type</Text>
                <TextInput
                  value={newTruck.type}
                  onChangeText={(text) => setNewTruck({ ...newTruck, type: text })}
                  placeholder="e.g., Standard, Refrigerated, Flatbed"
                  style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                onPress={handleAddTruck}
                disabled={!newTruck.capacity || Number.parseFloat(newTruck.capacity) <= 0}
                style={{
                  borderRadius: 8,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: (!newTruck.capacity || Number.parseFloat(newTruck.capacity) <= 0) ? '#374151' : '#ea580c'
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: 'white', fontWeight: '500', textAlign: 'center' }}>
                  {batchMode && batchCount ? `Add ${batchCount} Trucks` : 'Add Truck'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {currentFleet.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
                Your Fleet ({currentFleet.reduce((sum, truck) => sum + (truck.count || 1), 0)} trucks)
              </Text>
              <View>
                {currentFleet.map((truck, index) => {
                  const truckCount = truck.count || 1;
                  const totalCapacity = truck.capacity * truckCount;
                  
                  return (
                    <Card key={truck.id} style={{ padding: 16, backgroundColor: '#1F2937', borderColor: '#374151', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 40, height: 40, backgroundColor: 'rgba(234, 88, 12, 0.2)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <Truck size={20} color="#ea580c" />
                          </View>
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                              <Text style={{ fontWeight: '600', color: '#FFFFFF', marginRight: 8 }}>
                                {truck.type}
                              </Text>
                              {truckCount > 1 && (
                                <Badge variant="default" style={{ backgroundColor: '#ea580c' }}>
                                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '600' }}>x{truckCount}</Text>
                                </Badge>
                              )}
                            </View>
                            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>
                              {truckCount === 1 ? `${truck.capacity} ${truck.unit}` : `${truck.capacity} ${truck.unit} each`}
                            </Text>
                            {truckCount > 1 && (
                              <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '500' }}>
                                Total: {totalCapacity} {truck.unit}
                              </Text>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveTruck(truck.id)}
                          style={{ padding: 8, borderRadius: 8 }}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </Card>
                  )
                })}
              </View>
            </View>
          )}

          {currentFleet.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Truck size={64} color="#9CA3AF" />
              <Text style={{ color: '#9CA3AF', marginTop: 16, textAlign: 'center' }}>No trucks added yet. Add your first truck to get started.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}