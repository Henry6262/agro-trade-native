import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  Plus,
  Edit,
  MapPin,
  Weight,
  DollarSign,
  Truck,
  Package,
  Clock,
  Star,
  Calendar,
  CheckCircle,
  ChevronDown,
  X,
  Shield,
  ShieldCheck,
  Target,
  Award,
  TrendingUp,
  Wheat,
  Bean,
  Apple,
  Carrot,
  Milk,
  Egg,
} from 'lucide-react-native';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { FixedProgressHeader } from '../../components/dashboard/FixedProgressHeader';

interface SellerDashboardScreenProps {
  activeTab?: string;
}

export default function SellerDashboardScreen({ activeTab = 'products' }: SellerDashboardScreenProps = {}) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedQualityTags, setSelectedQualityTags] = useState<string[]>([]);
  const [showProductPopover, setShowProductPopover] = useState(false);
  const [activeTradeStage, setActiveTradeStage] = useState<number | null>(null);

  const earningsData = {
    totalEarnings: 156750,
    monthlyEarnings: 28500,
    completedTrades: 47,
    averagePerTrade: 3335,
    topProduct: 'Premium Wheat',
    growthRate: 23.5,
  };

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

  const incomingOffers = [
    {
      id: 'IO001',
      product: 'Premium Wheat',
      quantity: 45,
      offeredPricePerTon: 295,
      totalValue: 13275,
      buyer: 'Global Grain Corp',
      buyerLocation: 'New York, NY',
      buyerFlag: '🇺🇸',
      adminNote: 'Urgent order for premium wheat. Client willing to pay above market rate for quality assurance.',
      deadline: '2025-01-26',
      responseTime: '18 hours',
      estimatedProfit: 675,
      qualityRequirements: ['Organic', 'Non-GMO', 'Protein 15%+'],
    },
    {
      id: 'IO002',
      product: 'Soybeans',
      quantity: 60,
      offeredPricePerTon: 365,
      totalValue: 21900,
      buyer: 'EuroFeed Solutions',
      buyerLocation: 'Hamburg, Germany',
      buyerFlag: '🇩🇪',
      adminNote: 'Export opportunity to European market. Premium pricing for certified organic soybeans.',
      deadline: '2025-01-28',
      responseTime: '2 days',
      estimatedProfit: 900,
      qualityRequirements: ['Organic', 'EU Certified', 'Protein 18%'],
    },
  ];

  const sellerProducts = [
    {
      id: "P001",
      name: "Premium Wheat",
      quantity: 50,
      pricePerTon: 280,
      location: "Iowa, USA",
      flag: "🇺🇸",
      quality: ["Organic", "Non-GMO", "Protein 14%"],
      status: "Available",
      listed: "2025-01-15",
      verified: true,
    },
    {
      id: "P002",
      name: "Corn Grain",
      quantity: 75,
      pricePerTon: 220,
      location: "Nebraska, USA",
      flag: "🇺🇸",
      quality: ["Grade A", "Moisture 15%"],
      status: "Low Stock",
      listed: "2025-01-10",
      verified: false,
    },
    {
      id: "P003",
      name: "Soybeans",
      quantity: 100,
      pricePerTon: 350,
      location: "Illinois, USA",
      flag: "🇺🇸",
      quality: ["Organic", "Non-GMO", "Protein 18%"],
      status: "Available",
      listed: "2025-01-20",
      verified: true,
    },
  ];

  const activeTrades = [
    {
      id: "T001",
      product: "Premium Wheat",
      quantity: 25,
      agreedPricePerTon: 280,
      buyer: "GrainCorp Ltd",
      buyerLocation: "Chicago, IL",
      buyerFlag: "🇺🇸",
      transporter: "FastHaul Logistics",
      transporterTrucks: 3,
      licensePlate: "TRK-4521",
      status: "Awaiting Departure",
      pickupDate: "2025-01-25",
      estimatedDeparture: "2025-01-24 08:00",
      price: 7000,
      currentStage: 1,
    },
    {
      id: "T002",
      product: "Corn Grain",
      quantity: 40,
      agreedPricePerTon: 220,
      buyer: "FeedMaster Co",
      buyerLocation: "Kansas City, MO",
      buyerFlag: "🇺🇸",
      transporter: "AgriTransport",
      transporterTrucks: 2,
      licensePlate: "AGR-7834",
      status: "Traveling",
      pickupDate: "2025-01-22",
      estimatedDeparture: "2025-01-22 06:30",
      price: 8800,
      currentStage: 2,
    },
    {
      id: "T003",
      product: "Soybeans",
      quantity: 30,
      agreedPricePerTon: 350,
      buyer: "BioFeed Industries",
      buyerLocation: "Minneapolis, MN",
      buyerFlag: "🇺🇸",
      transporter: "GreenRoute Express",
      transporterTrucks: 1,
      licensePlate: "GRE-2156",
      status: "Scheduled",
      pickupDate: "2025-01-28",
      estimatedDeparture: null,
      price: 10500,
      currentStage: 0,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500"
      case "Low Stock":
        return "bg-yellow-500"
      case "Out of Stock":
        return "bg-red-500"
      case "Deal Accepted":
        return "bg-blue-500"
      case "Awaiting Departure":
        return "bg-orange-500"
      case "Traveling":
        return "bg-purple-500"
      case "At Location":
        return "bg-indigo-500"
      case "Completed":
        return "bg-green-500"
      case "Scheduled":
        return "bg-blue-500"
      default:
        return "bg-neutral-500"
    }
  };

  const getTradeStages = () => [
    { name: "Scheduled", description: "Pickup scheduled", icon: Calendar },
    { name: "Traveling", description: "Driver en route", icon: Truck },
    { name: "Arrived", description: "At pickup location", icon: MapPin },
    { name: "Completed", description: "Goods delivered", icon: CheckCircle },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Deal Accepted":
        return <Package color="#ffffff" size={16} />;
      case "Awaiting Departure":
        return <Clock color="#ffffff" size={16} />;
      case "Traveling":
        return <Truck color="#ffffff" size={16} />;
      case "At Location":
        return <MapPin color="#ffffff" size={16} />;
      case "Completed":
        return <Package color="#ffffff" size={16} />;
      case "Scheduled":
        return <Calendar color="#ffffff" size={16} />;
      default:
        return <Package color="#ffffff" size={16} />;
    }
  };

  const renderStageIndicator = (currentStage: number) => {
    const stages = getTradeStages();
    const { width } = Dimensions.get('window');
    const isMobile = width < 768;
    const progressWidth = isMobile ? Math.min(width * 0.8, 320) : 400; // Max 320px on mobile, 400px on desktop
    
    return (
      <View className={`relative mb-6 ${isMobile ? 'mx-auto' : ''}`} style={{ maxWidth: progressWidth }}>
        {/* Progress Bar Background */}
        <View className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-700 z-0" />

        {/* Active Progress Bar */}
        <View
          className="absolute top-4 left-4 h-0.5 bg-green-500 z-0"
          style={{
            width: `${(currentStage / (stages.length - 1)) * (progressWidth - 32)}px`,
          }}
        />

        <View className="flex-row justify-between relative z-10">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            const isUpcoming = index > currentStage;

            return (
              <View key={index} className="items-center">
                <View
                  className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} rounded-full items-center justify-center relative ${
                    isCompleted
                      ? "bg-green-500"
                      : isCurrent
                        ? "bg-yellow-500"
                        : "bg-neutral-700"
                  }`}
                >
                  <Icon
                    color={isCompleted || isCurrent ? "#ffffff" : "#9CA3AF"}
                    size={isMobile ? 14 : 16}
                  />
                  {isCurrent && (
                    <View className="absolute inset-0 rounded-full bg-yellow-500 opacity-75" />
                  )}
                </View>
                <Text
                  className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-center mt-1 ${isMobile ? 'max-w-14' : 'max-w-16'} ${
                    isCompleted
                      ? "text-green-400"
                      : isCurrent
                        ? "text-yellow-400"
                        : "text-neutral-500"
                  }`}
                >
                  {stage.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const handleProductSelect = (product: any) => {
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

  const renderProductCard = ({ item: product }: { item: any }) => {
    return (
      <Card key={product.id} className="bg-neutral-900 border-neutral-700 m-2 flex-1">
        <CardHeader className="pb-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <CardTitle className="text-lg text-white flex-1">{product.name}</CardTitle>
                {product.verified ? (
                  <ShieldCheck color="#22c55e" size={16} />
                ) : (
                  <Shield color="#6b7280" size={16} />
                )}
              </View>
              <View className="flex-row items-center gap-2 mt-1">
                <MapPin color="#9ca3af" size={16} />
                <Text className="text-sm text-neutral-400">
                  {product.flag} {product.location}
                </Text>
              </View>
            </View>
            <Badge className={`${getStatusColor(product.status)} text-white text-xs px-2 py-1 rounded`}>
              {product.status}
            </Badge>
          </View>

          {/* Quality Tags */}
          <View className="flex-row flex-wrap gap-1 mt-2">
            {product.quality.map((tag: string, index: number) => (
              <Badge key={index} className="text-xs border-green-500 text-green-400 border px-2 py-1 rounded">
                {tag}
              </Badge>
            ))}
          </View>
        </CardHeader>

        <CardContent className="space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Weight color="#9ca3af" size={16} />
              <Text className="text-sm text-white">{product.quantity} tons</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <DollarSign color="#9ca3af" size={16} />
              <Text className="text-sm text-white">${product.pricePerTon}/ton</Text>
            </View>
          </View>

          <Text className="text-xs text-neutral-500">
            Listed: {new Date(product.listed).toLocaleDateString()}
          </Text>

          <TouchableOpacity className="w-full border border-neutral-600 bg-transparent py-2 px-3 rounded flex-row items-center justify-center gap-2">
            <Edit color="#9ca3af" size={16} />
            <Text className="text-neutral-300">Edit Product</Text>
          </TouchableOpacity>
        </CardContent>
      </Card>
    );
  };

  if (activeTab === "products") {
    const { width } = Dimensions.get('window');
    const numColumns = width > 1024 ? 3 : width > 768 ? 2 : 1;
    
    return (
      <ScrollView 
        className="flex-1 bg-black"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="p-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-bold text-white">My Products</Text>
            <Text className="text-neutral-400">Manage your agricultural products and listings</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddProduct(true)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex-row items-center gap-2"
          >
            <Plus color="#ffffff" size={16} />
            <Text className="text-white">Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        <FlatList
          data={sellerProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Enhanced Add Product Modal */}
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
                                    onPress={() => handleProductSelect(product)}
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
        </View>
      </ScrollView>
    );
  }

  if (activeTab === "trades") {
    const { width } = Dimensions.get('window');
    const isMobile = width < 768;
    
    return (
      <View className="flex-1 bg-black">
        {/* Fixed Progress Header - shows when a trade is expanded */}
        {expandedTrade && activeTradeStage !== null && (
          <FixedProgressHeader currentStage={activeTradeStage} />
        )}
        
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          style={{ paddingTop: expandedTrade ? 80 : 0 }}
        >
          <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white">My Trades</Text>
          <Text className="text-neutral-400">Track your active trades and earnings performance</Text>
        </View>

        {/* 4 Small Earnings Cards - Responsive Grid */}
        <View className={`${isMobile ? 'flex-row flex-wrap' : 'flex-row justify-between gap-2'} mb-6`}>
          {/* Total Earnings Card */}
          <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
            <CardContent className="p-3">
              <View className="items-center">
                <DollarSign color="#22c55e" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Total</Text>
                <Text className="text-lg font-bold text-white">
                  ${(earningsData.totalEarnings / 1000).toFixed(0)}k
                </Text>
                <Text className="text-xs text-green-400">+{earningsData.growthRate}%</Text>
              </View>
            </CardContent>
          </Card>

          {/* Monthly Earnings */}
          <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
            <CardContent className="p-3">
              <View className="items-center">
                <Calendar color="#60a5fa" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Month</Text>
                <Text className="text-lg font-bold text-white">
                  ${(earningsData.monthlyEarnings / 1000).toFixed(0)}k
                </Text>
                <Text className="text-xs text-blue-400">Jan 2025</Text>
              </View>
            </CardContent>
          </Card>

          {/* Completed Trades */}
          <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
            <CardContent className="p-3">
              <View className="items-center">
                <Target color="#8b5cf6" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Trades</Text>
                <Text className="text-lg font-bold text-white">{earningsData.completedTrades}</Text>
                <Text className="text-xs text-purple-400">
                  ${(earningsData.averagePerTrade / 1000).toFixed(1)}k avg
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Top Product */}
          <Card className={`bg-neutral-900 border-neutral-700 ${isMobile ? 'w-[48%] mb-2' : 'flex-1'}`}>
            <CardContent className="p-3">
              <View className="items-center">
                <Award color="#fb923c" size={20} />
                <Text className="text-xs text-neutral-400 mt-1">Top</Text>
                <Text className="text-sm font-bold text-white">Wheat</Text>
                <Text className="text-xs text-orange-400">45%</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Two Column Layout: Incoming Offers | Active Trades - Responsive */}
        <View className={`${isMobile ? 'flex-col space-y-6' : 'flex-row gap-6'}`}>
          {/* Incoming Offers */}
          <View className={isMobile ? 'w-full' : 'flex-1'}>
            <Text className="text-xl font-semibold text-white mb-4">Incoming Offers</Text>
            {incomingOffers.map((offer) => (
              <Card
                key={offer.id}
                className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30 mb-4"
              >
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View>
                      <Text className="text-lg font-semibold text-white">{offer.product}</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight color="#fb923c" size={16} />
                          <Text className="text-white font-medium text-sm">{offer.quantity} tons</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign color="#fb923c" size={16} />
                          <Text className="text-white font-medium text-sm">${offer.offeredPricePerTon}/ton</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-orange-500/20 px-2 py-1 rounded">
                          <Text className="text-orange-300 text-xs">Total:</Text>
                          <Text className="text-orange-400 font-bold text-sm">
                            ${offer.totalValue.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Badge className="bg-orange-500 text-white px-2 py-1 rounded flex-row items-center gap-1">
                      <Clock color="#ffffff" size={12} />
                      <Text className="text-white text-xs">{offer.responseTime} left</Text>
                    </Badge>
                  </View>

                  <View className="mb-4">
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Buyer:</Text>
                      <Text className="text-white font-medium">{offer.buyer}</Text>
                      <View className="flex-row items-center gap-1">
                        <MapPin color="#9ca3af" size={12} />
                        <Text className="text-neutral-400 text-sm">
                          {offer.buyerFlag} {offer.buyerLocation}
                        </Text>
                      </View>
                    </View>
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Quality Requirements:</Text>
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {offer.qualityRequirements.map((req, index) => (
                          <Badge
                            key={index}
                            className="text-xs border-orange-400 text-orange-300 border px-2 py-1 rounded"
                          >
                            {req}
                          </Badge>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                    <Text className="text-neutral-400 text-sm">Admin Note:</Text>
                    <Text className="text-neutral-300 mt-1 text-sm">{offer.adminNote}</Text>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex-row items-center gap-2">
                      <CheckCircle color="#ffffff" size={16} />
                      <Text className="text-white">Accept Offer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="border border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent py-2 px-3 rounded">
                      <X color="#ef4444" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity className="border border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent py-2 px-3 rounded">
                      <DollarSign color="#fb923c" size={16} />
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>

          {/* Active Trades */}
          <View className={isMobile ? 'w-full' : 'flex-1'}>
            <Text className="text-xl font-semibold text-white mb-4">Active Trades</Text>
            {activeTrades.map((trade) => (
              <Card key={trade.id} className="bg-neutral-900 border-neutral-700 mb-4">
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-6">
                    <View>
                      <Text className="text-lg font-semibold text-white">{trade.product}</Text>
                      <View className="flex-row items-center gap-4 mt-2">
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight color="#22c55e" size={16} />
                          <Text className="text-white font-medium text-sm">{trade.quantity} tons</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign color="#22c55e" size={16} />
                          <Text className="text-white font-medium text-sm">${trade.agreedPricePerTon}/ton</Text>
                        </View>
                        <View className="flex-row items-center gap-1 bg-green-500/20 px-2 py-1 rounded">
                          <Text className="text-green-300 text-xs">Total:</Text>
                          <Text className="text-green-400 font-bold text-sm">
                            ${trade.price.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Badge
                      className={`${getStatusColor(trade.status)} text-white flex-row items-center gap-1 px-2 py-1 rounded`}
                    >
                      {getStatusIcon(trade.status)}
                      <Text className="text-white text-xs">{trade.status}</Text>
                    </Badge>
                  </View>

                  {/* Fixed Progress Indicator Container */}
                  <View className="bg-neutral-900 -mx-6 px-6 py-3 -mt-4 mb-4 border-b border-neutral-700">
                    {renderStageIndicator(trade.currentStage)}
                  </View>

                  {/* Trade Details */}
                  <View className="mb-4">
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Buyer:</Text>
                      <Text className="text-white font-medium">{trade.buyer}</Text>
                      <View className="flex-row items-center gap-1">
                        <MapPin color="#9ca3af" size={12} />
                        <Text className="text-neutral-400 text-sm">
                          {trade.buyerFlag} {trade.buyerLocation}
                        </Text>
                      </View>
                    </View>
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Transporter:</Text>
                      <Text className="text-white font-medium">{trade.transporter}</Text>
                      <View className="flex-row items-center gap-2">
                        <Truck color="#9ca3af" size={12} />
                        <Text className="text-neutral-400 text-sm">{trade.transporterTrucks} trucks</Text>
                        <View className="flex-row items-center gap-1">
                          <Star color="#eab308" size={16} fill="#eab308" />
                          <Text className="text-neutral-400 text-sm">4.8</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="items-center mt-4">
                    <TouchableOpacity
                      onPress={() => {
                        if (expandedTrade === trade.id) {
                          setExpandedTrade(null);
                          setActiveTradeStage(null);
                        } else {
                          setExpandedTrade(trade.id);
                          setActiveTradeStage(trade.currentStage);
                        }
                      }}
                      className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
                    >
                      <Text className="text-neutral-400 hover:text-white text-sm">
                        {expandedTrade === trade.id ? "Hide Details" : "View Details"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {expandedTrade === trade.id && (
                    <View className="mt-4 pt-4 border-t border-neutral-700">
                      <View className="mb-4">
                        <Text className="text-sm font-medium text-white mb-2">Transport Details</Text>
                        <View className="space-y-1">
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">License Plate:</Text>
                            <Text className="text-white font-mono text-sm">{trade.licensePlate}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Fleet Size:</Text>
                            <Text className="text-white text-sm">{trade.transporterTrucks} trucks</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Rating:</Text>
                            <View className="flex-row items-center gap-1">
                              <Star color="#eab308" size={12} fill="#eab308" />
                              <Text className="text-white text-sm">4.8/5</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View>
                        <Text className="text-sm font-medium text-white mb-2">Trade Summary</Text>
                        <View className="space-y-1">
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Quantity:</Text>
                            <Text className="text-white text-sm">{trade.quantity} tons</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-neutral-400 text-sm">Price/ton:</Text>
                            <Text className="text-white text-sm">${trade.agreedPricePerTon}</Text>
                          </View>
                          <View className="flex-row justify-between font-medium">
                            <Text className="text-neutral-400 text-sm">Total Value:</Text>
                            <Text className="text-green-400 text-sm">${trade.price.toLocaleString()}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
        </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}