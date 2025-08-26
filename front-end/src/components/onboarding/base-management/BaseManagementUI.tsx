import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Plus, MapPin, Warehouse, Trash2, Edit2, Check } from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import MapView, { Marker } from 'react-native-maps';

// Types
interface Base {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'SILO' | 'DEPOT' | 'OFFICE' | 'PORT' | 'FACTORY' | 'FARM';
  address: string;
  city: string;
  capacity?: number;
  isPrimary: boolean;
  coordinates?: { lat: number; lng: number };
}

interface ProductDistribution {
  productId: string;
  productName: string;
  totalQuantity: number;
  unit: 'TON' | 'KG';
  distribution: {
    baseId: string;
    quantity: number;
    percentage: number;
  }[];
}

// Main Component for Base Management
export const BaseManagementFlow: React.FC = () => {
  const [bases, setBases] = useState<Base[]>([]);
  const [showAddBase, setShowAddBase] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <ScrollView className="">
      {/* Header */}
      <View className=" p-6 border-b border-gray-200">
        <Text className="text-2xl text-white font-bold text-gray-900 mb-2">
          Your Operating Locations
        </Text>
        <Text className="text-gray-400">
          Add all warehouses, silos, and facilities where you store or receive products
        </Text>
      </View>

      {/* View Toggle */}
      <View className="flex-row p-4 justify-center space-x-4">
        <TouchableOpacity
          onPress={() => setViewMode('list')}
          className={`px-6 py-2 rounded-full ${
            viewMode === 'list' ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <Text className={viewMode === 'list' ? 'text-white' : 'text-gray-700'}>
            List View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setViewMode('map')}
          className={`px-6 py-2 rounded-full ${
            viewMode === 'map' ? 'bg-green-600' : 'bg-gray-200'
          }`}
        >
          <Text className={viewMode === 'map' ? 'text-white' : 'text-gray-700'}>
            Map View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <BaseListView bases={bases} onAddBase={() => setShowAddBase(true)} />
      ) : (
        <BaseMapView bases={bases} />
      )}

      {/* Add Base Modal */}
      {showAddBase && (
        <AddBaseModal
          onClose={() => setShowAddBase(false)}
          onSave={(base) => {
            setBases([...bases, base]);
            setShowAddBase(false);
          }}
        />
      )}
    </ScrollView>
  );
};

// Base List Component
const BaseListView: React.FC<{ bases: Base[]; onAddBase: () => void }> = ({
  bases,
  onAddBase,
}) => {
  return (
    <View className="p-4">
      {bases.length === 0 ? (
        <EmptyStateCard onAddBase={onAddBase} />
      ) : (
        <>
          {bases.map((base) => (
            <BaseCard key={base.id} base={base} />
          ))}
          <TouchableOpacity
            onPress={onAddBase}
            className="mt-4 bg-green-600 rounded-xl p-4 flex-row items-center justify-center"
          >
            <Plus size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Add Another Location</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// Individual Base Card
const BaseCard: React.FC<{ base: Base }> = ({ base }) => {
  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Warehouse size={20} color="#10b981" />
            <Text className="text-lg font-semibold ml-2">{base.name}</Text>
            {base.isPrimary && (
              <View className="bg-green-100 px-2 py-1 rounded-full ml-2">
                <Text className="text-xs text-green-700">Primary</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mb-1">
            <MapPin size={16} color="#6b7280" />
            <Text className="text-gray-600 ml-1">{base.city}</Text>
          </View>
          <Text className="text-gray-500 text-sm">{base.address}</Text>
          {base.capacity && (
            <Text className="text-gray-700 mt-2">
              Capacity: <Text className="font-semibold">{base.capacity} tons</Text>
            </Text>
          )}
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity className="p-2">
            <Edit2 size={18} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Empty State
const EmptyStateCard: React.FC<{ onAddBase: () => void }> = ({ onAddBase }) => {
  return (
    <TouchableOpacity
      onPress={onAddBase}
      className="bg-white rounded-xl p-8 items-center border-2 border-dashed border-gray-300"
    >
      <Warehouse size={48} color="#d1d5db" />
      <Text className="text-lg font-semibold text-gray-700 mt-4">
        Add Your First Location
      </Text>
      <Text className="text-gray-500 text-center mt-2">
        Start by adding your main warehouse, silo, or office
      </Text>
      <View className="bg-green-600 rounded-full px-6 py-3 mt-6">
        <Text className="text-white font-semibold">Add Location</Text>
      </View>
    </TouchableOpacity>
  );
};

// Product Distribution Component
export const ProductDistributionUI: React.FC<{
  userType: 'buyer' | 'seller';
  bases: Base[];
  product: { id: string; name: string; totalQuantity: number; unit: string };
}> = ({ userType, bases, product }) => {
  const [distribution, setDistribution] = useState<
    { baseId: string; quantity: number }[]
  >([]);
  const [autoDistribute, setAutoDistribute] = useState(false);

  const handleQuantityChange = (baseId: string, quantity: string) => {
    const numQuantity = parseFloat(quantity) || 0;
    setDistribution((prev) => {
      const existing = prev.find((d) => d.baseId === baseId);
      if (existing) {
        return prev.map((d) => (d.baseId === baseId ? { ...d, quantity: numQuantity } : d));
      }
      return [...prev, { baseId, quantity: numQuantity }];
    });
  };

  const getTotalDistributed = () => {
    return distribution.reduce((sum, d) => sum + d.quantity, 0);
  };

  const getRemainingQuantity = () => {
    return product.totalQuantity - getTotalDistributed();
  };

  const handleAutoDistribute = () => {
    const equalQuantity = Math.floor(product.totalQuantity / bases.length);
    const remainder = product.totalQuantity % bases.length;
    
    const newDistribution = bases.map((base, index) => ({
      baseId: base.id,
      quantity: equalQuantity + (index === 0 ? remainder : 0),
    }));
    
    setDistribution(newDistribution);
  };

  return (
    <View className="p-6">
      <View className="mb-6">
        <Text className="text-xl font-bold text-white mb-2">
          {userType === 'buyer' ? 'Where do you need delivery?' : 'Where is your stock located?'}
        </Text>
        <Text className="text-gray-400">
          Distribute {product.totalQuantity} {product.unit} of {product.name}
        </Text>
      </View>

      {/* Visual Distribution Chart */}
      <DistributionChart
        total={product.totalQuantity}
        distribution={distribution}
        bases={bases}
      />

      {/* Quick Actions */}
      <View className="flex-row space-x-2 mb-6">
        <TouchableOpacity
          onPress={handleAutoDistribute}
          className="flex-1 bg-blue-600 rounded-lg p-3"
        >
          <Text className="text-white text-center font-medium">
            Distribute Equally
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setDistribution([{ baseId: bases[0].id, quantity: product.totalQuantity }]);
          }}
          className="flex-1 bg-gray-700 rounded-lg p-3"
        >
          <Text className="text-gray-300 text-center font-medium">
            All in Primary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual Distribution */}
      <View className="space-y-4">
        {bases.map((base) => {
          const baseDistribution = distribution.find((d) => d.baseId === base.id);
          const quantity = baseDistribution?.quantity || 0;
          const percentage = product.totalQuantity > 0 
            ? Math.round((quantity / product.totalQuantity) * 100) 
            : 0;

          return (
            <View key={base.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1">
                  <Text className="font-semibold text-white">{base.name}</Text>
                  <Text className="text-sm text-gray-400">{base.city}</Text>
                </View>
                <View className="bg-blue-600 px-3 py-1 rounded-full">
                  <Text className="text-sm font-medium text-white">{percentage}%</Text>
                </View>
              </View>
              
              <View className="flex-row items-center space-x-3">
                <View className="flex-row items-center flex-1">
                  <TextInput
                    className="flex-1 border border-gray-600 bg-gray-700 rounded-lg px-3 py-2 text-white mr-2"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={quantity.toString()}
                    onChangeText={(text) => handleQuantityChange(base.id, text)}
                  />
                  <Text className="text-gray-400">{product.unit}</Text>
                </View>
                <Text className="text-gray-300 font-semibold">{quantity} tons</Text>
              </View>

              {/* Visual Progress Bar */}
              <View className="mt-3 bg-gray-700 rounded-full h-2">
                <View
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-400">Total Distributed:</Text>
          <Text className="font-semibold text-white">
            {getTotalDistributed()} {product.unit}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-400">Remaining:</Text>
          <Text
            className={`font-semibold ${
              getRemainingQuantity() === 0 ? 'text-green-400' : 'text-orange-400'
            }`}
          >
            {getRemainingQuantity()} {product.unit}
          </Text>
        </View>
        {getRemainingQuantity() !== 0 && (
          <Text className="text-sm text-orange-400 mt-2">
            ⚠️ Please distribute all quantity across your locations
          </Text>
        )}
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        disabled={getRemainingQuantity() !== 0}
        className={`mt-6 rounded-xl p-4 ${
          getRemainingQuantity() === 0 ? 'bg-green-600' : 'bg-gray-300'
        }`}
      >
        <Text className="text-white text-center font-semibold">
          {getRemainingQuantity() === 0 ? 'Continue' : 'Distribute All Quantity First'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Visual Distribution Chart Component
const DistributionChart: React.FC<{
  total: number;
  distribution: { baseId: string; quantity: number }[];
  bases: Base[];
}> = ({ total, distribution, bases }) => {
  if (distribution.length === 0 || total === 0) {
    return (
      <View className="h-48 bg-gray-800 rounded-lg items-center justify-center mb-6 border border-gray-700">
        <Text className="text-gray-400">Distribution will appear here</Text>
      </View>
    );
  }

  const chartData = distribution.map((d) => {
    const base = bases.find((b) => b.id === d.baseId);
    return {
      name: base?.name || 'Unknown',
      population: d.quantity,
      color: getColorForIndex(bases.indexOf(base!)),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    };
  });

  return (
    <View className="items-center mb-6">
      <PieChart
        data={chartData}
        width={300}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

// Helper function for colors
const getColorForIndex = (index: number): string => {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  return colors[index % colors.length];
};

// Add Base Modal Component
const AddBaseModal: React.FC<{
  onClose: () => void;
  onSave: (base: Base) => void;
}> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'WAREHOUSE' as Base['type'],
    address: '',
    city: '',
    capacity: '',
  });

  const handleSave = () => {
    if (!formData.name || !formData.city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    onSave({
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      address: formData.address,
      city: formData.city,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      isPrimary: false,
    });
  };

  return (
    <View className="absolute inset-0 bg-black/50 justify-center p-6">
      <View className="bg-white rounded-2xl p-6">
        <Text className="text-xl font-bold mb-4">Add New Location</Text>
        
        {/* Form fields */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 mb-2">Location Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="e.g., Main Warehouse Sofia"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-2">Type *</Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3">
              <Text>{formData.type}</Text>
            </View>
          </View>

          <View>
            <Text className="text-gray-700 mb-2">City *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="e.g., Sofia"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-2">Address</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="e.g., 123 Industrial Zone"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
          </View>

        </View>

        {/* Actions */}
        <View className="flex-row space-x-3 mt-6">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 border border-gray-300 rounded-lg py-3"
          >
            <Text className="text-gray-700 text-center font-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            className="flex-1 bg-green-600 rounded-lg py-3"
          >
            <Text className="text-white text-center font-medium">Add Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Map View Component
const BaseMapView: React.FC<{ bases: Base[] }> = ({ bases }) => {
  return (
    <View className="h-96 m-4 rounded-xl overflow-hidden">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 42.7339,
          longitude: 25.4858,
          latitudeDelta: 4,
          longitudeDelta: 4,
        }}
      >
        {bases.map((base) => (
          <Marker
            key={base.id}
            coordinate={{
              latitude: base.coordinates?.lat || 42.7339,
              longitude: base.coordinates?.lng || 25.4858,
            }}
            title={base.name}
            description={`${base.city} - Capacity: ${base.capacity} tons`}
          />
        ))}
      </MapView>
    </View>
  );
};

export default BaseManagementFlow;