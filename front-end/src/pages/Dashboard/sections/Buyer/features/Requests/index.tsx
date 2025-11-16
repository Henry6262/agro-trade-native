import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import {
  MapPin,
  Weight,
  DollarSign,
  Package,
  Plus,
  Edit,
  Eye,
  Star,
  Calendar,
  Zap,
  Trophy,
  X,
} from 'lucide-react-native';
import { apiClient } from '../../../../services/api';

import { Card, CardContent } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';
import { useProductStore } from '../../../../stores/product.store';
import { BuyerRequestCreationFlow } from './request-creation';
import { BuyerRequestCard } from '../../../../shared/components/BuyerRequestCard';

// New offer components
import { UnifiedOffersDrawer } from '../../../../shared/components/UnifiedOffersDrawer';
import { Offer, NegotiationOffer } from '../../../../shared/types';

// Main Component
interface BuyerRequestsTabProps {
  id?: string;
}

export default function BuyerRequestsTab({}: BuyerRequestsTabProps = {}) {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [buyerRequests, setBuyerRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Offers drawer state
  const [showOffersDrawer, setShowOffersDrawer] = useState(false);
  const [selectedRequestOffers, setSelectedRequestOffers] = useState<any>(null);
  
  // Mock offers data for testing
  const mockOffers = [
    {
      id: 'offer-1',
      seller: {
        id: 'seller-1',
        name: 'Green Valley Farms',
        location: 'Iowa, USA',
        rating: 4.8,
        verified: true,
        avatar: 'https://ui-avatars.com/api/?name=Green+Valley&background=10B981&color=fff',
      },
      product: {
        name: 'Premium Soft Wheat',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop',
      },
      pricePerUnit: 245,
      quantity: 500,
      unit: 'TON',
      deliveryDays: 7,
      matchScore: 92,
      specifications: [
        { name: 'Protein Content', buyerRequirement: '12-14%', sellerOffer: '13.2%', matchType: 'exact' },
        { name: 'Moisture', buyerRequirement: '<14%', sellerOffer: '12.8%', matchType: 'exact' },
        { name: 'Test Weight', buyerRequirement: '58 lb/bu', sellerOffer: '59 lb/bu', matchType: 'exact' },
        { name: 'Foreign Material', buyerRequirement: '<2%', sellerOffer: '1.5%', matchType: 'exact' },
      ],
      totalValue: 122500,
      savings: 2500,
      deliveryTerms: 'FOB - Free on Board',
      paymentTerms: 'Net 30 days',
    },
    {
      id: 'offer-2',
      seller: {
        id: 'seller-2',
        name: 'Midwest Grain Co.',
        location: 'Nebraska, USA',
        rating: 4.5,
        verified: true,
        avatar: 'https://ui-avatars.com/api/?name=Midwest+Grain&background=3B82F6&color=fff',
      },
      product: {
        name: 'Standard Soft Wheat',
        image: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=200&h=200&fit=crop',
      },
      pricePerUnit: 238,
      quantity: 450,
      unit: 'TON',
      deliveryDays: 10,
      matchScore: 78,
      specifications: [
        { name: 'Protein Content', buyerRequirement: '12-14%', sellerOffer: '11.8%', matchType: 'partial' },
        { name: 'Moisture', buyerRequirement: '<14%', sellerOffer: '13.5%', matchType: 'exact' },
        { name: 'Test Weight', buyerRequirement: '58 lb/bu', sellerOffer: '57 lb/bu', matchType: 'partial' },
        { name: 'Foreign Material', buyerRequirement: '<2%', sellerOffer: '1.8%', matchType: 'exact' },
      ],
      totalValue: 107100,
      savings: 5900,
      deliveryTerms: 'CIF - Cost, Insurance & Freight',
      paymentTerms: 'Letter of Credit',
    },
    {
      id: 'offer-3',
      seller: {
        id: 'seller-3',
        name: 'Prairie Harvest LLC',
        location: 'Kansas, USA',
        rating: 4.2,
        verified: false,
        avatar: 'https://ui-avatars.com/api/?name=Prairie+Harvest&background=F59E0B&color=fff',
      },
      product: {
        name: 'Soft Wheat',
        image: 'https://images.unsplash.com/photo-1530536951323-1f4e58c9e772?w=200&h=200&fit=crop',
      },
      pricePerUnit: 255,
      quantity: 600,
      unit: 'TON',
      deliveryDays: 5,
      matchScore: 65,
      specifications: [
        { name: 'Protein Content', buyerRequirement: '12-14%', sellerOffer: '11.2%', matchType: 'missing' },
        { name: 'Moisture', buyerRequirement: '<14%', sellerOffer: '14.2%', matchType: 'missing' },
        { name: 'Test Weight', buyerRequirement: '58 lb/bu', sellerOffer: '56 lb/bu', matchType: 'missing' },
        { name: 'Foreign Material', buyerRequirement: '<2%', sellerOffer: '2.1%', matchType: 'partial' },
      ],
      totalValue: 153000,
      savings: -3000,
      deliveryTerms: 'EXW - Ex Works',
      paymentTerms: 'Cash on Delivery',
    },
  ];
  
  // Buyer request creation flow state
  const [showRequestCreationFlow, setShowRequestCreationFlow] = useState(false);
  
  const { products, fetchAllData, getProductById } = useProductStore();

  // Fetch products data on mount
  useEffect(() => {
    fetchAllData();
  }, []);
  
  // Fetch buyer listings on mount and refresh
  useEffect(() => {
    fetchBuyerListings();
  }, []);


  const fetchBuyerListings = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/buyer/listings');
      
      if (response?.data) {
        // Transform API data to match UI requirements
        const transformedData = response.data.map((listing: any) => {
          
          return {
          id: listing.id,
          product: listing.product?.displayName || listing.product?.name || 'Unknown Product',
          productId: listing.product?.id, // Store product ID for lookups
          productCategory: listing.product?.category,
          productImage: listing.product?.image, // Store product image from API
          quantity: parseFloat(listing.quantity),
          unit: listing.unit || 'TON',
          maxPricePerUnit: listing.maxPricePerUnit ? parseFloat(listing.maxPricePerUnit) : null,
          deliveryLocation: formatLocation(listing.deliveryAddress),
          deliveryFlag: getCountryFlag(listing.deliveryAddress?.country),
          requiredDate: listing.neededBy,
          status: mapStatus(listing.status),
          qualityRequirements: extractQualityRequirements(listing.specifications, listing),
          offers: listing.offers?.length || 0,
          bestOffer: getBestOfferPrice(listing.offers),
          hasOffers: listing.offers && listing.offers.length > 0,
          created: listing.createdAt,
          notes: listing.notes,
          rawData: listing, // Keep original data for detailed view
        };
        });
        
        setBuyerRequests(transformedData);
      }
    } catch (err: any) {
      console.error('Error fetching buyer listings:', err);
      setError(err?.response?.data?.message || 'Failed to load buyer requests');
      
      // Show error to user
      Alert.alert(
        'Error',
        'Failed to load your buyer requests. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBuyerListings();
  };

  // Helper functions for data transformation
  const formatLocation = (address: any) => {
    if (!address) return 'Location not specified';
    
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ') || address.street || 'Location not specified';
  };

  // Handle offers button press
  const handleViewOffers = (request: any) => {
    setSelectedRequestOffers(request);
    setShowOffersDrawer(true);
  };

  // Get product image with fallback
  const getProductImage = (request: any) => {
    // First try to use the image from the API response
    if (request.productImage) {
      return request.productImage;
    }
    
    // Then try to get from product store using product ID
    if (request.productId) {
      const productData = getProductById(request.productId);
      if (productData?.image) {
        return productData.image;
      }
    }
    
    // Fallback to category-based placeholder
    const categoryImages: Record<string, string> = {
      'SOFT_WHEAT': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop',
      'HARD_WHEAT': 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=200&h=200&fit=crop',
      'DURUM_WHEAT': 'https://images.unsplash.com/photo-1530536951323-1f4e58c9e772?w=200&h=200&fit=crop',
      'CORN': 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=200&h=200&fit=crop',
      'SOYBEANS': 'https://images.unsplash.com/photo-1639843906836-5dba16a1ca18?w=200&h=200&fit=crop',
      'RICE': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop',
      'BARLEY': 'https://images.unsplash.com/photo-1548533197-f99f7cdc76c8?w=200&h=200&fit=crop',
    };
    
    if (request.productCategory && categoryImages[request.productCategory]) {
      return categoryImages[request.productCategory];
    }
    
    // Final fallback
    return 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=' + (request.product?.charAt(0) || 'P');
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'United States': '🇺🇸',
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'Mexico': '🇲🇽',
      'United Kingdom': '🇬🇧',
      'UK': '🇬🇧',
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      // Add more as needed
    };
    return flags[country] || '🌍';
  };

  const mapStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'Active',
      'MATCHED': 'Matched',
      'EXPIRED': 'Expired',
      'CANCELLED': 'Cancelled',
      'FULFILLED': 'Fulfilled',
    };
    return statusMap[status] || status;
  };

  const extractQualityRequirements = (specifications: any, rawListing?: any) => {
    const requirements: string[] = [];
    
    // Check if specifications is an object (from the creation flow)
    if (specifications && typeof specifications === 'object' && !Array.isArray(specifications)) {
      
      // Extract specifications from the object format
      Object.entries(specifications).forEach(([key, value]) => {
        if (value && value !== '' && key !== 'notes' && key !== 'productId' && key !== 'quantity' && key !== 'maxPricePerUnit' && key !== 'unit' && key !== 'neededBy') {
          // Format the key nicely
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          requirements.push(`${formattedKey}: ${value}`);
        }
      });
    }
    
    // Extract from formal specifications array if they exist
    if (specifications && Array.isArray(specifications) && specifications.length > 0) {
      specifications.forEach(spec => {
        // Check for both valueText and valueNumber
        if (spec.valueText) {
          // If there's a specificationType with a name, use it as a label
          if (spec.specificationType?.name) {
            requirements.push(`${spec.specificationType.name}: ${spec.valueText}`);
          } else {
            requirements.push(spec.valueText);
          }
        } else if (spec.valueNumber !== null && spec.valueNumber !== undefined) {
          const label = spec.specificationType?.name || 'Value';
          const unit = spec.specificationType?.unit || '';
          requirements.push(`${label}: ${spec.valueNumber}${unit ? ' ' + unit : ''}`);
        }
      });
    }
    
    // Also check for any product-specific requirements stored in the listing's notes
    // The notes field might contain additional requirements
    if (rawListing?.notes && rawListing.notes.includes(':')) {
      // Try to parse structured notes that might contain specs
      const lines = rawListing.notes.split('\n');
      lines.forEach((line: string) => {
        if (line.includes(':') && !line.toLowerCase().includes('note')) {
          requirements.push(line.trim());
        }
      });
    }
    
    return requirements;
  };

  const getBestOfferPrice = (offers: any[]) => {
    if (!offers || offers.length === 0) return null;
    
    const prices = offers
      .filter(offer => offer.pricePerUnit)
      .map(offer => parseFloat(offer.pricePerUnit));
    
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Matched':
        return 'bg-blue-500';
      case 'Expired':
        return 'bg-red-500';
      default:
        return 'bg-neutral-500';
    }
  };

  
  // Request creation flow handlers
  const handleRequestCreationSuccess = (request: any) => {
    setShowRequestCreationFlow(false);
    // Refresh the listings to show the new one
    fetchBuyerListings();
  };

  const handleRequestCreationError = (error: string) => {
    // Error is already shown by the flow component
  };
  

  // Show loading state on initial load
  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-gray-400 mt-4">Loading your buyer requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#10B981"
        />
      }
    >
      <View className="p-6 space-y-6">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white">Market Requests</Text>
            <Text className="text-neutral-400">Create and manage your buying requirements</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowRequestCreationFlow(true);
            }}
            className="bg-green-500 rounded-xl w-12 h-12 items-center justify-center ml-4"
            style={{
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Plus color="#ffffff" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {buyerRequests.length === 0 && !error && (
          <View className="bg-neutral-900 rounded-xl p-8 items-center border border-neutral-700">
            <Package size={48} color="#6B7280" />
            <Text className="text-lg font-semibold text-white mt-4">No Buyer Requests Yet</Text>
            <Text className="text-gray-400 text-center mt-2">
              Create your first buyer request to start receiving offers from sellers
            </Text>
            <TouchableOpacity
              onPress={() => setShowRequestCreationFlow(true)}
              className="bg-blue-500 rounded-lg px-6 py-3 mt-6"
            >
              <Text className="text-white font-semibold">Create Your First Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View className="bg-red-900/20 rounded-xl p-6 border border-red-700/30">
            <Text className="text-red-400 font-semibold mb-2">Failed to Load Requests</Text>
            <Text className="text-red-300 text-sm">{error}</Text>
            <TouchableOpacity
              onPress={fetchBuyerListings}
              className="bg-red-500/20 rounded-lg px-4 py-2 mt-4 border border-red-500/50"
            >
              <Text className="text-red-400 font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Buyer Requests List */}
        <View className="space-y-4">
          {buyerRequests.map((request: any, index: number) => (
            <Card key={request.id} className="bg-neutral-900 border-neutral-700 overflow-hidden">
              <CardContent className="p-0">
                {/* Top Section with Product Image and Details */}
                <View className="flex-row p-4">
                  {/* Product Image */}
                  <View className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-800 mr-4">
                    <Image
                      source={{ uri: getProductImage(request) }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  
                  {/* Product Details */}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-lg font-semibold text-white flex-1" numberOfLines={1}>
                        {request.product}
                      </Text>
                      
                      {/* Edit Icon Button */}
                      <TouchableOpacity 
                        className="ml-2 p-2 -m-2 active:scale-95" 
                        activeOpacity={0.7}
                        onPress={() => {
                          // Future: Implement edit functionality
                          console.log('Edit request:', request.id);
                        }}
                      >
                        <Edit color="#60A5FA" size={20} />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Location */}
                    <View className="flex-row items-center mb-2">
                      <MapPin color="#10B981" size={14} />
                      <Text className="text-neutral-300 text-sm ml-1" numberOfLines={1}>
                        {request.deliveryFlag} {request.deliveryLocation}
                      </Text>
                    </View>
                    
                    {/* Quantity and Price */}
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center">
                        <Weight color="#60A5FA" size={14} />
                        <Text className="text-white text-sm ml-1">
                          {request.quantity} {request.unit.toLowerCase()}
                        </Text>
                      </View>
                      {request.maxPricePerUnit && (
                        <View className="flex-row items-center">
                          <DollarSign color="#FBBF24" size={14} />
                          <Text className="text-yellow-400 text-sm ml-1">
                            €{request.maxPricePerUnit}/kg max
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Quality Requirements */}
                {request.qualityRequirements.length > 0 && (
                  <View className="px-4 pb-4">
                    <View className="flex-row flex-wrap gap-1">
                      {request.qualityRequirements.slice(0, 3).map((req: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs border-blue-400 text-blue-300">
                          {req}
                        </Badge>
                      ))}
                      {request.qualityRequirements.length > 3 && (
                        <Badge variant="outline" className="text-xs border-neutral-500 text-neutral-400">
                          +{request.qualityRequirements.length - 3} more
                        </Badge>
                      )}
                    </View>
                  </View>
                )}

                {/* Star Feature - Offers Section */}
                <View className="px-4 pb-4">
                  {request.offers > 0 ? (
                    <TouchableOpacity
                      onPress={() => handleViewOffers(request)}
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
                            <Star color="#10B981" size={18} fill="#10B981" />
                            <Text className="text-green-400 font-semibold ml-2">
                              {request.offers} Offer{request.offers > 1 ? 's' : ''} Received
                            </Text>
                          </View>
                          
                          {request.bestOffer ? (
                            <View className="flex-row items-center">
                              <Trophy color="#FBBF24" size={16} />
                              <Text className="text-white font-bold ml-2">
                                Best: €{request.bestOffer}/kg
                              </Text>
                              {request.maxPricePerUnit && request.bestOffer < request.maxPricePerUnit && (
                                <View className="bg-green-500/20 px-2 py-1 rounded ml-2">
                                  <Text className="text-green-400 text-xs font-medium">
                                    Save €{((request.maxPricePerUnit - request.bestOffer) * request.quantity * 1000).toLocaleString()}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ) : (
                            <Text className="text-neutral-300 text-sm">
                              View all offers and compare prices
                            </Text>
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
                            <Package color="#6B7280" size={18} />
                            <Text className="text-neutral-400 font-medium ml-2">
                              Waiting for Offers
                            </Text>
                          </View>
                          <Text className="text-neutral-500 text-sm">
                            Your request is live and visible to sellers
                          </Text>
                          {request.requiredDate && (
                            <View className="flex-row items-center mt-2">
                              <Calendar color="#FBBF24" size={14} />
                              <Text className="text-yellow-400 text-sm ml-1">
                                Due: {new Date(request.requiredDate).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
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
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Buyer Request Creation Flow */}
        <BuyerRequestCreationFlow
          visible={showRequestCreationFlow}
          onClose={() => setShowRequestCreationFlow(false)}
          onSuccess={handleRequestCreationSuccess}
          onError={handleRequestCreationError}
        />

        {/* Enhanced Offers Drawer */}
        <UnifiedOffersDrawer
          visible={showOffersDrawer}
          onClose={() => {
            setShowOffersDrawer(false);
            setSelectedRequestOffers(null);
          }}
          offers={selectedRequestOffers?.rawData?.offers || mockOffers} // Use real offers if available, fallback to mock
          productName={selectedRequestOffers?.product || ''}
          requestId={selectedRequestOffers?.id || ''}
          buyerRequest={selectedRequestOffers}
        />
      </View>
    </ScrollView>
  );
}