import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { useAuthStore } from '../../../stores/auth.store';

interface PricingZone {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  displayName: string;
  category: string;
}

interface PriceUpdate {
  productId: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  unit: string;
  qualityGrade: string;
}

export default function BulkPriceUpdateScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [zones, setZones] = useState<PricingZone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [priceUpdates, setPriceUpdates] = useState<Record<string, PriceUpdate>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [priceMultiplier, setPriceMultiplier] = useState('');

  useEffect(() => {
    fetchZonesAndProducts();
  }, []);

  const fetchZonesAndProducts = async () => {
    try {
      setLoading(true);
      const [zonesRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/pricing-zones`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/products/catalog`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setZones(zonesRes.data.data);
      setProducts(productsRes.data.data || []);

      // Initialize price updates for all products
      const initialPrices: Record<string, PriceUpdate> = {};
      productsRes.data.data?.forEach((product: Product) => {
        initialPrices[product.id] = {
          productId: product.id,
          minPrice: '',
          maxPrice: '',
          currency: 'EUR',
          unit: 'TON',
          qualityGrade: 'Standard',
        };
      });
      setPriceUpdates(initialPrices);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load zones and products');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyMultiplier = () => {
    if (!priceMultiplier) return;

    const multiplier = parseFloat(priceMultiplier);
    if (isNaN(multiplier)) {
      Alert.alert('Error', 'Invalid multiplier value');
      return;
    }

    const updatedPrices = { ...priceUpdates };
    Object.keys(updatedPrices).forEach((productId) => {
      const current = updatedPrices[productId];
      if (current.minPrice) {
        updatedPrices[productId].minPrice = (parseFloat(current.minPrice) * multiplier).toFixed(2);
      }
      if (current.maxPrice) {
        updatedPrices[productId].maxPrice = (parseFloat(current.maxPrice) * multiplier).toFixed(2);
      }
    });
    setPriceUpdates(updatedPrices);
  };

  const handleSavePrices = async () => {
    if (!selectedZone) {
      Alert.alert('Error', 'Please select a pricing zone');
      return;
    }

    const pricesToSubmit = Object.values(priceUpdates).filter((p) => p.minPrice && p.maxPrice);

    if (pricesToSubmit.length === 0) {
      Alert.alert('Error', 'Please enter at least one price');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.put(
        `${API_URL}/admin/pricing-zones/${selectedZone}/bulk-update-prices`,
        {
          prices: pricesToSubmit.map((p) => ({
            ...p,
            minPrice: parseFloat(p.minPrice),
            maxPrice: parseFloat(p.maxPrice),
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert(
        'Success',
        `Updated prices for ${pricesToSubmit.length} products in ${zones.find((z) => z.id === selectedZone)?.name}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to update prices:', error);
      Alert.alert('Error', 'Failed to update prices');
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (productId: string, field: 'minPrice' | 'maxPrice', value: string) => {
    setPriceUpdates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-4">Loading products...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 border-b border-gray-800">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white flex-1">Bulk Price Update</Text>
        </View>

        {/* Zone Selection */}
        <View className="mb-4">
          <Text className="text-gray-400 text-sm mb-2">Select Pricing Zone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {zones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                onPress={() => setSelectedZone(zone.id)}
                className={`px-4 py-2 rounded-lg mr-2 ${
                  selectedZone === zone.id ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <Text className={selectedZone === zone.id ? 'text-white' : 'text-gray-400'}>
                  {zone.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bulk Actions */}
        <View className="flex-row items-center space-x-4">
          <View className="flex-1 flex-row items-center bg-gray-800 rounded-lg px-3 py-2">
            <Text className="text-gray-400 mr-2">Multiplier:</Text>
            <TextInput
              className="flex-1 text-white"
              placeholder="1.1 (10% increase)"
              placeholderTextColor="#6B7280"
              value={priceMultiplier}
              onChangeText={setPriceMultiplier}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity
            onPress={handleApplyMultiplier}
            className="bg-yellow-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Apply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <ScrollView className="flex-1 px-6 py-4">
        <Text className="text-gray-400 text-sm mb-4">
          Enter new prices for products (leave blank to skip)
        </Text>

        {products.map((product) => (
          <View key={product.id} className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700">
            <Text className="text-white font-medium mb-3">{product.displayName}</Text>
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-400 text-xs mb-1">Min Price (€)</Text>
                <TextInput
                  className="bg-gray-700 text-white rounded-lg px-3 py-2"
                  placeholder="0.00"
                  placeholderTextColor="#6B7280"
                  value={priceUpdates[product.id]?.minPrice || ''}
                  onChangeText={(value) => handlePriceChange(product.id, 'minPrice', value)}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs mb-1">Max Price (€)</Text>
                <TextInput
                  className="bg-gray-700 text-white rounded-lg px-3 py-2"
                  placeholder="0.00"
                  placeholderTextColor="#6B7280"
                  value={priceUpdates[product.id]?.maxPrice || ''}
                  onChangeText={(value) => handlePriceChange(product.id, 'maxPrice', value)}
                  keyboardType="numeric"
                />
              </View>
              <View className="justify-end">
                <TouchableOpacity className="bg-gray-700 rounded-lg px-3 py-2">
                  <Text className="text-gray-400">per ton</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-gray-500 text-xs mt-2">Category: {product.category}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Save Button */}
      <View className="px-6 py-4 border-t border-gray-800">
        <TouchableOpacity
          onPress={handleSavePrices}
          disabled={saving || !selectedZone}
          className={`py-3 rounded-lg ${saving || !selectedZone ? 'bg-gray-700' : 'bg-blue-600'}`}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-medium">Save All Prices</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
