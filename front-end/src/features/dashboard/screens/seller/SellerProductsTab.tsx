import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
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
  Shield,
  ShieldCheck,
  Building2,
  TrendingUp,
  Eye,
  Zap,
} from 'lucide-react-native';

import { Card } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';
import { LoadingSpinner } from '../../../../shared/components/LoadingSpinner';
import { ErrorState } from '../../../../shared/components/ErrorState';
import { useUserData } from '../../../../contexts/UserDataContext';
import { ProductCreationFlow } from './product-creation/ProductCreationFlow';
import { ProductEditDrawer } from '../../../../shared/components/ProductEditDrawer';
import { apiClient } from '../../../../services/api';
import { useProductStore } from '../../../../stores/product.store';
import { SellerOffersDrawer } from '../../../../shared/components/SellerOffersDrawer';

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
  
  // Product creation flow state
  const [showProductCreationFlow, setShowProductCreationFlow] = useState(false);
  
  // Edit product states
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  // Offers drawer state
  const [showOffersDrawer, setShowOffersDrawer] = useState(false);
  const [selectedProductOffers, setSelectedProductOffers] = useState<any>(null);
  


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

  // Mock data for buyer offers - replace with actual API data
  const getMockOffers = (productId: string) => [
    {
      id: `offer-${productId}-1`,
      buyer: {
        id: 'buyer-1',
        name: 'GlobalGrain Corp',
        company: 'GlobalGrain Corp',
        location: {
          city: 'Chicago',
          state: 'Illinois',
          country: 'USA',
        },
        rating: 4.7,
        reviewCount: 23,
        verified: true,
        avatar: 'https://ui-avatars.com/api/?name=GlobalGrain&background=3B82F6&color=fff',
      },
      requestedQuantity: 500,
      offeredPrice: 245,
      unit: 'TON',
      currency: 'EUR',
      deliveryRequirements: {
        location: 'Port of Hamburg, Germany',
        timeframe: 'Within 30 days',
        method: 'Container shipping',
      },
      specifications: [
        { name: 'Protein Content', requirement: '≥13%', matches: true },
        { name: 'Moisture', requirement: '≤12%', matches: true },
        { name: 'Test Weight', requirement: '≥60 lb/bu', matches: false },
      ],
      matchScore: 88,
      totalValue: 122500,
      message: 'Looking for premium quality wheat for our European operations. Can provide long-term contract.',
      urgency: 'medium' as const,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `offer-${productId}-2`,
      buyer: {
        id: 'buyer-2',
        name: 'European Mills Ltd',
        company: 'European Mills Ltd',
        location: {
          city: 'Rotterdam',
          state: '',
          country: 'Netherlands',
        },
        rating: 4.9,
        reviewCount: 67,
        verified: true,
        avatar: 'https://ui-avatars.com/api/?name=European+Mills&background=10B981&color=fff',
      },
      requestedQuantity: 1000,
      offeredPrice: 255,
      unit: 'TON',
      currency: 'EUR',
      deliveryRequirements: {
        location: 'Rotterdam Port, Netherlands',
        timeframe: 'Within 45 days',
        method: 'Bulk carrier',
      },
      specifications: [
        { name: 'Protein Content', requirement: '≥14%', matches: true },
        { name: 'Moisture', requirement: '≤11%', matches: true },
        { name: 'Foreign Material', requirement: '≤1%', matches: true },
      ],
      matchScore: 95,
      totalValue: 255000,
      message: 'Urgent requirement for our milling operations. Premium price for quality product.',
      urgency: 'high' as const,
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `offer-${productId}-3`,
      buyer: {
        id: 'buyer-3',
        name: 'AgriTrade Solutions',
        company: 'AgriTrade Solutions',
        location: {
          city: 'Barcelona',
          state: '',
          country: 'Spain',
        },
        rating: 4.3,
        reviewCount: 15,
        verified: false,
        avatar: 'https://ui-avatars.com/api/?name=AgriTrade&background=F59E0B&color=fff',
      },
      requestedQuantity: 250,
      offeredPrice: 235,
      unit: 'TON',
      currency: 'EUR',
      deliveryRequirements: {
        location: 'Barcelona Port, Spain',
        timeframe: 'Within 60 days',
        method: 'Container shipping',
      },
      specifications: [
        { name: 'Protein Content', requirement: '≥12%', matches: true },
        { name: 'Moisture', requirement: '≤13%', matches: true },
      ],
      matchScore: 75,
      totalValue: 58750,
      message: 'Regular buyer looking for consistent supply. Flexible on delivery terms.',
      urgency: 'low' as const,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending' as const,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Handle offers viewing
  const handleViewOffers = (product: any) => {
    const mockOffers = getMockOffers(product.id);
    setSelectedProductOffers({
      ...product,
      offers: mockOffers,
    });
    setShowOffersDrawer(true);
  };

  
  // Product creation flow handlers
  const handleProductCreationSuccess = useCallback(async (product: any) => {
    setShowProductCreationFlow(false);
    // Products list will be refreshed by the useProductCreation hook
  }, []);

  const handleProductCreationError = useCallback((error: string) => {
    console.error('Product creation error:', error);
    // Error handling is already done in the useProductCreation hook
  }, []);
  
  const startAddProductFlow = useCallback(() => {
    setShowProductCreationFlow(true);
  }, []);
  
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
    
    // Mock offers data - replace with actual API data
    const mockOffers = getMockOffers(item.id);
    const offersCount = mockOffers.length;
    const bestOffer = mockOffers.length > 0 ? Math.max(...mockOffers.map(o => o.offeredPrice)) : null;
    const urgentOffers = mockOffers.filter(o => o.urgency === 'high').length;
    
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
              
              {/* Urgent offers indicator */}
              {urgentOffers > 0 && (
                <View className="absolute top-2 left-2">
                  <View className="bg-red-500/90 rounded-full px-2 py-1">
                    <Text className="text-white text-xs font-bold">{urgentOffers}</Text>
                  </View>
                </View>
              )}
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
          
          {/* Enhanced Offers Section */}
          <View className="px-4 pb-4">
            {offersCount > 0 ? (
              <TouchableOpacity
                onPress={() => handleViewOffers(item)}
                className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30 active:scale-95"
                style={{
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Package color="#10B981" size={18} />
                      <Text className="text-green-400 font-semibold ml-2">
                        {offersCount} Buyer Offer{offersCount > 1 ? 's' : ''}
                      </Text>
                      {urgentOffers > 0 && (
                        <View className="bg-red-500/30 rounded-full px-2 py-1 ml-2">
                          <Text className="text-red-400 text-xs font-medium">
                            {urgentOffers} urgent
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {bestOffer && (
                      <View className="flex-row items-center">
                        <DollarSign color="#FBBF24" size={16} />
                        <Text className="text-white font-bold ml-2">
                          Best: €{bestOffer}/kg
                        </Text>
                        {priceRangeMax && bestOffer > priceRangeMax && (
                          <View className="bg-green-500/20 px-2 py-1 rounded ml-2">
                            <Text className="text-green-400 text-xs font-medium">
                              +€{(bestOffer - priceRangeMax).toFixed(1)} premium
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  
                  <View className="ml-4">
                    <View className="w-12 h-12 bg-green-500/20 rounded-full items-center justify-center border border-green-500/40">
                      <Eye color="#10B981" size={20} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View className="bg-gradient-to-br from-neutral-800/50 to-neutral-700/30 rounded-xl p-4 border border-neutral-600/50">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Building2 color="#6B7280" size={18} />
                      <Text className="text-neutral-400 font-medium ml-2">
                        Waiting for Offers
                      </Text>
                    </View>
                    <Text className="text-neutral-500 text-sm">
                      Your listing is live and visible to buyers
                    </Text>
                  </View>
                  
                  <View className="ml-4">
                    <View className="w-12 h-12 bg-neutral-700/50 rounded-full items-center justify-center border border-neutral-600/50">
                      <Zap color="#6B7280" size={20} />
                    </View>
                  </View>
                </View>
              </View>
            )}
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

      {/* Product Creation Flow */}
      <ProductCreationFlow
        visible={showProductCreationFlow}
        onClose={() => setShowProductCreationFlow(false)}
        onSuccess={handleProductCreationSuccess}
        onError={handleProductCreationError}
      />
      
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
      
      {/* Seller Offers Drawer - Single drawer with internal modals */}
      {showOffersDrawer && selectedProductOffers && (
        <SellerOffersDrawer
          visible={showOffersDrawer}
          onClose={() => {
            setShowOffersDrawer(false);
            setSelectedProductOffers(null);
          }}
          offers={selectedProductOffers.offers || []}
          sellerProduct={selectedProductOffers}
          productName={selectedProductOffers.name}
          productId={selectedProductOffers.id}
        />
      )}
    </View>
  );
}