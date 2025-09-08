import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Plus,
  MapPin,
  Weight,
  DollarSign,
  Package,
  ChevronDown,
  X,
  Wheat,
  Bean,
  Apple,
  Carrot,
  Milk,
  Egg,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';

interface BuyerRequestsTabProps {
  id?: string;
}

export default function BuyerRequestsTab({ id }: BuyerRequestsTabProps = {}) {
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
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

  const buyerRequests = [
    {
      id: 'R001',
      product: 'Premium Wheat',
      quantity: 60,
      maxPricePerTon: 285,
      deliveryLocation: 'Chicago, IL',
      deliveryFlag: '🇺🇸',
      requiredDate: '2025-02-15',
      status: 'Active',
      qualityRequirements: ['Organic', 'Non-GMO', 'Protein 15%+'],
      offers: 3,
      bestOffer: 275,
      created: '2025-01-20',
      notes: 'Urgent requirement for feed production. Quality is priority over price.',
    },
    {
      id: 'R002',
      product: 'Soybeans',
      quantity: 80,
      maxPricePerTon: 370,
      deliveryLocation: 'Detroit, MI',
      deliveryFlag: '🇺🇸',
      requiredDate: '2025-02-20',
      status: 'Matched',
      qualityRequirements: ['Organic', 'Protein 18%'],
      offers: 7,
      bestOffer: 355,
      created: '2025-01-18',
      notes: 'Looking for consistent supplier for long-term partnership.',
    },
    {
      id: 'R003',
      product: 'Corn Grain',
      quantity: 45,
      maxPricePerTon: 225,
      deliveryLocation: 'Milwaukee, WI',
      deliveryFlag: '🇺🇸',
      requiredDate: '2025-02-10',
      status: 'Expired',
      qualityRequirements: ['Grade A', 'Moisture 14%'],
      offers: 1,
      bestOffer: 230,
      created: '2025-01-15',
      notes: 'Budget-conscious purchase for processing facility.',
    },
  ];

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

  const toggleQualityTag = (tag: string) => {
    setSelectedQualityTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const removeQualityTag = (tag: string) => {
    setSelectedQualityTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <ScrollView 
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-6 space-y-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white">My Requests</Text>
            <Text className="text-neutral-400">Manage your product requests and requirements</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddRequest(true)}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded flex-row items-center gap-2"
          >
            <Plus color="#ffffff" size={16} />
            <Text className="text-white">New Request</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-4">
          {buyerRequests.map((request) => (
            <Card key={request.id} className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-6">
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-lg font-semibold text-white">{request.product}</Text>
                    <View className="flex-row items-center gap-4 mt-2">
                      <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                        <Weight color="#60a5fa" size={16} />
                        <Text className="text-white font-medium text-sm">{request.quantity} tons</Text>
                      </View>
                      <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                        <DollarSign color="#60a5fa" size={16} />
                        <Text className="text-white font-medium text-sm">${request.maxPricePerTon}/ton max</Text>
                      </View>
                      <View className="flex-row items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                        <Text className="text-blue-300 text-xs">Budget:</Text>
                        <Text className="text-blue-400 font-bold">
                          ${(request.quantity * request.maxPricePerTon).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className={`${getStatusColor(request.status)} px-2 py-1 rounded`}>
                      <Text className="text-white text-xs">{request.status}</Text>
                    </View>
                    <View className="border border-blue-500 px-2 py-1 rounded">
                      <Text className="text-blue-400 text-xs">{request.offers} offers</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1 space-y-2">
                    <View>
                      <Text className="text-sm text-neutral-400">Delivery Location:</Text>
                      <View className="flex-row items-center gap-1 text-white">
                        <MapPin color="#9CA3AF" size={12} />
                        <Text className="text-white text-sm">{request.deliveryFlag} {request.deliveryLocation}</Text>
                      </View>
                    </View>
                    <View>
                      <Text className="text-sm text-neutral-400">Required Date:</Text>
                      <Text className="text-white text-sm">{new Date(request.requiredDate).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View className="flex-1 space-y-2">
                    <View>
                      <Text className="text-sm text-neutral-400">Best Offer:</Text>
                      <Text className="text-green-400 font-medium text-sm">${request.bestOffer}/ton</Text>
                    </View>
                    <View>
                      <Text className="text-sm text-neutral-400">Created:</Text>
                      <Text className="text-white text-sm">{new Date(request.created).toLocaleDateString()}</Text>
                    </View>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm mb-2 text-neutral-400">Quality Requirements:</Text>
                  <View className="flex-row flex-wrap gap-1">
                    {request.qualityRequirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-blue-400 text-blue-300">
                        {req}
                      </Badge>
                    ))}
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedRequest(expandedRequest === request.id ? null : request.id)
                    }
                    className="px-3 py-2 bg-transparent border border-neutral-600 rounded"
                  >
                    <Text className="text-neutral-400 hover:text-white text-xs">
                      {expandedRequest === request.id ? 'Hide Details' : 'View Details'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="px-3 py-2 border border-blue-500 text-blue-400 hover:bg-blue-500/10 bg-transparent rounded">
                    <Text className="text-blue-400 text-xs">Edit Request</Text>
                  </TouchableOpacity>
                  {request.status === 'Active' && (
                    <TouchableOpacity className="px-3 py-2 border border-green-500 text-green-400 hover:bg-green-500/10 bg-transparent rounded">
                      <Text className="text-green-400 text-xs">View Offers ({request.offers})</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {expandedRequest === request.id && (
                  <View className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                    <View>
                      <Text className="text-sm font-medium text-white">Request Notes</Text>
                      <View className="bg-neutral-800/50 rounded-lg p-3 mt-2">
                        <Text className="text-neutral-300 text-sm">{request.notes}</Text>
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-white">Request Summary</Text>
                      <View className="text-sm space-y-1 mt-2">
                        <View className="flex-row justify-between">
                          <Text className="text-neutral-400">Total Budget:</Text>
                          <Text className="text-white">
                            ${(request.quantity * request.maxPricePerTon).toLocaleString()}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-neutral-400">Potential Savings:</Text>
                          <Text className="text-green-400">
                            ${((request.maxPricePerTon - request.bestOffer) * request.quantity).toLocaleString()}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-neutral-400">Days Until Required:</Text>
                          <Text className="text-white">
                            {Math.ceil(
                              (new Date(request.requiredDate).getTime() - new Date().getTime()) /
                                (1000 * 60 * 60 * 24),
                            )}{' '}
                            days
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Add Request Modal */}
        {showAddRequest && (
          <View className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-neutral-900 border-neutral-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Create New Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <View>
                  <Text className="text-neutral-300 mb-2">Product Type</Text>
                  <TouchableOpacity
                    onPress={() => setShowProductPopover(!showProductPopover)}
                    className="w-full justify-between bg-neutral-800 border border-neutral-600 text-white hover:bg-neutral-700 p-3 rounded flex-row items-center"
                  >
                    {selectedProduct ? (
                      <View className="flex-row items-center gap-2">
                        <selectedProduct.icon color="#ffffff" size={16} />
                        <Text className="text-white">{selectedProduct.name}</Text>
                      </View>
                    ) : (
                      <Text className="text-white">Select a product...</Text>
                    )}
                    <ChevronDown color="#9CA3AF" size={16} />
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-neutral-300 mb-2">Quantity (tons)</Text>
                    <TextInput
                      className="bg-neutral-800 border border-neutral-600 text-white p-3 rounded"
                      placeholder="50"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-300 mb-2">Max price per ton ($)</Text>
                    <TextInput
                      className="bg-neutral-800 border border-neutral-600 text-white p-3 rounded"
                      placeholder="280"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-neutral-300 mb-2">Delivery Location</Text>
                  <TextInput
                    className="bg-neutral-800 border border-neutral-600 text-white p-3 rounded"
                    placeholder="Chicago, IL"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View>
                  <Text className="text-neutral-300 mb-2">Required Delivery Date</Text>
                  <TextInput
                    className="bg-neutral-800 border border-neutral-600 text-white p-3 rounded"
                    placeholder="Select date"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View>
                  <Text className="text-neutral-300 mb-2">Quality Requirements</Text>
                  <View className="space-y-2">
                    {selectedQualityTags.length > 0 && (
                      <View className="flex-row flex-wrap gap-1">
                        {selectedQualityTags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-blue-500 text-blue-400 pr-1">
                            {tag}
                            <TouchableOpacity
                              onPress={() => removeQualityTag(tag)}
                              className="ml-1 p-0"
                            >
                              <X color="#3b82f6" size={12} />
                            </TouchableOpacity>
                          </Badge>
                        ))}
                      </View>
                    )}

                    <View className="max-h-32 border border-neutral-600 rounded-md p-2 bg-neutral-800">
                      <View className="flex-row flex-wrap gap-1">
                        {qualityTagsDatabase
                          .filter((tag) => !selectedQualityTags.includes(tag))
                          .map((tag) => (
                            <TouchableOpacity
                              key={tag}
                              onPress={() => toggleQualityTag(tag)}
                              className="px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-blue-400 rounded"
                            >
                              <Text className="text-neutral-300 text-xs">+ {tag}</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-neutral-300 mb-2">Additional Notes</Text>
                  <TextInput
                    className="bg-neutral-800 border border-neutral-600 text-white p-3 rounded h-24"
                    placeholder="Special requirements or notes..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View className="flex-row gap-2 pt-4">
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddRequest(false);
                      setSelectedProduct(null);
                      setSelectedQualityTags([]);
                    }}
                    className="flex-1 border border-neutral-600 text-neutral-300 py-3 rounded items-center"
                  >
                    <Text className="text-neutral-300">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddRequest(false);
                      setSelectedProduct(null);
                      setSelectedQualityTags([]);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded items-center"
                  >
                    <Text className="text-white">Create Request</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </View>
    </ScrollView>
  );
}