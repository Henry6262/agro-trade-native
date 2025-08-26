import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Plus, MapPin, Warehouse, Trash2, Edit2 } from 'lucide-react-native';
import { SmartBaseCreationExpo as SmartBaseCreation } from './SmartBaseCreationExpo';

// Base type definitions
interface Base {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'SILO' | 'DEPOT' | 'OFFICE' | 'PORT' | 'FACTORY' | 'FARM';
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isPrimary: boolean;
}

export const BaseManagementWithMaps: React.FC = () => {
  const [bases, setBases] = useState<Base[]>([]);
  const [showAddBase, setShowAddBase] = useState(false);
  const [editingBase, setEditingBase] = useState<Base | null>(null);

  const handleAddBase = (newBase: Base) => {
    // If this is the first base, make it primary
    if (bases.length === 0) {
      newBase.isPrimary = true;
    }
    
    setBases([...bases, newBase]);
    setShowAddBase(false);
    
    // Show success message
    Alert.alert(
      'Success!',
      `${newBase.name} has been added to your locations.`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteBase = (baseId: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setBases(bases.filter(b => b.id !== baseId));
          }
        }
      ]
    );
  };

  const handleSetPrimary = (baseId: string) => {
    setBases(bases.map(base => ({
      ...base,
      isPrimary: base.id === baseId
    })));
  };

  const getTotalCapacity = () => {
    return bases.reduce((sum, base) => sum + (base.capacity || 0), 0);
  };

  return (
    <View >
      {/* Header */}
      <View className=" p-6 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Your Operating Locations
        </Text>
        <Text className="text-gray-600">
          Add all warehouses, silos, and facilities where you store or receive products
        </Text>
        
        {/* Summary Stats */}
        {bases.length > 0 && (
          <View className="flex-row mt-4 space-x-4">
            <View className="flex-1 bg-green-50 rounded-lg p-3">
              <Text className="text-green-800 text-sm font-medium">Locations</Text>
              <Text className="text-green-900 text-xl font-bold">{bases.length}</Text>
            </View>
            <View className="flex-1 bg-blue-50 rounded-lg p-3">
              <Text className="text-blue-800 text-sm font-medium">Total Capacity</Text>
              <Text className="text-blue-900 text-xl font-bold">
                {getTotalCapacity().toLocaleString()} tons
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Base List */}
      <ScrollView className="flex-1 p-4">
        {bases.length === 0 ? (
          <TouchableOpacity
            onPress={() => setShowAddBase(true)}
            className="bg-white rounded-xl p-8 items-center border-2 border-dashed border-gray-300"
          >
            <Warehouse size={48} color="#d1d5db" />
            <Text className="text-lg font-semibold text-gray-700 mt-4">
              Add Your First Location
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Use the map to easily add your warehouses, silos, or offices
            </Text>
            <View className="bg-green-600 rounded-full px-6 py-3 mt-6">
              <Text className="text-white font-semibold">Add Location with Map</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <>
            {bases.map((base) => (
              <BaseCard 
                key={base.id} 
                base={base} 
                onDelete={() => handleDeleteBase(base.id)}
                onSetPrimary={() => handleSetPrimary(base.id)}
                onEdit={() => setEditingBase(base)}
              />
            ))}
            
            <TouchableOpacity
              onPress={() => setShowAddBase(true)}
              className="mt-4 bg-green-600 rounded-xl p-4 flex-row items-center justify-center"
            >
              <Plus size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Add Another Location
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Add Base Modal */}
      <Modal
        visible={showAddBase}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SmartBaseCreation
          onSave={handleAddBase}
          onCancel={() => setShowAddBase(false)}
          defaultCountry="Bulgaria"
        />
      </Modal>

      {/* Bottom Action Bar */}
      {bases.length > 0 && (
        <View className="bg-white border-t border-gray-200 p-4">
          <TouchableOpacity
            className="bg-green-600 rounded-xl p-4"
            onPress={() => {
              // Continue to next step
              console.log('Bases configured:', bases);
              Alert.alert(
                'Ready to Continue!',
                `You've added ${bases.length} location(s) with a total capacity of ${getTotalCapacity().toLocaleString()} tons.`,
                [{ text: 'Continue' }]
              );
            }}
          >
            <Text className="text-white text-center font-semibold">
              Continue with {bases.length} Location{bases.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Individual Base Card Component
const BaseCard: React.FC<{
  base: Base;
  onDelete: () => void;
  onSetPrimary: () => void;
  onEdit: () => void;
}> = ({ base, onDelete, onSetPrimary, onEdit }) => {
  const getBaseIcon = (type: string) => {
    switch(type) {
      case 'WAREHOUSE': return '🏢';
      case 'SILO': return '🌾';
      case 'DEPOT': return '📦';
      case 'OFFICE': return '🏤';
      case 'PORT': return '⚓';
      case 'FACTORY': return '🏭';
      case 'FARM': return '🚜';
      default: return '📍';
    }
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl mr-2">{getBaseIcon(base.type)}</Text>
            <Text className="text-lg font-semibold">{base.name}</Text>
            {base.isPrimary && (
              <View className="bg-green-100 px-2 py-1 rounded-full ml-2">
                <Text className="text-xs text-green-700 font-medium">Primary</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center mb-1">
            <MapPin size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-1">
              {base.city}, {base.region}
            </Text>
          </View>
          
          <Text className="text-gray-500 text-sm">{base.address}</Text>
          
          {base.capacity && (
            <View className="mt-2 flex-row items-center">
              <Text className="text-gray-700">
                Capacity: <Text className="font-semibold">{base.capacity.toLocaleString()} tons</Text>
              </Text>
            </View>
          )}
          
          {base.contactPerson && (
            <View className="mt-2">
              <Text className="text-gray-600 text-sm">
                Contact: {base.contactPerson}
              </Text>
              {base.contactPhone && (
                <Text className="text-gray-600 text-sm">{base.contactPhone}</Text>
              )}
            </View>
          )}
        </View>
        
        <View className="flex-row space-x-2">
          {!base.isPrimary && (
            <TouchableOpacity 
              onPress={onSetPrimary}
              className="p-2"
            >
              <Text className="text-xs text-blue-600">Set Primary</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onEdit} className="p-2">
            <Edit2 size={18} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} className="p-2">
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Map Preview (optional - shows a small static map) */}
      <View className="mt-3 bg-gray-100 rounded-lg h-32 items-center justify-center">
        <MapPin size={24} color="#9ca3af" />
        <Text className="text-gray-500 text-sm mt-1">
          {base.latitude.toFixed(4)}, {base.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
};

export default BaseManagementWithMaps;