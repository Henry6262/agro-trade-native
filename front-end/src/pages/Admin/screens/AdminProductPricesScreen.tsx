import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../../shared/components';
import { apiClient } from '@services/api';
import { Picker } from '@react-native-picker/picker';

type AdminNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PricingZone {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  displayName: string;
  category: string;
}

interface ProductPrice {
  id: string;
  productId: string;
  pricingZoneId: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  unit: string;
  qualityGrade?: string;
  effectiveDate: string;
  expiresDate?: string;
  product: {
    id: string;
    displayName: string;
    category: string;
  };
  pricingZone: {
    id: string;
    name: string;
    color?: string;
  };
}

interface NewPriceForm {
  productId: string;
  pricingZoneId: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  unit: string;
  qualityGrade: string;
  effectiveDate: string;
  expiresDate: string;
}

export function AdminProductPricesScreen() {
  const navigation = useNavigation<AdminNavigationProp>();
  const [pricingZones, setPricingZones] = useState<PricingZone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newPrice, setNewPrice] = useState<NewPriceForm>({
    productId: '',
    pricingZoneId: '',
    minPrice: '',
    maxPrice: '',
    currency: 'BGN',
    unit: 'TON',
    qualityGrade: 'Standard',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiresDate: '',
  });

  const currencies = ['BGN', 'EUR', 'USD'];
  const units = ['TON', 'KG'];
  const qualityGrades = ['Standard', 'Premium', 'Grade A', 'Grade B', 'Feed Grade'];
  const categories = [
    'WHEAT',
    'CORN',
    'SUNFLOWER',
    'BARLEY',
    'OATS',
    'RAPESEED',
    'PEAS',
    'SOYBEAN_MEAL',
    'WHEAT_BRAN',
    'ALFALFA',
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedZone === 'all') {
      fetchAllProductPrices();
    } else {
      fetchProductPricesForZone(selectedZone);
    }
  }, [selectedZone]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [zonesResponse, productsResponse] = await Promise.all([
        apiClient.get('/admin/pricing-zones'),
        apiClient.get('/products'),
      ]);

      setPricingZones(zonesResponse.data.data.filter((zone: PricingZone) => zone.isActive));
      setProducts(productsResponse.data.data);

      await fetchAllProductPrices();
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllProductPrices = async () => {
    try {
      // Fetch prices for all zones
      const promises = pricingZones.map((zone) =>
        apiClient.get(`/admin/pricing-zones/${zone.id}/product-prices`)
      );
      const responses = await Promise.all(promises);
      const allPrices = responses.flatMap((response) => response.data.data);
      setProductPrices(allPrices);
    } catch (error) {
      console.error('Failed to fetch product prices:', error);
    }
  };

  const fetchProductPricesForZone = async (zoneId: string) => {
    try {
      const response = await apiClient.get(`/admin/pricing-zones/${zoneId}/product-prices`);
      setProductPrices(response.data.data);
    } catch (error) {
      console.error('Failed to fetch product prices for zone:', error);
    }
  };

  const createProductPrice = async () => {
    if (
      !newPrice.productId ||
      !newPrice.pricingZoneId ||
      !newPrice.minPrice ||
      !newPrice.maxPrice
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const minPrice = parseFloat(newPrice.minPrice);
    const maxPrice = parseFloat(newPrice.maxPrice);

    if (isNaN(minPrice) || isNaN(maxPrice)) {
      Alert.alert('Error', 'Please enter valid prices');
      return;
    }

    if (minPrice >= maxPrice) {
      Alert.alert('Error', 'Minimum price must be less than maximum price');
      return;
    }

    try {
      setIsCreating(true);
      const priceData = {
        productId: newPrice.productId,
        pricingZoneId: newPrice.pricingZoneId,
        minPrice,
        maxPrice,
        currency: newPrice.currency,
        unit: newPrice.unit,
        qualityGrade: newPrice.qualityGrade,
        effectiveDate: new Date(newPrice.effectiveDate),
        expiresDate: newPrice.expiresDate ? new Date(newPrice.expiresDate) : undefined,
      };

      const response = await apiClient.post('/admin/product-prices', priceData);
      setProductPrices([...productPrices, response.data.data]);

      // Reset form
      setNewPrice({
        productId: '',
        pricingZoneId: '',
        minPrice: '',
        maxPrice: '',
        currency: 'BGN',
        unit: 'TON',
        qualityGrade: 'Standard',
        effectiveDate: new Date().toISOString().split('T')[0],
        expiresDate: '',
      });

      setShowCreateModal(false);
      Alert.alert('Success', 'Product price created successfully');
    } catch (error: any) {
      console.error('Failed to create product price:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create product price');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProductPrice = async (priceId: string) => {
    Alert.alert('Delete Price', 'Are you sure you want to delete this product price?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/admin/product-prices/${priceId}`);
            setProductPrices(productPrices.filter((price) => price.id !== priceId));
            Alert.alert('Success', 'Product price deleted successfully');
          } catch (error: any) {
            console.error('Failed to delete product price:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete product price');
          }
        },
      },
    ]);
  };

  const filteredPrices = productPrices.filter((price) => {
    const matchesSearch =
      price.product.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      price.pricingZone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || price.product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPrices = filteredPrices.reduce(
    (acc, price) => {
      const key = `${price.product.displayName}-${price.pricingZone.name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(price);
      return acc;
    },
    {} as Record<string, ProductPrice[]>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <LoadingSpinner />
        <Text className="text-gray-900 mt-4">Loading product prices...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <Text className="text-gray-900 text-xl font-semibold">Product Pricing</Text>
            <Text className="text-gray-400 text-sm">Manage product prices by zone</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-medium ml-1">Add Price</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View className="px-6 py-4 space-y-4">
          {/* Search Bar */}
          <View className="bg-white rounded-lg flex-row items-center px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search products or zones..."
              placeholderTextColor="#6B7280"
              className="flex-1 ml-3 text-gray-900"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Row */}
          <View className="flex-row space-x-4">
            {/* Zone Filter */}
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">Zone</Text>
              <View className="bg-white rounded-lg">
                <Picker
                  selectedValue={selectedZone}
                  onValueChange={setSelectedZone}
                  style={{ color: 'white' }}
                  dropdownIconColor="white"
                >
                  <Picker.Item label="All Zones" value="all" />
                  {pricingZones.map((zone) => (
                    <Picker.Item key={zone.id} label={zone.name} value={zone.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Category Filter */}
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-2">Category</Text>
              <View className="bg-white rounded-lg">
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={setSelectedCategory}
                  style={{ color: 'white' }}
                  dropdownIconColor="white"
                >
                  <Picker.Item label="All Categories" value="all" />
                  {categories.map((category) => (
                    <Picker.Item key={category} label={category} value={category} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Prices List */}
        <ScrollView className="flex-1 px-6">
          {Object.entries(groupedPrices).map(([key, prices]) => (
            <View key={key} className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              {/* Product Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-lg">
                    {prices[0].product.displayName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className="bg-gray-700 rounded-full px-2 py-1 mr-2">
                      <Text className="text-gray-600 text-xs">{prices[0].product.category}</Text>
                    </View>
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: prices[0].pricingZone.color || '#3B82F6' }}
                    />
                    <Text className="text-gray-400 text-sm">{prices[0].pricingZone.name}</Text>
                  </View>
                </View>
              </View>

              {/* Price Variations */}
              {prices.map((price) => (
                <View key={price.id} className="bg-gray-700 rounded-lg p-3 mb-2">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <View className="flex-row items-center space-x-4">
                        <Text className="text-gray-900 font-medium">
                          {price.currency} {price.minPrice} - {price.maxPrice}
                        </Text>
                        <Text className="text-gray-400 text-sm">per {price.unit}</Text>
                        <View className="bg-blue-900 rounded-full px-2 py-1">
                          <Text className="text-blue-300 text-xs">
                            {price.qualityGrade || 'Standard'}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-gray-500 text-xs">
                          Effective: {new Date(price.effectiveDate).toLocaleDateString()}
                        </Text>
                        {price.expiresDate && (
                          <Text className="text-gray-500 text-xs ml-4">
                            Expires: {new Date(price.expiresDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => deleteProductPrice(price.id)} className="p-2">
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {Object.keys(groupedPrices).length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="pricetag-outline" size={64} color="#4B5563" />
              <Text className="text-gray-400 text-lg mt-4">
                {searchTerm ? 'No prices found' : 'No product prices yet'}
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                {searchTerm
                  ? 'Try adjusting your search terms or filters'
                  : 'Create your first product price to get started'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Create Price Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-white/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 font-semibold text-xl">Add Product Price</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-96">
              <View className="space-y-4">
                {/* Product Selection */}
                <View>
                  <Text className="text-gray-600 text-sm mb-2">Product *</Text>
                  <View className="bg-gray-700 rounded-lg">
                    <Picker
                      selectedValue={newPrice.productId}
                      onValueChange={(value) => setNewPrice({ ...newPrice, productId: value })}
                      style={{ color: 'white' }}
                      dropdownIconColor="white"
                    >
                      <Picker.Item label="Select Product" value="" />
                      {products.map((product) => (
                        <Picker.Item
                          key={product.id}
                          label={product.displayName}
                          value={product.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Zone Selection */}
                <View>
                  <Text className="text-gray-600 text-sm mb-2">Pricing Zone *</Text>
                  <View className="bg-gray-700 rounded-lg">
                    <Picker
                      selectedValue={newPrice.pricingZoneId}
                      onValueChange={(value) => setNewPrice({ ...newPrice, pricingZoneId: value })}
                      style={{ color: 'white' }}
                      dropdownIconColor="white"
                    >
                      <Picker.Item label="Select Zone" value="" />
                      {pricingZones.map((zone) => (
                        <Picker.Item key={zone.id} label={zone.name} value={zone.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Price Range */}
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">Min Price *</Text>
                    <TextInput
                      value={newPrice.minPrice}
                      onChangeText={(text) => setNewPrice({ ...newPrice, minPrice: text })}
                      placeholder="0.00"
                      placeholderTextColor="#6B7280"
                      className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">Max Price *</Text>
                    <TextInput
                      value={newPrice.maxPrice}
                      onChangeText={(text) => setNewPrice({ ...newPrice, maxPrice: text })}
                      placeholder="0.00"
                      placeholderTextColor="#6B7280"
                      className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Currency & Unit */}
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">Currency</Text>
                    <View className="bg-gray-700 rounded-lg">
                      <Picker
                        selectedValue={newPrice.currency}
                        onValueChange={(value) => setNewPrice({ ...newPrice, currency: value })}
                        style={{ color: 'white' }}
                        dropdownIconColor="white"
                      >
                        {currencies.map((currency) => (
                          <Picker.Item key={currency} label={currency} value={currency} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">Unit</Text>
                    <View className="bg-gray-700 rounded-lg">
                      <Picker
                        selectedValue={newPrice.unit}
                        onValueChange={(value) => setNewPrice({ ...newPrice, unit: value })}
                        style={{ color: 'white' }}
                        dropdownIconColor="white"
                      >
                        {units.map((unit) => (
                          <Picker.Item key={unit} label={unit} value={unit} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                {/* Quality Grade */}
                <View>
                  <Text className="text-gray-600 text-sm mb-2">Quality Grade</Text>
                  <View className="bg-gray-700 rounded-lg">
                    <Picker
                      selectedValue={newPrice.qualityGrade}
                      onValueChange={(value) => setNewPrice({ ...newPrice, qualityGrade: value })}
                      style={{ color: 'white' }}
                      dropdownIconColor="white"
                    >
                      {qualityGrades.map((grade) => (
                        <Picker.Item key={grade} label={grade} value={grade} />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Dates */}
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">Effective Date</Text>
                    <TextInput
                      value={newPrice.effectiveDate}
                      onChangeText={(text) => setNewPrice({ ...newPrice, effectiveDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6B7280"
                      className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-2">Expires Date (Optional)</Text>
                    <TextInput
                      value={newPrice.expiresDate}
                      onChangeText={(text) => setNewPrice({ ...newPrice, expiresDate: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6B7280"
                      className="bg-gray-700 rounded-lg px-3 py-3 text-gray-900"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-700 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createProductPrice}
                disabled={isCreating}
                className="flex-1 bg-green-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-medium">
                  {isCreating ? 'Creating...' : 'Create Price'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
