import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Star,
  MapPin,
  Weight,
  DollarSign,
  Calendar,
  Shield,
  Camera,
  X,
  ChevronDown,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

interface Product {
  id: string;
  name: string;
  category: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  currency: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'draft';
  qualityGrade: string;
  certifications: string[];
  images: number;
  rating: number;
  reviews: number;
  views: number;
  orders: number;
  location: string;
  harvestDate: string;
  expiryDate?: string;
  description: string;
  specifications: {
    moisture?: string;
    protein?: string;
    purity?: string;
    foreignMatter?: string;
  };
  storageConditions: string;
  minimumOrder: number;
  deliveryTime: string;
  featured: boolean;
}

export default function SellerProductsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const products: Product[] = [
    {
      id: 'P001',
      name: 'Premium Wheat',
      category: 'Grains',
      variety: 'Hard Red Winter',
      quantity: 150,
      unit: 'tons',
      pricePerUnit: 285,
      currency: 'USD',
      status: 'available',
      qualityGrade: 'Grade A',
      certifications: ['Organic', 'Non-GMO', 'ISO 22000'],
      images: 5,
      rating: 4.8,
      reviews: 24,
      views: 342,
      orders: 12,
      location: 'Iowa, USA',
      harvestDate: '2024-10-15',
      description: 'High-quality premium wheat suitable for bread making and export',
      specifications: {
        moisture: '12%',
        protein: '15%',
        purity: '98%',
        foreignMatter: '0.5%',
      },
      storageConditions: 'Climate Controlled',
      minimumOrder: 10,
      deliveryTime: '3-5 days',
      featured: true,
    },
    {
      id: 'P002',
      name: 'Corn Grain',
      category: 'Grains',
      variety: 'Yellow Dent',
      quantity: 25,
      unit: 'tons',
      pricePerUnit: 220,
      currency: 'USD',
      status: 'low_stock',
      qualityGrade: 'Grade A',
      certifications: ['Grade A', 'USDA Certified'],
      images: 3,
      rating: 4.6,
      reviews: 18,
      views: 256,
      orders: 8,
      location: 'Illinois, USA',
      harvestDate: '2024-09-28',
      description: 'Premium yellow corn ideal for animal feed and industrial use',
      specifications: {
        moisture: '14%',
        protein: '8%',
        purity: '96%',
        foreignMatter: '1%',
      },
      storageConditions: 'Standard',
      minimumOrder: 15,
      deliveryTime: '2-4 days',
      featured: false,
    },
    {
      id: 'P003',
      name: 'Soybeans',
      category: 'Legumes',
      variety: 'Non-GMO',
      quantity: 100,
      unit: 'tons',
      pricePerUnit: 375,
      currency: 'USD',
      status: 'available',
      qualityGrade: 'Premium',
      certifications: ['Organic', 'Non-GMO', 'Fair Trade'],
      images: 4,
      rating: 4.9,
      reviews: 31,
      views: 428,
      orders: 15,
      location: 'Indiana, USA',
      harvestDate: '2024-11-05',
      description: 'Premium non-GMO soybeans perfect for food processing',
      specifications: {
        moisture: '13%',
        protein: '18%',
        purity: '99%',
        foreignMatter: '0.3%',
      },
      storageConditions: 'Climate Controlled',
      minimumOrder: 20,
      deliveryTime: '3-5 days',
      featured: true,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Products', count: products.length },
    { id: 'grains', name: 'Grains', count: 2 },
    { id: 'legumes', name: 'Legumes', count: 1 },
    { id: 'vegetables', name: 'Vegetables', count: 0 },
    { id: 'fruits', name: 'Fruits', count: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#22c55e';
      case 'low_stock':
        return '#f59e0b';
      case 'out_of_stock':
        return '#ef4444';
      case 'draft':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => console.log('Delete product:', productId)
        },
      ]
    );
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card variant="dark" className="mb-4 bg-neutral-900 border-neutral-700">
      <CardContent className="p-4">
        {/* Product Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-lg font-semibold text-white">{product.name}</Text>
              {product.featured && (
                <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                  <Text className="text-amber-400 text-xs">Featured</Text>
                </View>
              )}
            </View>
            <Text className="text-neutral-400 text-sm">{product.variety} • {product.category}</Text>
          </View>
          <View 
            className="px-2 py-1 rounded"
            style={{ backgroundColor: `${getStatusColor(product.status)}20` }}
          >
            <Text 
              className="text-xs font-medium"
              style={{ color: getStatusColor(product.status) }}
            >
              {getStatusText(product.status)}
            </Text>
          </View>
        </View>

        {/* Product Metrics */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-neutral-800/50 p-2 rounded">
            <View className="flex-row items-center gap-1">
              <Weight color="#60a5fa" size={14} />
              <Text className="text-neutral-400 text-xs">Quantity</Text>
            </View>
            <Text className="text-white font-semibold">{product.quantity} {product.unit}</Text>
          </View>
          <View className="flex-1 bg-neutral-800/50 p-2 rounded">
            <View className="flex-row items-center gap-1">
              <DollarSign color="#22c55e" size={14} />
              <Text className="text-neutral-400 text-xs">Price</Text>
            </View>
            <Text className="text-white font-semibold">${product.pricePerUnit}/{product.unit}</Text>
          </View>
          <View className="flex-1 bg-neutral-800/50 p-2 rounded">
            <View className="flex-row items-center gap-1">
              <Package color="#8b5cf6" size={14} />
              <Text className="text-neutral-400 text-xs">Orders</Text>
            </View>
            <Text className="text-white font-semibold">{product.orders} active</Text>
          </View>
        </View>

        {/* Quality & Certifications */}
        <View className="mb-3">
          <View className="flex-row items-center gap-2 mb-2">
            <Shield color="#22c55e" size={14} />
            <Text className="text-neutral-400 text-sm">Quality: {product.qualityGrade}</Text>
          </View>
          <View className="flex-row flex-wrap gap-1">
            {product.certifications.map((cert, index) => (
              <View key={index} className="bg-green-500/20 px-2 py-1 rounded">
                <Text className="text-green-400 text-xs">{cert}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row items-center gap-4 mb-3 pb-3 border-b border-neutral-800">
          <View className="flex-row items-center gap-1">
            <Star color="#f59e0b" size={14} />
            <Text className="text-white text-sm">{product.rating}</Text>
            <Text className="text-neutral-400 text-xs">({product.reviews})</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Eye color="#60a5fa" size={14} />
            <Text className="text-neutral-400 text-sm">{product.views} views</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin color="#9ca3af" size={14} />
            <Text className="text-neutral-400 text-sm">{product.location}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity 
            className="flex-1 bg-blue-500 py-2 rounded items-center"
            onPress={() => setSelectedProduct(product)}
          >
            <Text className="text-white text-sm font-medium">View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-3 py-2 bg-neutral-800 rounded items-center justify-center">
            <Edit2 color="#ffffff" size={16} />
          </TouchableOpacity>
          <TouchableOpacity 
            className="px-3 py-2 bg-neutral-800 rounded items-center justify-center"
            onPress={() => handleDeleteProduct(product.id)}
          >
            <Trash2 color="#ef4444" size={16} />
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-white">Products</Text>
            <Text className="text-neutral-400">Manage your inventory</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddProduct(true)}
            className="bg-green-500 px-4 py-2 rounded-lg flex-row items-center gap-2"
          >
            <Plus color="#ffffff" size={16} />
            <Text className="text-white font-medium">Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 flex-row items-center gap-3 mb-4">
          <Search color="#9ca3af" size={20} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white"
          />
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Filter color="#60a5fa" size={20} />
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className={`mr-3 px-4 py-2 rounded-lg ${
                selectedCategory === category.id ? 'bg-blue-500' : 'bg-neutral-800'
              }`}
            >
              <Text className={`${
                selectedCategory === category.id ? 'text-white' : 'text-neutral-400'
              } font-medium`}>
                {category.name} ({category.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Overview */}
        <View className="flex-row gap-3">
          <Card variant="dark" className="flex-1 bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <Text className="text-neutral-400 text-xs mb-1">Total Products</Text>
              <Text className="text-white text-xl font-bold">{products.length}</Text>
            </CardContent>
          </Card>
          <Card variant="dark" className="flex-1 bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <Text className="text-neutral-400 text-xs mb-1">Total Value</Text>
              <Text className="text-white text-xl font-bold">$124.5k</Text>
            </CardContent>
          </Card>
          <Card variant="dark" className="flex-1 bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <Text className="text-neutral-400 text-xs mb-1">Active Orders</Text>
              <Text className="text-white text-xl font-bold">35</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Products List */}
      <ScrollView className="px-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>

      {/* Add Product Modal */}
      <Modal
        visible={showAddProduct}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddProduct(false)}
      >
        <View className="flex-1 bg-black/80">
          <View className="flex-1 bg-neutral-900 mt-20 rounded-t-3xl">
            <View className="px-6 py-4 border-b border-neutral-700">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-semibold text-white">Add New Product</Text>
                <TouchableOpacity onPress={() => setShowAddProduct(false)}>
                  <X color="#9ca3af" size={24} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView className="px-6 py-4">
              <View className="space-y-4">
                {/* Basic Information */}
                <View>
                  <Text className="text-white font-medium mb-3">Basic Information</Text>
                  <View className="space-y-3">
                    <View>
                      <Text className="text-neutral-400 text-sm mb-2">Product Name</Text>
                      <Input 
                        placeholder="e.g., Premium Wheat"
                        className="bg-neutral-800 border-neutral-600 text-white"
                        placeholderTextColor="#6b7280"
                      />
                    </View>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="text-neutral-400 text-sm mb-2">Category</Text>
                        <TouchableOpacity className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 flex-row justify-between items-center">
                          <Text className="text-white">Select Category</Text>
                          <ChevronDown color="#9ca3af" size={16} />
                        </TouchableOpacity>
                      </View>
                      <View className="flex-1">
                        <Text className="text-neutral-400 text-sm mb-2">Variety</Text>
                        <Input 
                          placeholder="e.g., Hard Red Winter"
                          className="bg-neutral-800 border-neutral-600 text-white"
                          placeholderTextColor="#6b7280"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Quantity & Pricing */}
                <View>
                  <Text className="text-white font-medium mb-3">Quantity & Pricing</Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-neutral-400 text-sm mb-2">Quantity</Text>
                      <Input 
                        placeholder="150"
                        keyboardType="numeric"
                        className="bg-neutral-800 border-neutral-600 text-white"
                        placeholderTextColor="#6b7280"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-neutral-400 text-sm mb-2">Unit</Text>
                      <TouchableOpacity className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 flex-row justify-between items-center">
                        <Text className="text-white">tons</Text>
                        <ChevronDown color="#9ca3af" size={16} />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                      <Text className="text-neutral-400 text-sm mb-2">Price/Unit</Text>
                      <Input 
                        placeholder="285"
                        keyboardType="numeric"
                        className="bg-neutral-800 border-neutral-600 text-white"
                        placeholderTextColor="#6b7280"
                      />
                    </View>
                  </View>
                </View>

                {/* Quality Specifications */}
                <View>
                  <Text className="text-white font-medium mb-3">Quality Specifications</Text>
                  <View className="space-y-3">
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="text-neutral-400 text-sm mb-2">Moisture (%)</Text>
                        <Input 
                          placeholder="12"
                          keyboardType="numeric"
                          className="bg-neutral-800 border-neutral-600 text-white"
                          placeholderTextColor="#6b7280"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-neutral-400 text-sm mb-2">Protein (%)</Text>
                        <Input 
                          placeholder="15"
                          keyboardType="numeric"
                          className="bg-neutral-800 border-neutral-600 text-white"
                          placeholderTextColor="#6b7280"
                        />
                      </View>
                    </View>
                    <View>
                      <Text className="text-neutral-400 text-sm mb-2">Quality Grade</Text>
                      <TouchableOpacity className="bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-3 flex-row justify-between items-center">
                        <Text className="text-white">Select Grade</Text>
                        <ChevronDown color="#9ca3af" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Images */}
                <View>
                  <Text className="text-white font-medium mb-3">Product Images</Text>
                  <TouchableOpacity className="bg-neutral-800 border border-dashed border-neutral-600 rounded-lg p-6 items-center">
                    <Upload color="#60a5fa" size={32} />
                    <Text className="text-neutral-400 mt-2">Upload Images</Text>
                    <Text className="text-neutral-500 text-xs mt-1">PNG, JPG up to 5MB</Text>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 pt-4">
                  <TouchableOpacity 
                    onPress={() => setShowAddProduct(false)}
                    className="flex-1 border border-neutral-600 py-3 rounded-lg items-center"
                  >
                    <Text className="text-neutral-300 font-medium">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowAddProduct(false)}
                    className="flex-1 bg-green-500 py-3 rounded-lg items-center"
                  >
                    <Text className="text-white font-medium">Add Product</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Details Modal */}
      {selectedProduct && (
        <Modal
          visible={!!selectedProduct}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedProduct(null)}
        >
          <View className="flex-1 bg-black/80">
            <View className="flex-1 bg-neutral-900 mt-20 rounded-t-3xl">
              <View className="px-6 py-4 border-b border-neutral-700">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-semibold text-white">Product Details</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <X color="#9ca3af" size={24} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <ScrollView className="px-6 py-4">
                <View className="space-y-4">
                  {/* Product Header */}
                  <View>
                    <Text className="text-2xl font-bold text-white">{selectedProduct.name}</Text>
                    <Text className="text-neutral-400">{selectedProduct.variety}</Text>
                  </View>

                  {/* Key Metrics */}
                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-neutral-800 p-3 rounded-lg">
                      <Text className="text-neutral-400 text-xs mb-1">Stock</Text>
                      <Text className="text-white font-bold text-lg">
                        {selectedProduct.quantity} {selectedProduct.unit}
                      </Text>
                    </View>
                    <View className="flex-1 bg-neutral-800 p-3 rounded-lg">
                      <Text className="text-neutral-400 text-xs mb-1">Price</Text>
                      <Text className="text-white font-bold text-lg">
                        ${selectedProduct.pricePerUnit}/{selectedProduct.unit}
                      </Text>
                    </View>
                    <View className="flex-1 bg-neutral-800 p-3 rounded-lg">
                      <Text className="text-neutral-400 text-xs mb-1">Orders</Text>
                      <Text className="text-white font-bold text-lg">{selectedProduct.orders}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View>
                    <Text className="text-white font-medium mb-2">Description</Text>
                    <Text className="text-neutral-300">{selectedProduct.description}</Text>
                  </View>

                  {/* Specifications */}
                  <View>
                    <Text className="text-white font-medium mb-3">Specifications</Text>
                    <View className="bg-neutral-800 rounded-lg p-4 space-y-2">
                      {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                        <View key={key} className="flex-row justify-between">
                          <Text className="text-neutral-400 capitalize">{key}</Text>
                          <Text className="text-white">{value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Certifications */}
                  <View>
                    <Text className="text-white font-medium mb-3">Certifications</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedProduct.certifications.map((cert, index) => (
                        <View key={index} className="bg-green-500/20 px-3 py-2 rounded-lg flex-row items-center gap-2">
                          <CheckCircle color="#22c55e" size={16} />
                          <Text className="text-green-400">{cert}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Additional Info */}
                  <View>
                    <Text className="text-white font-medium mb-3">Additional Information</Text>
                    <View className="space-y-2">
                      <View className="flex-row justify-between">
                        <Text className="text-neutral-400">Storage Conditions</Text>
                        <Text className="text-white">{selectedProduct.storageConditions}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-neutral-400">Minimum Order</Text>
                        <Text className="text-white">{selectedProduct.minimumOrder} {selectedProduct.unit}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-neutral-400">Delivery Time</Text>
                        <Text className="text-white">{selectedProduct.deliveryTime}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-neutral-400">Harvest Date</Text>
                        <Text className="text-white">{new Date(selectedProduct.harvestDate).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}