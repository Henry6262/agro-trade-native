import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Plus,
  Edit,
  MapPin,
  Weight,
  DollarSign,
  Package,
  ChevronDown,
  X,
  Shield,
  ShieldCheck,
  Wheat,
  Bean,
  Apple,
  Carrot,
  Milk,
  Egg,
  Building2,
  TrendingUp,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';
import { LoadingSpinner } from '../../../../shared/components/LoadingSpinner';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { useUserData } from '../../../../contexts/UserDataContext';
import { ProductSelectionDrawer } from '../../../../shared/components/ProductSelectionDrawer';
import { ProductSpecificationDrawer } from '../../../../shared/components/ProductSpecificationDrawer';
import { LocationConfirmationDrawer } from '../../../../shared/components/LocationConfirmationDrawer';
import { ProductEditDrawer } from '../../../../shared/components/ProductEditDrawer';
import { apiClient } from '../../../../services/api';
import { useProductStore } from '../../../../stores/product.store';

interface SellerProductsTabProps {
  id?: string;
}

export default function SellerProductsTab({ id }: SellerProductsTabProps = {}) {
  const navigation = useNavigation();
  const { 
    sellerProducts, 
    isLoadingProducts, 
    productsError, 
    refreshProducts,
    createProduct,
    updateProduct,
    deleteProduct 
  } = useUserData();
  
  const productMetadata = useProductStore((state) => state.products) || [];
  const fetchProductMetadata = useProductStore((state) => state.fetchAllData);
  
  // Fetch product metadata on mount to ensure price ranges are available
  useEffect(() => {
    if (productMetadata.length === 0) {
      fetchProductMetadata().catch(console.error);
    }
  }, []);
  
  // Three-step add product flow states
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [showSpecifications, setShowSpecifications] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState<any>(null);
  const [productSpecs, setProductSpecs] = useState<any>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  
  // Edit product states
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedQualityTags, setSelectedQualityTags] = useState<string[]>([]);
  const [showProductPopover, setShowProductPopover] = useState(false);

  const productDatabase = {
    'Grains & Cereals': [
      { id: 'wheat', name: 'Wheat', icon: Wheat },
      { id: 'corn', name: 'Corn', icon: Package },
      { id: 'rice', name: 'Rice', icon: Package },
      { id: 'barley', name: 'Barley', icon: Wheat },
      { id: 'oats', name: 'Oats', icon: Package },
    ],
    Legumes: [
      { id: 'soybeans', name: 'Soybeans', icon: Bean },
      { id: 'lentils', name: 'Lentils', icon: Bean },
      { id: 'chickpeas', name: 'Chickpeas', icon: Bean },
      { id: 'peas', name: 'Peas', icon: Bean },
    ],
    Fruits: [
      { id: 'apples', name: 'Apples', icon: Apple },
      { id: 'oranges', name: 'Oranges', icon: Apple },
      { id: 'bananas', name: 'Bananas', icon: Apple },
      { id: 'grapes', name: 'Grapes', icon: Apple },
    ],
    Vegetables: [
      { id: 'carrots', name: 'Carrots', icon: Carrot },
      { id: 'potatoes', name: 'Potatoes', icon: Package },
      { id: 'onions', name: 'Onions', icon: Package },
      { id: 'tomatoes', name: 'Tomatoes', icon: Apple },
    ],
    'Dairy & Livestock': [
      { id: 'milk', name: 'Milk', icon: Milk },
      { id: 'eggs', name: 'Eggs', icon: Egg },
      { id: 'beef', name: 'Beef', icon: Package },
      { id: 'pork', name: 'Pork', icon: Package },
    ],
  };

  const qualityTagsDatabase = [
    'Organic',
    'Non-GMO',
    'Protein 14%',
    'Protein 15%',
    'Protein 16%',
    'Protein 18%',
    'Grade A',
    'Grade B',
    'Moisture 12%',
    'Moisture 15%',
    'Fair Trade',
    'Pesticide Free',
    'Gluten Free',
    'Kosher',
    'Halal',
  ];

  // Get product image from metadata or use fallback
  const getProductImage = (productName: string, category: string) => {
    // Try to find product in metadata
    const metaProduct = productMetadata?.find?.(
      p => p.name === productName || p.displayName === productName || p.category === category
    );
    
    if (metaProduct?.image) {
      return metaProduct.image;
    }
    
    // Fallback image based on category
    const categoryImages: Record<string, string> = {
      'SOFT_WHEAT': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
      'HARD_WHEAT': 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400',
      'CORN': 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400',
      'SOYBEANS': 'https://images.unsplash.com/photo-1639843906836-85fc9fa11584?w=400',
      'RICE': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    };
    
    return categoryImages[category] || 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Product';
  };

  // Format location for display
  const formatLocation = (location: any) => {
    if (!location) return 'Location not set';
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    return parts.join(', ') || 'Location not set';
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const handleOldProductSelect = (product: any) => {
    setSelectedProduct(product);
    setShowProductPopover(false);
  };

  const toggleQualityTag = (tag: string) => {
    setSelectedQualityTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const removeQualityTag = (tag: string) => {
    setSelectedQualityTags((prev) => prev.filter((t) => t !== tag));
  };
  
  // Three-step flow handlers
  const handleProductSelect = (productId: string, productData: any) => {
    setSelectedProductData(productData);
    setShowProductSelection(false);
    setShowSpecifications(true);
  };
  
  const handleSpecificationsSave = (specs: any) => {
    setProductSpecs(specs);
    setShowSpecifications(false);
    setShowLocationConfirm(true);
  };
  
  const handleLocationConfirm = async (location: any) => {
    try {
      setIsCreatingProduct(true);
      
      // Prepare the data for backend (no price)
      const createListingDto = {
        productId: selectedProductData.id,
        quantity: productSpecs.quantity,
        unit: productSpecs.unit || 'ton',
        specifications: productSpecs.specifications || {},
        location: {
          address: location.address,
          city: location.city,
          region: location.region || location.state,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        status: 'active',
        offerType: 'STANDARD',
      };
      
      // Send to backend
      const response = await apiClient.post('/seller/listings', createListingDto);
      
      if (response?.data?.success) {
        // Close all modals
        setShowLocationConfirm(false);
        setShowAddProduct(false);
        
        // Reset states
        setSelectedProductData(null);
        setProductSpecs(null);
        
        // Optimistic update - add the new product to the list (no price)
        const newProduct = {
          id: response.data.data.id,
          name: selectedProductData.name,
          category: selectedProductData.category,
          quantity: productSpecs.quantity,
          unit: productSpecs.unit || 'ton',
          location: location,
          // Include price range from metadata for display
          priceRangeMin: selectedProductData.priceRangeMin,
          priceRangeMax: selectedProductData.priceRangeMax,
          qualityTags: Object.entries(productSpecs.specifications || {})
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}: ${value}`),
          isVerified: false,
          views: 0,
          inquiries: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Refresh the products list
        await refreshProducts();
        
        Alert.alert('Success', 'Product listing created successfully!');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to create product listing'
      );
    } finally {
      setIsCreatingProduct(false);
    }
  };
  
  const startAddProductFlow = async () => {
    setShowAddProduct(false);
    
    // Ensure product metadata is loaded before showing selection
    if (!productMetadata || productMetadata.length === 0) {
      try {
        await fetchProductMetadata();
      } catch (error) {
        console.error('Error fetching product metadata:', error);
      }
    }
    
    setShowProductSelection(true);
  };
  
  const handleEditProduct = (product: any) => {
    // Get product image from metadata
    const metaProduct = productMetadata?.find?.(
      p => p.category === product.category || p.name === product.name
    );
    
    setEditingProduct({
      ...product,
      image: getProductImage(product.name, product.category),
      specifications: product.specifications || {},
    });
    setShowEditDrawer(true);
  };
  
  const handleUpdateProduct = async (updatedProduct: any) => {
    try {
      const response = await apiClient.put(`/seller/listings/${updatedProduct.id}`, {
        quantity: updatedProduct.quantity,
        unit: updatedProduct.unit || 'ton',
        location: updatedProduct.location,
        specifications: updatedProduct.specifications || {},
      });
      
      if (response?.data?.success) {
        await refreshProducts();
        Alert.alert('Success', 'Product updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update product');
    }
  };
  
  const handleDeleteProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const response = await apiClient.delete(`/seller/listings/${editingProduct.id}`);
      
      if (response?.data?.success) {
        await refreshProducts();
        Alert.alert('Success', 'Product deleted successfully!');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to delete product');
    }
  };

  const renderProductCard = ({ item }: { item: any }) => {
    const productImage = getProductImage(item.name, item.category);
    const locationStr = formatLocation(item.location);
    const timeAgo = formatTimeAgo(item.updatedAt);
    
    // Get price range from metadata
    const metaProduct = productMetadata?.find?.(
      p => p.id === item.productId || 
           p.category === item.category || 
           p.name === item.name || 
           p.displayName === item.name
    );
    
    const priceRangeMin = metaProduct?.priceRangeMin || item.priceRangeMin;
    const priceRangeMax = metaProduct?.priceRangeMax || item.priceRangeMax;
    
    return (
      <View className="mb-4">
        <Card className="bg-neutral-900 border-neutral-700 overflow-hidden">
          <View className="flex-row">
            {/* Smaller Product Image - Fixed width */}
            <View className="w-32 h-32 bg-neutral-800 relative">
              <Image
                source={{ uri: productImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
              
              {/* Status badges overlay */}
              <View className="absolute top-2 right-2">
                {item.isVerified ? (
                  <View className="bg-green-500/90 rounded-full p-1">
                    <ShieldCheck color="#ffffff" size={14} />
                  </View>
                ) : (
                  <View className="bg-neutral-600/90 rounded-full p-1">
                    <Shield color="#ffffff" size={14} />
                  </View>
                )}
              </View>
            </View>
            
            {/* Product Details - Flex to fill remaining width */}
            <View className="flex-1 p-4">
              {/* Product Name and Location */}
              <View className="mb-2">
                <Text className="text-white font-bold text-lg">{item.name}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <MapPin color="#9ca3af" size={12} />
                  <Text className="text-neutral-400 text-sm">{locationStr}</Text>
                </View>
              </View>

              {/* Quantity and Price in same row */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1">
                  <Weight color="#60a5fa" size={16} />
                  <Text className="text-white font-medium">{item.quantity} {item.unit || 'tons'}</Text>
                </View>
                
                {/* Market Price Range */}
                <View className="bg-neutral-800 rounded-lg px-2 py-1 flex-row items-center">
                  <TrendingUp color="#10b981" size={12} />
                  <Text className="text-xs text-green-400 ml-1">
                    {priceRangeMin && priceRangeMax ? 
                      `€${priceRangeMin}-${priceRangeMax}` : 
                      'Price TBD'}
                  </Text>
                </View>
              </View>

              {/* Quality Tags */}
              {item.qualityTags && item.qualityTags.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mb-2">
                  {item.qualityTags.slice(0, 4).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs border-green-400 text-green-300">
                      {tag}
                    </Badge>
                  ))}
                  {item.qualityTags.length > 4 && (
                    <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400">
                      +{item.qualityTags.length - 4}
                    </Badge>
                  )}
                </View>
              )}

              {/* Stats and Actions */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row gap-3">
                  <Text className="text-xs text-neutral-400">👁 {item.views || 0}</Text>
                  <Text className="text-xs text-neutral-400">💬 {item.inquiries || 0}</Text>
                  <Text className="text-xs text-neutral-500">{timeAgo}</Text>
                </View>
                
                <TouchableOpacity 
                  onPress={() => handleEditProduct(item)}
                  className="bg-neutral-800 rounded-full p-2"
                >
                  <Edit color="#9ca3af" size={14} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  // Show loading state
  if (isLoadingProducts && sellerProducts.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <LoadingSpinner message="Loading products..." />
      </View>
    );
  }

  // Show error state
  if (productsError && sellerProducts.length === 0) {
    return (
      <View className="flex-1 bg-black p-6">
        <ErrorState 
          message={productsError}
          onRetry={refreshProducts}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <FlatList
        data={sellerProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshProducts}
        refreshing={isLoadingProducts}
        ListHeaderComponent={() => (
          <View className="mb-6">
            {/* Header */}
            <View>
              {/* Title and Description */}
              <View className="mb-4">
                <Text className="text-2xl font-bold text-white">My Products</Text>
                <Text className="text-neutral-400 text-sm">
                  Manage your agricultural products and listings
                </Text>
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  onPress={() => navigation.navigate('BaseManagement' as any)}
                  className="bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded flex-row items-center gap-2"
                >
                  <Building2 color="#ffffff" size={16} />
                  <Text className="text-white">Manage Bases</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={startAddProductFlow}
                  className="bg-green-500 hover:bg-green-600 rounded-full p-3 shadow-lg"
                >
                  <Plus color="#ffffff" size={24} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center py-12">
            <Package color="#6b7280" size={64} />
            <Text className="text-neutral-400 text-lg mt-4">No products listed yet</Text>
            <TouchableOpacity
              onPress={startAddProductFlow}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-full mt-4"
            >
              <Text className="text-white">Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Three-step Add Product Flow - Only render when needed */}
      {showProductSelection && (
        <ProductSelectionDrawer
          visible={showProductSelection}
          onClose={() => setShowProductSelection(false)}
          onProductSelect={handleProductSelect}
          mode="single"
        />
      )}
      
      {showSpecifications && (
        <ProductSpecificationDrawer
          visible={showSpecifications}
          productData={selectedProductData}
          onClose={() => setShowSpecifications(false)}
          onSave={handleSpecificationsSave}
          onSkip={() => handleSpecificationsSave({
            quantity: 0,
            unit: selectedProductData?.defaultUnit || 'ton',
            specifications: {},
            productId: selectedProductData?.id,
            productName: selectedProductData?.name,
          })}
        />
      )}
      
      {showLocationConfirm && (
        <LocationConfirmationDrawer
          visible={showLocationConfirm}
          onClose={() => setShowLocationConfirm(false)}
          onConfirm={handleLocationConfirm}
        />
      )}
      
      {/* Edit Product Drawer */}
      {showEditDrawer && (
        <ProductEditDrawer
          visible={showEditDrawer}
          productData={editingProduct}
          onClose={() => {
            setShowEditDrawer(false);
            setEditingProduct(null);
          }}
          onSave={handleUpdateProduct}
          onDelete={handleDeleteProduct}
        />
      )}
      
      {/* Old Add Product Modal - keeping for reference, remove later */}
      {false && (
        <Modal
          visible={showAddProduct}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddProduct(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <Card className="bg-neutral-900 border-neutral-700 w-full max-w-lg max-h-5/6">
              <CardHeader>
                <CardTitle className="text-white">Add New Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View>
                    <Text className="text-neutral-300 mb-2">Product Type</Text>
                    <TouchableOpacity
                      onPress={() => setShowProductPopover(!showProductPopover)}
                      className="w-full bg-neutral-800 border-neutral-600 text-white border rounded p-3 flex-row justify-between items-center"
                    >
                      {selectedProduct ? (
                        <View className="flex-row items-center gap-2">
                          <selectedProduct.icon color="#ffffff" size={16} />
                          <Text className="text-white">{selectedProduct.name}</Text>
                        </View>
                      ) : (
                        <Text className="text-neutral-400">Select a product...</Text>
                      )}
                      <ChevronDown color="#ffffff" size={16} />
                    </TouchableOpacity>

                    {showProductPopover && (
                      <View className="mt-2 bg-neutral-800 border-neutral-600 border rounded max-h-80">
                        <ScrollView>
                          {Object.entries(productDatabase).map(([category, products]) => (
                            <View key={category}>
                              <View className="px-3 py-2 bg-neutral-700">
                                <Text className="text-sm font-medium text-neutral-300">
                                  {category}
                                </Text>
                              </View>
                              <View className="flex-row flex-wrap p-2">
                                {(products as any[]).map((product) => (
                                  <TouchableOpacity
                                    key={product.id}
                                    className="w-1/2 p-2 items-center gap-1 hover:bg-neutral-700"
                                    onPress={() => handleOldProductSelect(product)}
                                  >
                                    <product.icon color="#ffffff" size={24} />
                                    <Text className="text-xs text-white">{product.name}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                              <View className="h-px bg-neutral-600" />
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-neutral-300 mb-2">Quantity (tons)</Text>
                      <TextInput
                        className="bg-neutral-800 border-neutral-600 text-white border rounded p-3"
                        placeholder="50"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-neutral-300 mb-2">Price per ton ($)</Text>
                      <TextInput
                        className="bg-neutral-800 border-neutral-600 text-white border rounded p-3"
                        placeholder="220"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-neutral-300 mb-2">Location</Text>
                    <TextInput
                      className="bg-neutral-800 border-neutral-600 text-white border rounded p-3"
                      placeholder="Iowa, USA"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View>
                    <Text className="text-neutral-300 mb-2">Quality Tags</Text>
                    
                    {/* Selected Tags Display */}
                    {selectedQualityTags.length > 0 && (
                      <View className="flex-row flex-wrap gap-1 mb-2">
                        {selectedQualityTags.map((tag) => (
                          <View key={tag} className="border border-green-500 text-green-400 text-xs px-2 py-1 rounded flex-row items-center">
                            <Text className="text-green-400 text-xs">{tag}</Text>
                            <TouchableOpacity
                              className="ml-1"
                              onPress={() => removeQualityTag(tag)}
                            >
                              <X color="#22c55e" size={12} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Available Tags */}
                    <View className="max-h-32 border border-neutral-600 rounded p-2 bg-neutral-800">
                      <ScrollView>
                        <View className="flex-row flex-wrap gap-1">
                          {qualityTagsDatabase
                            .filter((tag) => !selectedQualityTags.includes(tag))
                            .map((tag) => (
                              <TouchableOpacity
                                key={tag}
                                className="px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-green-400 rounded"
                                onPress={() => toggleQualityTag(tag)}
                              >
                                <Text className="text-neutral-300 text-xs">+ {tag}</Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between p-3 bg-neutral-800 rounded">
                    <View className="flex-row items-center gap-2">
                      {isVerified ? (
                        <ShieldCheck color="#22c55e" size={20} />
                      ) : (
                        <Shield color="#6b7280" size={20} />
                      )}
                      <View>
                        <Text className="text-neutral-300">Verification Status</Text>
                        <Text className="text-xs text-neutral-500">
                          {isVerified ? "Product verified by inspection team" : "Awaiting verification"}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIsVerified(!isVerified)}
                      className={`px-3 py-1 border rounded ${
                        isVerified
                          ? "border-green-500 text-green-400"
                          : "border-neutral-600 text-neutral-400"
                      }`}
                    >
                      <Text className={isVerified ? "text-green-400" : "text-neutral-400"}>
                        {isVerified ? "Verified" : "Not Verified"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View>
                    <Text className="text-neutral-300 mb-2">Description</Text>
                    <TextInput
                      className="bg-neutral-800 border-neutral-600 text-white border rounded p-3 h-20"
                      placeholder="Product description..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View className="flex-row gap-2 pt-4">
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddProduct(false);
                        setSelectedProduct(null);
                        setSelectedQualityTags([]);
                        setIsVerified(false);
                      }}
                      className="flex-1 border border-neutral-600 text-neutral-300 py-3 rounded items-center"
                    >
                      <Text className="text-neutral-300">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddProduct(false);
                        setSelectedProduct(null);
                        setSelectedQualityTags([]);
                        setIsVerified(false);
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded items-center"
                    >
                      <Text className="text-white">Add Product</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </CardContent>
            </Card>
          </View>
        </Modal>
      )}
    </View>
  );
}