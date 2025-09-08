import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Truck,
  MapPin,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle as XCircleIcon,
  Target,
  Weight,
  MessageSquare,
  Gavel,
  Route,
  Calendar,
  X,
  Star,
  TrendingUp,
  ChevronDown,
  Send,
  Zap,
  Plus,
  Users,
  DollarSign,
  Timer,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  Fuel,
  Cloud,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

// Types for better type safety and backend integration
interface Offer {
  id: string;
  party: 'buyer' | 'seller';
  price: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined' | 'counter-offered';
  sentBy: 'platform' | 'buyer' | 'seller';
  counterTo?: string;
  originalPrice?: string;
}

interface TransportEstimate {
  distance: number;
  duration: number;
  cost: number;
  route?: string;
  calculated: boolean;
}

interface Negotiation {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  offers: Offer[];
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  lastActivity: string;
}

interface TransportBid {
  id: string;
  transporterId: string;
  price: string;
  eta: string;
  specialRequirements?: string[];
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function OperationsScreen() {
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [activeView, setActiveView] = useState('operations');
  const [selectedBuyOrder, setSelectedBuyOrder] = useState<any>(null);
  const [selectedSellOrder, setSelectedSellOrder] = useState<any>(null);
  const [matchedTransporter, setMatchedTransporter] = useState<any>(null);
  const [activeTradeFlow, setActiveTradeFlow] = useState<any>(null);
  const [tradeFlowStage, setTradeFlowStage] = useState('matching');
  const [counterOffers, setCounterOffers] = useState<Offer[]>([]);
  const [customOfferValues, setCustomOfferValues] = useState({ buyer: '', seller: '' });
  const [offerStatuses, setOfferStatuses] = useState<any>({});
  const [transportBids, setTransportBids] = useState<TransportBid[]>([]);
  const [biddingTimeLeft, setBiddingTimeLeft] = useState(48);
  const [transportEstimate, setTransportEstimate] = useState<TransportEstimate | null>(null);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [bidConfiguration, setBidConfiguration] = useState<any>({
    ratePerKm: 2.5,
    published: false,
    minBidders: 3,
    duration: 48,
  });
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [multiPartyNegotiation, setMultiPartyNegotiation] = useState<any>(null);

  const buyOrders = [
    {
      id: 'BUY-001',
      product: 'Organic Wheat',
      buyer: 'Fresh Market Co',
      quantity: '500',
      unit: 'tons',
      maxPrice: '$320',
      priceUnit: '/ton',
      location: 'Chicago, IL',
      flag: '🇺🇸',
      deadline: '2025-06-25',
      requirements: ['Organic Certified', 'Grade A', 'Non-GMO'],
      urgency: 'high',
    },
    {
      id: 'BUY-002',
      product: 'Sweet Corn',
      buyer: 'Global Food Distributors',
      quantity: '200',
      unit: 'tons',
      maxPrice: '$280',
      priceUnit: '/ton',
      location: 'New York, NY',
      flag: '🇺🇸',
      deadline: '2025-06-30',
      requirements: ['Non-GMO', 'Fresh', 'Protein +15%'],
      urgency: 'medium',
    },
    {
      id: 'BUY-003',
      product: 'Mixed Vegetables',
      buyer: 'Restaurant Supply Chain',
      quantity: '150',
      unit: 'tons',
      maxPrice: '$450',
      priceUnit: '/ton',
      location: 'Los Angeles, CA',
      flag: '🇺🇸',
      deadline: '2025-06-22',
      requirements: ['Fresh', 'Local Preferred', 'Pesticide Free'],
      urgency: 'critical',
    },
  ];

  const sellOrders = [
    {
      id: 'SELL-001',
      product: 'Organic Wheat',
      farmer: 'Green Valley Farms',
      quantity: '600',
      unit: 'tons',
      minPrice: '$300',
      priceUnit: '/ton',
      location: 'Iowa, USA',
      flag: '🇺🇸',
      harvestDate: '2025-06-20',
      categories: ['Organic Certified', 'Grade A', 'Premium Quality'],
      quality: 'premium',
    },
    {
      id: 'SELL-002',
      product: 'Sweet Corn',
      farmer: 'Sunrise Orchards',
      quantity: '300',
      unit: 'tons',
      minPrice: '$260',
      priceUnit: '/ton',
      location: 'Illinois, USA',
      flag: '🇺🇸',
      harvestDate: '2025-06-18',
      categories: ['Non-GMO', 'High Protein'],
      quality: 'standard',
    },
    {
      id: 'SELL-003',
      product: 'Mixed Vegetables',
      farmer: 'Valley Fresh Produce',
      quantity: '200',
      unit: 'tons',
      minPrice: '$420',
      priceUnit: '/ton',
      location: 'California, USA',
      flag: '🇺🇸',
      harvestDate: '2025-06-15',
      categories: ['Fresh', 'Local', 'Organic'],
      quality: 'premium',
    },
  ];

  const transporters = [
    {
      id: 'TRANS-001',
      company: 'Swift Transport LLC',
      capacity: '50',
      unit: 'tons',
      rate: '$2.5',
      rateUnit: '/mile',
      truckCount: 12,
      specialization: ['Refrigerated', 'Bulk'],
      location: 'Texas, USA',
      flag: '🇺🇸',
      rating: 4.8,
      availability: 'available',
    },
    {
      id: 'TRANS-002',
      company: 'AgriLogistics Pro',
      capacity: '75',
      unit: 'tons',
      rate: '$2.2',
      rateUnit: '/mile',
      truckCount: 8,
      specialization: ['Temperature Controlled', 'Express'],
      location: 'Florida, USA',
      flag: '🇺🇸',
      rating: 4.6,
      availability: 'available',
    },
    {
      id: 'TRANS-003',
      company: 'Cold Chain Express',
      capacity: '100',
      unit: 'tons',
      rate: '$3.0',
      rateUnit: '/mile',
      truckCount: 15,
      specialization: ['Refrigerated', 'Long Distance'],
      location: 'California, USA',
      flag: '🇺🇸',
      rating: 4.9,
      availability: 'busy',
    },
  ];

  const trades = [
    {
      id: 'TR-CORN-001',
      name: 'MIDWEST CORN SHIPMENT',
      status: 'in-transit',
      priority: 'high',
      origin: 'Iowa, USA',
      destination: 'Chicago, IL',
      quantity: '500 tons',
      progress: 75,
      startDate: '2025-06-15',
      estimatedDelivery: '2025-06-18',
      description: 'Premium grade corn delivery to processing facility',
      milestones: ['Order confirmed', 'Pickup completed', 'In transit', 'Delivery pending'],
      farmer: 'Green Valley Farms',
      buyer: 'Midwest Processing Co',
      transporter: 'AgriLogistics Pro',
    },
    {
      id: 'TR-WHEAT-002',
      name: 'ORGANIC WHEAT EXPORT',
      status: 'negotiating',
      priority: 'medium',
      origin: 'Kansas, USA',
      destination: 'Port of Seattle',
      quantity: '1200 tons',
      progress: 25,
      startDate: '2025-06-20',
      estimatedDelivery: '2025-06-28',
      description: 'Organic wheat for international export',
      milestones: ['Price negotiation', 'Contract pending', 'Logistics planning', 'Delivery scheduled'],
      farmer: 'Prairie Wheat Co',
      buyer: 'Global Grain Exports',
      transporter: 'Swift Transport LLC',
    },
    {
      id: 'TR-APPLE-003',
      name: 'FRESH APPLE DELIVERY',
      status: 'delivered',
      priority: 'low',
      origin: 'Washington, USA',
      destination: 'Los Angeles, CA',
      quantity: '200 tons',
      progress: 100,
      startDate: '2025-06-10',
      estimatedDelivery: '2025-06-12',
      description: 'Fresh Gala apples for retail distribution',
      milestones: ['Order placed', 'Harvested', 'Shipped', 'Delivered'],
      farmer: 'Sunrise Orchards',
      buyer: 'Fresh Market Co',
      transporter: 'Cold Chain Express',
    },
    {
      id: 'TR-SOY-004',
      name: 'SOYBEAN BULK ORDER',
      status: 'confirmed',
      priority: 'high',
      origin: 'Illinois, USA',
      destination: 'New Orleans, LA',
      quantity: '800 tons',
      progress: 60,
      startDate: '2025-06-12',
      estimatedDelivery: '2025-06-20',
      description: 'Non-GMO soybeans for export processing',
      milestones: ['Contract signed', 'Quality inspection', 'Loading in progress', 'Transit pending'],
      farmer: 'Heartland Soy Farms',
      buyer: 'Export Commodities Inc',
      transporter: 'Bulk Transport Solutions',
    },
    {
      id: 'TR-VEG-005',
      name: 'MIXED VEGETABLE ORDER',
      status: 'delayed',
      priority: 'critical',
      origin: 'California, USA',
      destination: 'Denver, CO',
      quantity: '150 tons',
      progress: 40,
      startDate: '2025-06-08',
      estimatedDelivery: '2025-06-15',
      description: 'Fresh mixed vegetables for restaurant chain',
      milestones: ['Order confirmed', 'Harvest delayed', 'Rescheduling', 'New delivery date'],
      farmer: 'Valley Fresh Produce',
      buyer: 'Restaurant Supply Chain',
      transporter: 'Fresh Logistics Pro',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit':
        return 'bg-blue-500/20';
      case 'negotiating':
        return 'bg-orange-500/20';
      case 'delivered':
        return 'bg-green-500/20';
      case 'confirmed':
        return 'bg-white/20';
      case 'delayed':
        return 'bg-red-500/20';
      default:
        return 'bg-neutral-500/20';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'in-transit':
        return 'text-blue-500';
      case 'negotiating':
        return 'text-orange-500';
      case 'delivered':
        return 'text-green-500';
      case 'confirmed':
        return 'text-white';
      case 'delayed':
        return 'text-red-500';
      default:
        return 'text-neutral-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20';
      case 'high':
        return 'bg-orange-500/20';
      case 'medium':
        return 'bg-neutral-500/20';
      case 'low':
        return 'bg-green-500/20';
      default:
        return 'bg-neutral-500/20';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-neutral-300';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-neutral-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-transit':
        return <Truck width={16} height={16} color="#3b82f6" />;
      case 'negotiating':
        return <Clock width={16} height={16} color="#f97316" />;
      case 'delivered':
        return <CheckCircle width={16} height={16} color="#22c55e" />;
      case 'confirmed':
        return <Package width={16} height={16} color="#ffffff" />;
      case 'delayed':
        return <XCircleIcon width={16} height={16} color="#ef4444" />;
      default:
        return <AlertTriangle width={16} height={16} color="#a3a3a3" />;
    }
  };

  // Automatic transport calculation when orders are selected
  useEffect(() => {
    if (selectedBuyOrder && selectedSellOrder && !transportEstimate?.calculated) {
      calculateTransportEstimate();
    }
  }, [selectedBuyOrder, selectedSellOrder]);

  const calculateTransportEstimate = async (buyOrder?: any, sellOrder?: any) => {
    const buyer = buyOrder || selectedBuyOrder;
    const seller = sellOrder || selectedSellOrder;
    
    if (!buyer || !seller) return;
    
    // Set loading state
    setTransportEstimate({
      distance: 0,
      duration: 0,
      cost: 0,
      route: `${seller.location} → ${buyer.location}`,
      calculated: false,
      loading: true,
      pricePerKm: 2.5, // €2.50 per km standard rate
    });
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock calculation based on locations
      const locationDistances: { [key: string]: number } = {
        'Iowa, USA-Chicago, IL': 485,
        'Illinois, USA-New York, NY': 1200,
        'California, USA-Los Angeles, CA': 120,
        'Kansas, USA-Denver, CO': 620,
        'Nebraska, USA-Chicago, IL': 780,
      };

      const routeKey = `${seller.location}-${buyer.location}`;
      const distance = locationDistances[routeKey] || Math.floor(Math.random() * 800 + 200);
      
      const pricePerKm = 2.5; // €2.50 per km
      const duration = parseFloat((distance / 80).toFixed(1)); // hours at 80 km/h average
      const cost = distance * pricePerKm;
      
      setTransportEstimate({
        distance,
        duration,
        cost,
        route: `${seller.location} → ${buyer.location}`,
        calculated: true,
        loading: false,
        pricePerKm,
        origin: seller.location,
        destination: buyer.location,
        estimatedFuel: Math.floor(distance * 0.15), // liters
        co2Emissions: parseFloat((distance * 0.26).toFixed(1)), // kg CO2
      });
    }, 1000);
  };

  const navigateToStage = (stage: string) => {
    setTradeFlowStage(stage);
  };

  const resetTradeFlow = () => {
    setActiveTradeFlow(null);
    setTradeFlowStage('matching');
    setCounterOffers([]);
    setTransportBids([]);
    setBiddingTimeLeft(48);
    setTransportEstimate(null);
    setNegotiations([]);
    setMultiPartyNegotiation(null);
  };

  const initiateTrade = () => {
    console.log('Initiating 1:1 Trade', { selectedBuyOrder, selectedSellOrder });
    if (selectedBuyOrder && selectedSellOrder) {
      const newTradeFlow = {
        id: `FLOW-${Date.now()}`,
        buyOrder: selectedBuyOrder,
        sellOrder: selectedSellOrder,
        stage: 'matching',
        createdAt: new Date().toISOString(),
        potentialMargin: calculateMargin(selectedBuyOrder, selectedSellOrder),
        transportEstimate,
        transporter: null,
      };
      console.log('Setting activeTradeFlow:', newTradeFlow);
      setActiveTradeFlow(newTradeFlow);
      setTradeFlowStage('matching');
      // Auto-calculate transport if not already done
      if (!transportEstimate && selectedBuyOrder && selectedSellOrder) {
        calculateTransportEstimate(selectedBuyOrder, selectedSellOrder);
      }
    }
  };

  const initiateMultiPartyNegotiation = () => {
    if (selectedBuyOrder && selectedSellers.length > 0) {
      const sellers = sellOrders.filter(order => selectedSellers.includes(order.id));
      // Create a trade flow for multi-party negotiation
      const newTradeFlow = {
        id: `MULTI-${Date.now()}`,
        buyOrder: selectedBuyOrder,
        sellOrder: sellers[0], // Use first seller as primary
        sellers, // Include all sellers
        stage: 'negotiating',
        createdAt: new Date().toISOString(),
        potentialMargin: calculateMargin(selectedBuyOrder, sellers[0]),
        transportEstimate,
        transporter: null,
        isMultiParty: true,
      };
      setActiveTradeFlow(newTradeFlow);
      setMultiPartyNegotiation({
        id: `NEG-${Date.now()}`,
        buyOrder: selectedBuyOrder,
        sellers,
        offers: [],
        createdAt: new Date().toISOString(),
        status: 'active',
      });
      setTradeFlowStage('negotiating');
      // Auto-calculate transport for first seller
      if (!transportEstimate && selectedBuyOrder && sellers[0]) {
        calculateTransportEstimate(selectedBuyOrder, sellers[0]);
      }
    }
  };

  const calculateMargin = (buyOrder: any, sellOrder: any) => {
    const buyPrice = parseFloat(buyOrder.maxPrice.replace('$', ''));
    const sellPrice = parseFloat(sellOrder.minPrice.replace('$', ''));
    return (((buyPrice - sellPrice) / buyPrice) * 100).toFixed(1);
  };

  const sendCounterOffer = (party: string, newPrice: string) => {
    const offer = {
      id: `OFFER-${Date.now()}`,
      party,
      price: newPrice,
      timestamp: new Date().toISOString(),
      status: 'pending',
      sentBy: 'platform',
    };
    setCounterOffers([...counterOffers, offer]);
    setOfferStatuses({ ...offerStatuses, [offer.id]: 'pending' });
    setTradeFlowStage('negotiating');
  };

  const handleOfferResponse = (offerId: string, response: string) => {
    setOfferStatuses({ ...offerStatuses, [offerId]: response });
    setCounterOffers(
      counterOffers.map((offer) =>
        offer.id === offerId ? { ...offer, status: response } : offer
      )
    );
  };

  const acceptTerms = () => {
    setTradeFlowStage('transport-search');
    setTimeout(() => {
      setTradeFlowStage('bidding');
      setBiddingTimeLeft(48);
    }, 2000);
  };

  const submitTransportBid = (transporter: any, bidPrice: string) => {
    const bid = {
      id: `BID-${Date.now()}`,
      transporter,
      price: bidPrice,
      timestamp: new Date().toISOString(),
    };
    setTransportBids([...transportBids, bid]);
  };

  const completeTrade = (winningBid: any) => {
    setMatchedTransporter(winningBid.transporter);
    setTradeFlowStage('completed');
    setActiveTradeFlow({
      ...activeTradeFlow,
      transporter: winningBid.transporter,
      finalTransportCost: winningBid.price,
      stage: 'completed',
    });
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'matching':
        return <Target width={16} height={16} color="#000000" />;
      case 'negotiating':
        return <MessageSquare width={16} height={16} color="#000000" />;
      case 'transport-search':
        return <Route width={16} height={16} color="#000000" />;
      case 'bidding':
        return <Gavel width={16} height={16} color="#000000" />;
      case 'completed':
        return <CheckCircle width={16} height={16} color="#000000" />;
      default:
        return <AlertTriangle width={16} height={16} color="#000000" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'matching':
        return 'bg-blue-500/20';
      case 'negotiating':
        return 'bg-orange-500/20';
      case 'transport-search':
        return 'bg-purple-500/20';
      case 'bidding':
        return 'bg-yellow-500/20';
      case 'completed':
        return 'bg-green-500/20';
      default:
        return 'bg-neutral-500/20';
    }
  };

  const getStageTextColor = (stage: string) => {
    switch (stage) {
      case 'matching':
        return 'text-blue-500';
      case 'negotiating':
        return 'text-orange-500';
      case 'transport-search':
        return 'text-purple-500';
      case 'bidding':
        return 'text-yellow-500';
      case 'completed':
        return 'text-green-500';
      default:
        return 'text-neutral-300';
    }
  };

  const createTrade = () => {
    if (selectedBuyOrder && selectedSellOrder && matchedTransporter) {
      Alert.alert(
        'Trade Created',
        `${selectedSellOrder.farmer} → ${selectedBuyOrder.buyer} via ${matchedTransporter.company}`
      );
      setSelectedBuyOrder(null);
      setSelectedSellOrder(null);
      setMatchedTransporter(null);
    }
  };

  const getTradeStages = (status: string) => {
    switch (status) {
      case 'negotiating':
        return [
          { name: 'Negotiating', icon: MessageSquare, active: true },
          { name: 'Confirmed', icon: CheckCircle, active: false },
          { name: 'In Transit', icon: Truck, active: false },
          { name: 'Delivered', icon: Package, active: false },
        ];
      case 'confirmed':
        return [
          { name: 'Negotiating', icon: MessageSquare, active: false, completed: true },
          { name: 'Confirmed', icon: CheckCircle, active: true },
          { name: 'In Transit', icon: Truck, active: false },
          { name: 'Delivered', icon: Package, active: false },
        ];
      case 'in-transit':
        return [
          { name: 'Negotiating', icon: MessageSquare, active: false, completed: true },
          { name: 'Confirmed', icon: CheckCircle, active: false, completed: true },
          { name: 'In Transit', icon: Truck, active: true },
          { name: 'Delivered', icon: Package, active: false },
        ];
      case 'delivered':
        return [
          { name: 'Negotiating', icon: MessageSquare, active: false, completed: true },
          { name: 'Confirmed', icon: CheckCircle, active: false, completed: true },
          { name: 'In Transit', icon: Truck, active: false, completed: true },
          { name: 'Delivered', icon: Package, active: false, completed: true },
        ];
      case 'delayed':
        return [
          { name: 'Negotiating', icon: MessageSquare, active: false, completed: true },
          { name: 'Confirmed', icon: CheckCircle, active: false, completed: true },
          { name: 'Delayed', icon: XCircleIcon, active: true },
          { name: 'Delivered', icon: Package, active: false },
        ];
      default:
        return [
          { name: 'Negotiating', icon: MessageSquare, active: true },
          { name: 'Confirmed', icon: CheckCircle, active: false },
          { name: 'In Transit', icon: Truck, active: false },
          { name: 'Delivered', icon: Package, active: false },
        ];
    }
  };

  const TradeCard = ({ trade }: { trade: any }) => {
    const stages = getTradeStages(trade.status);
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedTrade(trade)}
        className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-4"
      >
        <View className="flex-row items-start justify-between mb-3">
          <View>
            <Text className="text-sm font-bold text-white tracking-wider">{trade.name}</Text>
            <Text className="text-xs text-neutral-400 font-mono">{trade.id}</Text>
          </View>
          <View className={`px-2 py-1 rounded ${getStatusColor(trade.status)}`}>
            <Text className={`text-xs ${getStatusTextColor(trade.status)}`}>
              {trade.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Progress Stages */}
        <View className="relative mb-4">
          <View className="absolute top-4 left-0 right-0 h-0.5 bg-neutral-700">
            <View 
              className="h-full bg-green-500"
              style={{ 
                width: `${(stages.filter(s => s.completed).length / (stages.length - 1)) * 100}%` 
              }}
            />
          </View>
          
          <View className="flex-row justify-between mb-2">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <View key={stage.name} className="items-center" style={{ flex: 1 }}>
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      stage.active
                        ? 'bg-yellow-500 pulse-yellow'
                        : stage.completed
                        ? 'bg-green-500'
                        : 'bg-neutral-700'
                    }`}
                    style={stage.active ? {
                      shadowColor: '#eab308',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 8,
                      elevation: 5,
                    } : {}}
                  >
                    <Icon
                      width={16}
                      height={16}
                      color={stage.active || stage.completed ? '#000000' : '#a3a3a3'}
                    />
                  </View>
                  <Text className="text-xs text-neutral-400 mt-1 text-center">
                    {stage.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Trade Details */}
        <View className="space-y-2 mb-3">
          <View className="flex-row items-center gap-2">
            <MapPin width={12} height={12} color="#a3a3a3" />
            <Text className="text-xs text-neutral-400">
              {trade.origin} → {trade.destination}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Weight width={12} height={12} color="#a3a3a3" />
            <Text className="text-xs text-neutral-400">{trade.quantity}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Calendar width={12} height={12} color="#a3a3a3" />
            <Text className="text-xs text-neutral-400">Est. delivery: {trade.estimatedDelivery}</Text>
          </View>
        </View>

        {/* Participants Grid */}
        <View className="flex-row justify-between pt-3 border-t border-neutral-800">
          <View className="flex-1 items-center">
            <Text className="text-xs text-neutral-400 mb-1">Farmer</Text>
            <Text className="text-xs text-white font-medium text-center">{trade.farmer}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xs text-neutral-400 mb-1">Buyer</Text>
            <Text className="text-xs text-white font-medium text-center">{trade.buyer}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xs text-neutral-400 mb-1">Transport</Text>
            <Text className="text-xs text-white font-medium text-center">{trade.transporter}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      className="flex-1 bg-black" 
      contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      {/* Header */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-white tracking-wider">TRADE OPERATIONS</Text>
            <Text className="text-sm text-neutral-400">Monitor trades and match orders with transporters</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveView('operations')}
            className={`px-4 py-2 rounded-lg ${
              activeView === 'operations' ? 'bg-green-600' : 'bg-neutral-700'
            }`}
          >
            <Text className="text-white font-medium">Operations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveView('matcher')}
            className={`px-4 py-2 rounded-lg ${
              activeView === 'matcher' ? 'bg-green-600' : 'bg-neutral-700'
            }`}
          >
            <Text className="text-white font-medium">Matcher</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeView === 'operations' ? (
        <>
          {/* Stats Overview */}
          <View className={`${screenWidth >= 768 ? 'flex-row' : 'space-y-2'} gap-2 mb-6`}>
            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">ACTIVE TRADES</Text>
                  <Text className="text-2xl font-bold text-white font-mono">47</Text>
                </View>
                <Truck width={32} height={32} color="#3b82f6" />
              </View>
            </View>

            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">DELIVERED</Text>
                  <Text className="text-2xl font-bold text-green-500 font-mono">324</Text>
                </View>
                <CheckCircle width={32} height={32} color="#22c55e" />
              </View>
            </View>

            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">DELAYED</Text>
                  <Text className="text-2xl font-bold text-red-500 font-mono">8</Text>
                </View>
                <XCircleIcon width={32} height={32} color="#ef4444" />
              </View>
            </View>

            <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-neutral-400 tracking-wider">SUCCESS RATE</Text>
                  <Text className="text-2xl font-bold text-white font-mono">96%</Text>
                </View>
                <Package width={32} height={32} color="#fff" />
              </View>
            </View>
          </View>

          {/* Trade Operations List */}
          <View>
            {trades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </View>
        </>
      ) : (
        /* Enhanced matcher system interface */
        <View>
          {!activeTradeFlow && !multiPartyNegotiation && (
            <View className="bg-neutral-900 border border-neutral-700 rounded-lg mb-4">
              <View className="p-3 border-b border-neutral-700">
                <Text className="text-sm font-medium text-neutral-300 tracking-wider">
                  SELECT TRADE PARTICIPANTS
                </Text>
              </View>
              <View className="p-3">
                <View className={`${screenWidth >= 768 ? 'flex-row' : ''} ${screenWidth >= 768 ? 'gap-3' : 'space-y-3'}`}>
                  <View className="flex-1 space-y-2">
                    <Text className="text-xs text-blue-400 tracking-wider">BUYER</Text>
                    {selectedBuyOrder ? (
                      <View className="p-2 bg-neutral-800 border border-neutral-700 rounded">
                        <Text className="text-sm font-bold text-white mb-1">{selectedBuyOrder.product}</Text>
                        <Text className="text-xs text-neutral-300 mb-1">{selectedBuyOrder.buyer}</Text>
                        <View className="flex-row items-center gap-1 mb-1">
                          <MapPin width={10} height={10} color="#6b7280" />
                          <Text className="text-xs text-neutral-400">{selectedBuyOrder.flag} {selectedBuyOrder.location}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">
                            {selectedBuyOrder.quantity} {selectedBuyOrder.unit}
                          </Text>
                          <Text className="text-xs text-green-400 font-mono">
                            {selectedBuyOrder.maxPrice}/ton
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View className="p-2 bg-neutral-800 border border-neutral-700 rounded">
                        <Text className="text-xs text-neutral-500">Select a buy order below</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1 space-y-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-green-400 tracking-wider">SELLER</Text>
                      {selectedBuyOrder && (
                        <TouchableOpacity
                          onPress={() => setSelectedSellers([])}
                          className="px-2 py-1 bg-neutral-700 rounded"
                        >
                          <Text className="text-xs text-neutral-300">
                            {selectedSellers.length > 0 ? `${selectedSellers.length} Selected` : 'Multi-Select'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {selectedSellOrder ? (
                      <View className="p-2 bg-neutral-800 border border-neutral-700 rounded">
                        <Text className="text-sm font-bold text-white mb-1">{selectedSellOrder.product}</Text>
                        <Text className="text-xs text-neutral-300 mb-1">{selectedSellOrder.farmer}</Text>
                        <View className="flex-row items-center gap-1 mb-1">
                          <MapPin width={10} height={10} color="#6b7280" />
                          <Text className="text-xs text-neutral-400">{selectedSellOrder.flag} {selectedSellOrder.location}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">
                            {selectedSellOrder.quantity} {selectedSellOrder.unit}
                          </Text>
                          <Text className="text-xs text-green-400 font-mono">
                            {selectedSellOrder.minPrice}/ton
                          </Text>
                        </View>
                      </View>
                    ) : selectedSellers.length > 0 ? (
                      <View className="p-2 bg-neutral-800 border border-neutral-700 rounded">
                        <Text className="text-sm font-bold text-white mb-1">Multiple Sellers</Text>
                        <Text className="text-xs text-neutral-400">
                          {selectedSellers.length} sellers selected for negotiation
                        </Text>
                      </View>
                    ) : (
                      <View className="p-2 bg-neutral-800 border border-neutral-700 rounded">
                        <Text className="text-xs text-neutral-500">Select seller(s) below</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons - Moved below and made more prominent */}
                <View className="mt-4 flex-row gap-2">
                  <TouchableOpacity
                    onPress={initiateTrade}
                    disabled={!selectedBuyOrder || !selectedSellOrder}
                    className={`flex-1 px-4 py-3 rounded-lg flex-row items-center justify-center ${
                      selectedBuyOrder && selectedSellOrder
                        ? 'bg-green-600'
                        : 'bg-neutral-700'
                    }`}
                  >
                    <Zap width={16} height={16} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Start 1:1 Trade</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={initiateMultiPartyNegotiation}
                    disabled={!selectedBuyOrder || selectedSellers.length === 0}
                    className={`flex-1 px-4 py-3 rounded-lg flex-row items-center justify-center ${
                      selectedBuyOrder && selectedSellers.length > 0
                        ? 'bg-orange-600'
                        : 'bg-neutral-700'
                    }`}
                  >
                    <MessageSquare width={16} height={16} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Multi-Party Trade</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {!activeTradeFlow && !multiPartyNegotiation && (
            <View className={`${screenWidth >= 768 ? 'flex-row gap-4' : ''} ${screenWidth < 768 ? 'space-y-4' : ''}`}>
              {/* Buy Orders */}
              <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg">
                <View className="p-3 border-b border-neutral-700">
                  <Text className="text-sm font-medium text-blue-400 tracking-wider">BUY ORDERS</Text>
                </View>
                <View className="p-3 space-y-2">
                  {buyOrders.map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      onPress={() => {
                        setSelectedBuyOrder(order);
                        // Reset seller selection when buyer changes
                        setSelectedSellOrder(null);
                        setSelectedSellers([]);
                      }}
                      className={`p-2 rounded border ${
                        selectedBuyOrder?.id === order.id
                          ? 'bg-neutral-700 border-blue-500/50'
                          : 'bg-neutral-800 border-neutral-700'
                      }`}
                    >
                      <View className="flex-row justify-between items-start mb-1">
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white mb-1">{order.product}</Text>
                          <Text className="text-xs text-neutral-300">{order.buyer}</Text>
                        </View>
                        <View className="items-end">
                          {selectedBuyOrder?.id === order.id && (
                            <View className="bg-blue-500/20 px-1.5 py-0.5 rounded mb-1">
                              <Text className="text-xs text-blue-400">✓</Text>
                            </View>
                          )}
                          <View className={`px-1.5 py-0.5 rounded ${
                            order.urgency === 'critical'
                              ? 'bg-neutral-700'
                              : order.urgency === 'high'
                              ? 'bg-neutral-700'
                              : 'bg-neutral-700'
                          }`}>
                            <Text className={`text-xs ${
                              order.urgency === 'critical'
                                ? 'text-red-400'
                                : order.urgency === 'high'
                                ? 'text-orange-400'
                                : 'text-yellow-400'
                            }`}>{order.urgency}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View className="flex-row flex-wrap gap-1 mb-1">
                        {order.requirements.slice(0, 2).map((req, idx) => (
                          <View key={idx} className="px-1.5 py-0.5 bg-neutral-700 rounded">
                            <Text className="text-xs text-neutral-400">{req}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <View className="flex-row items-center gap-1 mb-1">
                        <MapPin width={10} height={10} color="#6b7280" />
                        <Text className="text-xs text-neutral-400">{order.flag} {order.location}</Text>
                      </View>
                      
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-neutral-400">
                          {order.quantity} {order.unit}
                        </Text>
                        <Text className="text-xs text-green-400 font-mono">
                          {order.maxPrice}/ton
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sell Orders */}
              <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg">
                <View className="p-3 border-b border-neutral-700">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-medium text-green-400 tracking-wider">SELL ORDERS</Text>
                    {selectedSellers.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedSellers([]);
                          setSelectedSellOrder(null);
                        }}
                        className="px-2 py-1 bg-neutral-700 rounded"
                      >
                        <Text className="text-xs text-neutral-300">Clear ({selectedSellers.length})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View className="p-3 space-y-2">
                  {sellOrders.map((order) => {
                    const isSelected = selectedSellOrder?.id === order.id;
                    const isMultiSelected = selectedSellers.includes(order.id);
                    
                    return (
                      <TouchableOpacity
                        key={order.id}
                        onPress={() => {
                          if (selectedBuyOrder) {
                            // Multi-select mode if buyer is selected
                            if (isMultiSelected) {
                              setSelectedSellers(selectedSellers.filter(id => id !== order.id));
                            } else {
                              setSelectedSellers([...selectedSellers, order.id]);
                            }
                            setSelectedSellOrder(null);
                          } else {
                            // Single select mode
                            setSelectedSellOrder(order);
                            setSelectedSellers([]);
                          }
                        }}
                        className={`p-2 rounded border ${
                          isSelected || isMultiSelected
                            ? 'bg-neutral-700 border-green-500/50'
                            : 'bg-neutral-800 border-neutral-700'
                        }`}
                      >
                        <View className="flex-row justify-between items-start mb-1">
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-white mb-1">{order.product}</Text>
                            <Text className="text-xs text-neutral-300">{order.farmer}</Text>
                          </View>
                          <View className="items-end">
                            {(isSelected || isMultiSelected) && (
                              <View className="bg-green-500/20 px-1.5 py-0.5 rounded mb-1">
                                <Text className="text-xs text-green-400">✓</Text>
                              </View>
                            )}
                            <View className={`px-1.5 py-0.5 rounded ${
                              order.quality === 'premium'
                                ? 'bg-neutral-700'
                                : 'bg-neutral-700'
                            }`}>
                              <Text className="text-xs text-neutral-300">{order.quality}</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View className="flex-row flex-wrap gap-1 mb-1">
                          {order.categories.slice(0, 2).map((cat, idx) => (
                            <View key={idx} className="px-1.5 py-0.5 bg-neutral-700 rounded">
                              <Text className="text-xs text-neutral-400">{cat}</Text>
                            </View>
                          ))}
                        </View>
                        
                        <View className="flex-row items-center gap-1 mb-1">
                          <MapPin width={10} height={10} color="#6b7280" />
                          <Text className="text-xs text-neutral-400">{order.flag} {order.location}</Text>
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">
                            {order.quantity} {order.unit}
                          </Text>
                          <Text className="text-xs text-green-400 font-mono">
                            {order.minPrice}/ton
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Transporters */}
              <View className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg">
                <View className="p-3 border-b border-neutral-700">
                  <Text className="text-sm font-medium text-yellow-400 tracking-wider">TRANSPORTERS</Text>
                </View>
                <View className="p-3 space-y-2">
                  {transporters.map((transporter) => (
                    <View
                      key={transporter.id}
                      className="p-2 rounded border bg-neutral-800 border-neutral-700"
                    >
                      <View className="flex-row justify-between items-start mb-1">
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white mb-1">{transporter.company}</Text>
                          <View className="flex-row items-center gap-1">
                            <MapPin width={10} height={10} color="#6b7280" />
                            <Text className="text-xs text-neutral-400">{transporter.flag} {transporter.location}</Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <View className={`px-1.5 py-0.5 rounded mb-1 ${
                            transporter.availability === 'available'
                              ? 'bg-neutral-700'
                              : 'bg-neutral-700'
                          }`}>
                            <Text className={`text-xs ${
                              transporter.availability === 'available'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}>{transporter.availability}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Star width={12} height={12} color="#eab308" fill="#eab308" />
                            <Text className="text-xs text-neutral-400">{transporter.rating}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View className="flex-row flex-wrap gap-1 mb-1">
                        {transporter.specialization.slice(0, 2).map((spec, idx) => (
                          <View key={idx} className="px-1.5 py-0.5 bg-neutral-700 rounded">
                            <Text className="text-xs text-neutral-400">{spec}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-neutral-400">
                          {transporter.capacity} {transporter.unit}, {transporter.truckCount} trucks
                        </Text>
                        <Text className="text-xs text-yellow-400 font-mono">
                          {transporter.rate}/mile
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTradeFlow && (
            <View className="bg-neutral-900 border border-neutral-700 rounded-lg mb-4">
              <View className="p-3 border-b border-neutral-700">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    {getStageIcon(tradeFlowStage)}
                    <Text className="text-base font-bold text-white tracking-wider">
                      ACTIVE TRADE FLOW - {activeTradeFlow.id}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className={`px-2 py-1 rounded ${getStageColor(tradeFlowStage)}`}>
                      <Text className={`text-xs ${getStageTextColor(tradeFlowStage)}`}>
                        {tradeFlowStage.toUpperCase().replace('-', ' ')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={resetTradeFlow}
                      className="px-2 py-1 bg-red-600 rounded"
                    >
                      <Text className="text-xs text-white">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View className="p-3 space-y-3">
                {/* Trade Flow Progress */}
                <View className="relative mb-6">
                  <View className="absolute top-3 left-0 right-0 h-0.5 bg-neutral-700 rounded-full" />
                  <View 
                    className="absolute top-3 left-0 h-0.5 bg-yellow-500 rounded-full"
                    style={{ 
                      width: `${
                        ['matching', 'negotiating', 'transport-search', 'bidding', 'completed'].indexOf(tradeFlowStage) * 25
                      }%` 
                    }}
                  />
                  
                  <View className="flex-row justify-between">
                    {['matching', 'negotiating', 'transport-search', 'bidding', 'completed'].map((stage, index) => {
                      const isActive = tradeFlowStage === stage;
                      const isPassed = ['matching', 'negotiating', 'transport-search', 'bidding', 'completed'].indexOf(
                        tradeFlowStage
                      ) > index;
                      
                      return (
                        <View key={stage} className="items-center" style={{ flex: 1 }}>
                          <TouchableOpacity
                            onPress={() => navigateToStage(stage)}
                            className={`w-6 h-6 rounded-full items-center justify-center ${
                              isActive
                                ? 'bg-yellow-500'
                                : isPassed
                                ? 'bg-green-500'
                                : 'bg-neutral-700'
                            }`}
                          >
                            {React.cloneElement(getStageIcon(stage), { width: 12, height: 12 })}
                          </TouchableOpacity>
                          <Text className="text-xs text-neutral-400 mt-1 text-center">
                            {stage.replace('-', ' ')}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Stage-specific content */}
                {tradeFlowStage === 'matching' && (
                  <View className="space-y-3">
                    <View className={`${screenWidth >= 768 ? 'flex-row' : 'space-y-3'} gap-3`}>
                      <View className="flex-1 p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-xs font-bold text-blue-400 mb-2">BUYER MATCH</Text>
                        <Text className="text-sm text-white mb-1">{activeTradeFlow.buyOrder.product}</Text>
                        <Text className="text-xs text-neutral-400 mb-2">{activeTradeFlow.buyOrder.buyer}</Text>
                        <View className="flex-row items-center gap-1 mb-1">
                          <MapPin width={10} height={10} color="#6b7280" />
                          <Text className="text-xs text-neutral-500">
                            {activeTradeFlow.buyOrder.flag} {activeTradeFlow.buyOrder.location}
                          </Text>
                        </View>
                        <Text className="text-xs text-green-400 font-mono">
                          Max: {activeTradeFlow.buyOrder.maxPrice}/ton
                        </Text>
                      </View>

                      <View className="flex-1 p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-xs font-bold text-green-400 mb-2">SELLER MATCH</Text>
                        <Text className="text-sm text-white mb-1">{activeTradeFlow.sellOrder.product}</Text>
                        <Text className="text-xs text-neutral-400 mb-2">{activeTradeFlow.sellOrder.farmer}</Text>
                        <View className="flex-row items-center gap-1 mb-1">
                          <MapPin width={10} height={10} color="#6b7280" />
                          <Text className="text-xs text-neutral-500">
                            {activeTradeFlow.sellOrder.flag} {activeTradeFlow.sellOrder.location}
                          </Text>
                        </View>
                        <Text className="text-xs text-green-400 font-mono">
                          Min: {activeTradeFlow.sellOrder.minPrice}/ton
                        </Text>
                      </View>

                      <View className="flex-1 p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-xs font-bold text-orange-400 mb-2">TRANSPORT</Text>
                        {transportEstimate?.loading ? (
                          <View className="items-center py-2">
                            <Loader2 width={20} height={20} color="#f97316" />
                            <Text className="text-xs text-neutral-500 mt-1">Calculating route...</Text>
                          </View>
                        ) : transportEstimate?.calculated ? (
                          <>
                            <View className="flex-row items-center gap-1 mb-1">
                              <Route width={12} height={12} color="#f97316" />
                              <Text className="text-sm text-white">{transportEstimate.distance} km</Text>
                            </View>
                            <View className="flex-row items-center gap-1 mb-1">
                              <DollarSign width={12} height={12} color="#10b981" />
                              <Text className="text-xs text-neutral-400">
                                €{(transportEstimate.cost).toFixed(2).replace(/\.00$/, '')}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-1 mb-1">
                              <Clock width={12} height={12} color="#6b7280" />
                              <Text className="text-xs text-neutral-400">{transportEstimate.duration}h</Text>
                            </View>
                            <Text className="text-xs text-orange-400 font-mono">
                              €{(transportEstimate.pricePerKm).toFixed(2)}/km
                            </Text>
                          </>
                        ) : (
                          <Text className="text-xs text-neutral-500">Awaiting calculation...</Text>
                        )}
                      </View>
                    </View>

                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-bold text-white">PROFIT ANALYSIS</Text>
                        <Text className="text-lg font-bold text-green-400 font-mono">
                          {activeTradeFlow.potentialMargin}%
                        </Text>
                      </View>
                      <View className="space-y-1">
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">Price Spread:</Text>
                          <Text className="text-xs text-white font-mono">
                            ${(
                              parseFloat(activeTradeFlow.buyOrder.maxPrice.replace('$', '')) -
                              parseFloat(activeTradeFlow.sellOrder.minPrice.replace('$', ''))
                            ).toFixed(0)}/ton
                          </Text>
                        </View>
                        {transportEstimate?.calculated && (
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-neutral-400">Transport Cost:</Text>
                            <Text className="text-xs text-orange-400 font-mono">
                              ${(transportEstimate.cost / parseInt(activeTradeFlow.buyOrder.quantity)).toFixed(2)}/ton
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => navigateToStage('negotiating')}
                        className="flex-1 bg-neutral-700 rounded py-2 flex-row items-center justify-center"
                      >
                        <MessageSquare width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Negotiate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => navigateToStage('transport-search')}
                        className="flex-1 bg-green-600 rounded py-2 flex-row items-center justify-center"
                      >
                        <CheckCircle width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Accept & Transport</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {tradeFlowStage === 'negotiating' && (
                  <View className="space-y-3">
                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="text-sm font-bold text-orange-400">NEGOTIATION PHASE</Text>
                          <Text className="text-xs text-neutral-400">Optimizing deal terms</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-sm text-white font-mono">
                            {activeTradeFlow.potentialMargin}% margin
                          </Text>
                          <Text className="text-xs text-neutral-400">Current spread: $20/ton</Text>
                        </View>
                      </View>
                    </View>

                    {/* Participants Overview */}
                    <View className={`${screenWidth >= 768 ? 'flex-row' : 'space-y-3'} gap-3`}>
                      {/* Seller Card */}
                      <View className="flex-1 p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-xs font-bold text-green-400 mb-2">SELLER POSITION</Text>
                        <Text className="text-sm text-white font-mono">$300/ton</Text>
                        <Text className="text-xs text-neutral-400 mb-1">75 tons available</Text>
                        <View className="flex-row items-center gap-1">
                          <MapPin width={10} height={10} color="#6b7280" />
                          <Text className="text-xs text-neutral-500">🇺🇸 Nebraska</Text>
                        </View>
                      </View>

                      {/* Transport Card */}
                      <View className="flex-1 p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-xs font-bold text-orange-400 mb-2">TRANSPORT</Text>
                        {transportEstimate?.calculated ? (
                          <>
                            <Text className="text-sm text-white font-mono">{transportEstimate.distance} km</Text>
                            <Text className="text-xs text-neutral-400 mb-1">
                              ${(transportEstimate.cost / parseInt(activeTradeFlow.buyOrder.quantity)).toFixed(2)}/ton
                            </Text>
                            <Text className="text-xs text-orange-400">{transportEstimate.duration}h duration</Text>
                          </>
                        ) : (
                          <Text className="text-xs text-neutral-500">Calculating...</Text>
                        )}
                      </View>

                      {/* Buyer Card */}
                      <View className="flex-1 p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-xs font-bold text-blue-400 mb-2">BUYER POSITION</Text>
                        <Text className="text-sm text-white font-mono">$320/ton</Text>
                        <Text className="text-xs text-neutral-400 mb-1">50 tons needed</Text>
                        <View className="flex-row items-center gap-1">
                          <MapPin width={10} height={10} color="#6b7280" />
                          <Text className="text-xs text-neutral-500">🇺🇸 Iowa</Text>
                        </View>
                      </View>
                    </View>

                    {/* Profit Analysis */}
                    {transportEstimate?.calculated && (
                      <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <View className="flex-row items-center gap-2 mb-2">
                          <TrendingUp width={14} height={14} color="#22c55e" />
                          <Text className="text-sm font-bold text-white">PROFIT ANALYSIS</Text>
                        </View>
                        <View className={`${screenWidth >= 768 ? 'flex-row' : 'space-y-2'} gap-4`}>
                          <View className="flex-1">
                            <Text className="text-xs text-neutral-400">Revenue (50 tons)</Text>
                            <Text className="text-base text-green-400 font-mono">$16,000</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-neutral-400">Total Costs</Text>
                            <Text className="text-base text-red-400 font-mono">
                              ${(15000 + transportEstimate.cost).toLocaleString()}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-neutral-400">Net Profit</Text>
                            <Text className="text-base text-red-400 font-mono">
                              ${(16000 - 15000 - transportEstimate.cost).toFixed(0)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Negotiation Management */}
                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <TouchableOpacity
                        onPress={() => setShowOfferDetails(!showOfferDetails)}
                        className="flex-row items-center justify-between mb-3"
                      >
                        <Text className="text-sm font-bold text-white">OFFER MANAGEMENT</Text>
                        <ChevronDown
                          width={16}
                          height={16}
                          color="#fff"
                          style={{
                            transform: [{ rotate: showOfferDetails ? '180deg' : '0deg' }],
                          }}
                        />
                      </TouchableOpacity>

                      {showOfferDetails && (
                        <View className="space-y-3">
                          {/* Active Offers */}
                          <View className={`${screenWidth >= 768 ? 'flex-row' : 'space-y-2'} gap-2`}>
                            <View className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded">
                              <View className="flex-row items-center justify-between mb-1">
                                <Text className="text-xs text-blue-400 font-bold">BUYER OFFER</Text>
                                <View className="bg-neutral-700 px-2 py-0.5 rounded">
                                  <Text className="text-xs text-white">Active</Text>
                                </View>
                              </View>
                              <Text className="text-sm text-white font-mono">$320/ton</Text>
                            </View>

                            <View className="flex-1 p-2 bg-neutral-800 border border-neutral-700 rounded">
                              <View className="flex-row items-center justify-between mb-1">
                                <Text className="text-xs text-green-400 font-bold">SELLER OFFER</Text>
                                <View className="bg-neutral-700 px-2 py-0.5 rounded">
                                  <Text className="text-xs text-white">Active</Text>
                                </View>
                              </View>
                              <Text className="text-sm text-white font-mono">$300/ton</Text>
                            </View>
                          </View>

                          {/* Counter Offer Interface */}
                          <View className={`${screenWidth >= 768 ? 'flex-row' : 'space-y-3'} gap-3`}>
                            <View className="flex-1 p-3 bg-neutral-800 border border-neutral-700 rounded">
                              <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-xs text-blue-400 font-bold">COUNTER TO BUYER</Text>
                                <Text className="text-xs text-neutral-400">Current: $320</Text>
                              </View>
                              <View className="flex-row gap-2 mb-2">
                                <TextInput
                                  placeholder="315"
                                  placeholderTextColor="#6b7280"
                                  value={customOfferValues.buyer}
                                  onChangeText={(text) =>
                                    setCustomOfferValues({ ...customOfferValues, buyer: text })
                                  }
                                  keyboardType="numeric"
                                  className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-600 rounded text-white text-sm"
                                />
                                <TouchableOpacity
                                  onPress={() => sendCounterOffer('buyer', `$${customOfferValues.buyer}`)}
                                  disabled={!customOfferValues.buyer}
                                  className={`px-3 py-1 rounded ${
                                    customOfferValues.buyer ? 'bg-blue-600' : 'bg-neutral-700'
                                  }`}
                                >
                                  <Send width={14} height={14} color="#fff" />
                                </TouchableOpacity>
                              </View>
                              <View className="flex-row gap-1">
                                <TouchableOpacity
                                  onPress={() => sendCounterOffer('buyer', '$315')}
                                  className="flex-1 bg-neutral-700 py-1 rounded"
                                >
                                  <Text className="text-white text-xs text-center">$315</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => sendCounterOffer('buyer', '$310')}
                                  className="flex-1 bg-neutral-700 py-1 rounded"
                                >
                                  <Text className="text-white text-xs text-center">$310</Text>
                                </TouchableOpacity>
                              </View>
                            </View>

                            <View className="flex-1 p-3 bg-neutral-800 border border-neutral-700 rounded">
                              <View className="flex-row items-center justify-between mb-2">
                                <Text className="text-xs text-green-400 font-bold">COUNTER TO SELLER</Text>
                                <Text className="text-xs text-neutral-400">Current: $300</Text>
                              </View>
                              <View className="flex-row gap-2 mb-2">
                                <TextInput
                                  placeholder="305"
                                  placeholderTextColor="#6b7280"
                                  value={customOfferValues.seller}
                                  onChangeText={(text) =>
                                    setCustomOfferValues({ ...customOfferValues, seller: text })
                                  }
                                  keyboardType="numeric"
                                  className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-600 rounded text-white text-sm"
                                />
                                <TouchableOpacity
                                  onPress={() => sendCounterOffer('seller', `$${customOfferValues.seller}`)}
                                  disabled={!customOfferValues.seller}
                                  className={`px-3 py-1 rounded ${
                                    customOfferValues.seller ? 'bg-green-600' : 'bg-neutral-700'
                                  }`}
                                >
                                  <Send width={14} height={14} color="#fff" />
                                </TouchableOpacity>
                              </View>
                              <View className="flex-row gap-1">
                                <TouchableOpacity
                                  onPress={() => sendCounterOffer('seller', '$305')}
                                  className="flex-1 bg-neutral-700 py-1 rounded"
                                >
                                  <Text className="text-white text-xs text-center">$305</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => sendCounterOffer('seller', '$310')}
                                  className="flex-1 bg-neutral-700 py-1 rounded"
                                >
                                  <Text className="text-white text-xs text-center">$310</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>

                          {/* Offer History */}
                          {counterOffers.length > 0 && (
                            <View className="p-2 bg-neutral-900 border border-neutral-600 rounded">
                              <Text className="text-xs text-neutral-400 mb-2">RECENT OFFERS</Text>
                              <View className="space-y-1">
                                {counterOffers.slice(-3).map((offer) => (
                                  <View key={offer.id} className="flex-row justify-between items-center">
                                    <Text className="text-xs text-neutral-300">
                                      {offer.party.toUpperCase()}: {offer.price}/ton
                                    </Text>
                                    <View className={`px-2 py-0.5 rounded ${
                                      offer.status === 'pending' ? 'bg-yellow-500/20' :
                                      offer.status === 'accepted' ? 'bg-green-500/20' : 'bg-red-500/20'
                                    }`}>
                                      <Text className={`text-xs ${
                                        offer.status === 'pending' ? 'text-yellow-400' :
                                        offer.status === 'accepted' ? 'text-green-400' : 'text-red-400'
                                      }`}>
                                        {offer.status}
                                      </Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => navigateToStage('transport-search')}
                        className="flex-1 bg-green-600 rounded py-2 flex-row items-center justify-center"
                      >
                        <CheckCircle width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Accept Terms</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={resetTradeFlow}
                        className="px-4 bg-neutral-700 rounded py-2 flex-row items-center justify-center"
                      >
                        <X width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {tradeFlowStage === 'transport-search' && (
                  <View className="space-y-3">
                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <Text className="text-sm font-bold text-white mb-2">TRANSPORT SEARCH</Text>
                      <Text className="text-xs text-neutral-400">Finding closest transporters for optimal routing</Text>
                      {transportEstimate && (
                        <Text className="text-xs text-orange-400 mt-1">
                          Route: {transportEstimate.distance} km, ${transportEstimate.cost.toFixed(0)} estimated
                        </Text>
                      )}
                    </View>

                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <Text className="text-sm font-bold text-white mb-3">CLOSEST TRANSPORTERS</Text>
                      <View className="space-y-2">
                        {transporters
                          .sort((a, b) => a.rate.localeCompare(b.rate))
                          .map((transporter, index) => (
                          <View key={transporter.id} className="p-2 bg-neutral-800 border border-neutral-700 rounded">
                            <View className="flex-row justify-between items-start mb-2">
                              <View className="flex-1">
                                <Text className="text-sm text-white font-medium">{transporter.company}</Text>
                                <View className="flex-row items-center gap-1 mt-1">
                                  <MapPin width={10} height={10} color="#6b7280" />
                                  <Text className="text-xs text-neutral-400">{transporter.location}</Text>
                                </View>
                              </View>
                              <View className="items-end">
                                <Text className="text-sm text-white font-mono">{transporter.rate}/mile</Text>
                                <View className="flex-row items-center gap-1">
                                  <Star width={12} height={12} color="#eab308" fill="#eab308" />
                                  <Text className="text-xs text-neutral-400">{transporter.rating}</Text>
                                </View>
                              </View>
                            </View>
                            <View className="flex-row justify-between">
                              <Text className="text-xs text-neutral-400">
                                Capacity: {transporter.capacity} tons, {transporter.truckCount} trucks
                              </Text>
                              <View className={`px-2 py-0.5 rounded ${
                                transporter.availability === 'available' ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                                <Text className={`text-xs ${
                                  transporter.availability === 'available' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {transporter.availability}
                                </Text>
                              </View>
                            </View>
                            {index === 0 && (
                              <View className="mt-2 pt-2 border-t border-neutral-600">
                                <View className="flex-row gap-2">
                                  <TouchableOpacity
                                    onPress={() => {
                                      const bid: TransportBid = {
                                        id: `BID-${Date.now()}`,
                                        transporterId: transporter.id,
                                        price: `$${(transportEstimate?.cost || 1000).toFixed(0)}`,
                                        eta: '6 hours',
                                        timestamp: new Date().toISOString(),
                                        status: 'pending'
                                      };
                                      setTransportBids([bid]);
                                      navigateToStage('bidding');
                                    }}
                                    className="flex-1 bg-blue-600 rounded py-1.5 flex-row items-center justify-center"
                                  >
                                    <MessageSquare width={14} height={14} color="#fff" />
                                    <Text className="text-white text-xs ml-1">Direct Request</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => navigateToStage('bidding')}
                                    className="flex-1 bg-yellow-600 rounded py-1.5 flex-row items-center justify-center"
                                  >
                                    <Gavel width={14} height={14} color="#fff" />
                                    <Text className="text-white text-xs ml-1">Public Bid</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => navigateToStage('bidding')}
                        className="flex-1 bg-yellow-600 rounded py-2 flex-row items-center justify-center"
                      >
                        <Gavel width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Open Bidding</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={resetTradeFlow}
                        className="px-4 bg-neutral-700 rounded py-2 flex-row items-center justify-center"
                      >
                        <X width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {tradeFlowStage === 'bidding' && (
                  <View className="space-y-3">
                    {/* Bid Configuration */}
                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <Text className="text-sm font-bold text-white mb-3">BID CONFIGURATION</Text>
                      <View className="space-y-3">
                        <View>
                          <Text className="text-xs text-neutral-400 mb-1">Starting Rate (€/km)</Text>
                          <View className="flex-row items-center gap-2">
                            <TextInput
                              value={bidConfiguration?.ratePerKm?.toString() || '2.50'}
                              onChangeText={(text) => setBidConfiguration({ 
                                ...bidConfiguration, 
                                ratePerKm: parseFloat(text) || 2.5 
                              })}
                              keyboardType="decimal-pad"
                              className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white text-sm"
                              placeholder="2.50"
                              placeholderTextColor="#6b7280"
                            />
                            <Text className="text-xs text-neutral-400">€/km</Text>
                          </View>
                        </View>
                        
                        <View className="flex-row justify-between p-2 bg-neutral-900 border border-neutral-700 rounded">
                          <View>
                            <Text className="text-xs text-neutral-400">Route</Text>
                            <Text className="text-xs text-white mt-1">
                              {activeTradeFlow?.sellOrder?.location} → {activeTradeFlow?.buyOrder?.location}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-xs text-neutral-400">Distance</Text>
                            <Text className="text-xs text-white mt-1">{transportEstimate?.distance || 0} km</Text>
                          </View>
                        </View>
                        
                        <View className="flex-row justify-between p-2 bg-neutral-900 border border-neutral-700 rounded">
                          <View>
                            <Text className="text-xs text-neutral-400">Estimated Bid Range</Text>
                            <Text className="text-sm text-green-400 font-mono mt-1">
                              €{((transportEstimate?.distance || 0) * (bidConfiguration?.ratePerKm || 2.5) * 0.8).toFixed(2)} - 
                              €{((transportEstimate?.distance || 0) * (bidConfiguration?.ratePerKm || 2.5) * 1.2).toFixed(2)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setBidConfiguration({ ...bidConfiguration, published: true });
                              setBiddingTimeLeft(48);
                            }}
                            className="bg-green-600 px-3 py-2 rounded"
                          >
                            <Text className="text-white text-xs font-medium">Publish Bid</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Active Bidding */}
                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="text-sm font-bold text-white">LIVE AUCTION</Text>
                          <Text className="text-xs text-neutral-400">
                            {bidConfiguration?.published ? 'Accepting bids' : 'Configure bid above'}
                          </Text>
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-center gap-1 mb-1">
                            <Timer width={14} height={14} color="#eab308" />
                            <Text className="text-sm text-yellow-400 font-mono">{biddingTimeLeft}h left</Text>
                          </View>
                          <Text className="text-xs text-neutral-400">{transportBids.length} bids</Text>
                        </View>
                      </View>
                    </View>

                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <Text className="text-sm font-bold text-white mb-3">ACTIVE BIDS</Text>
                      <View className="space-y-2">
                        {transportBids.length > 0 ? (
                          transportBids
                            .sort((a, b) => parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', '')))
                            .map((bid, index) => {
                              const transporter = transporters.find(t => t.id === bid.transporterId);
                              return (
                                <View key={bid.id} className={`p-3 border rounded ${
                                  index === 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-neutral-800 border-neutral-700'
                                }`}>
                                  <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1">
                                      <View className="flex-row items-center gap-2">
                                        <Text className="text-sm text-white font-medium">
                                          {transporter?.company || 'Unknown Transporter'}
                                        </Text>
                                        {index === 0 && (
                                          <View className="bg-green-500/20 px-2 py-0.5 rounded">
                                            <Text className="text-xs text-green-400">LEADING BID</Text>
                                          </View>
                                        )}
                                      </View>
                                      <View className="flex-row items-center gap-2 mt-1">
                                        <View className="flex-row items-center gap-1">
                                          <MapPin width={10} height={10} color="#6b7280" />
                                          <Text className="text-xs text-neutral-400">{transporter?.location}</Text>
                                        </View>
                                        <View className="flex-row items-center gap-1">
                                          <Timer width={10} height={10} color="#6b7280" />
                                          <Text className="text-xs text-neutral-400">ETA: {bid.eta}</Text>
                                        </View>
                                      </View>
                                    </View>
                                    <View className="items-end">
                                      <Text className="text-sm text-white font-mono">
                                        €{parseFloat(bid.price.replace(/[^0-9.-]+/g, '')).toFixed(2)}
                                      </Text>
                                      <Text className="text-xs text-neutral-500">
                                        €{(parseFloat(bid.price.replace(/[^0-9.-]+/g, '')) / (transportEstimate?.distance || 1)).toFixed(2)}/km
                                      </Text>
                                      <View className="flex-row items-center gap-1 mt-1">
                                        <Star width={10} height={10} color="#eab308" fill="#eab308" />
                                        <Text className="text-xs text-neutral-400">{transporter?.rating}</Text>
                                      </View>
                                    </View>
                                  </View>
                                  {bid.specialRequirements && (
                                    <View className="flex-row flex-wrap gap-1 mt-1">
                                      {bid.specialRequirements.map((req, i) => (
                                        <View key={i} className="bg-neutral-700 px-1.5 py-0.5 rounded">
                                          <Text className="text-xs text-neutral-300">{req}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                  {index === 0 && (
                                    <View className="mt-2 pt-2 border-t border-neutral-600">
                                      <TouchableOpacity
                                        onPress={() => {
                                          completeTrade({ ...bid, transporter });
                                        }}
                                        className="bg-green-600 rounded py-1.5 flex-row items-center justify-center"
                                      >
                                        <CheckCircle width={14} height={14} color="#fff" />
                                        <Text className="text-white text-xs ml-1 font-medium">Accept This Bid</Text>
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              );
                            })
                        ) : (
                          <View className="p-4 bg-neutral-900 border border-neutral-600 rounded">
                            <Text className="text-center text-neutral-400 text-sm">Waiting for bids...</Text>
                            <Text className="text-center text-neutral-500 text-xs mt-1">
                              Transport providers will submit competitive offers
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Bid Monitoring */}
                    {bidConfiguration?.published && transportBids.length > 0 && (
                      <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-sm font-bold text-white mb-3">BID MONITORING</Text>
                        <View className="space-y-2">
                          <View className="flex-row justify-between p-2 bg-neutral-900 border border-neutral-700 rounded">
                            <View>
                              <Text className="text-xs text-neutral-400">Average Bid</Text>
                              <Text className="text-sm text-white font-mono">
                                €{(transportBids.reduce((sum, bid) => 
                                  sum + parseFloat(bid.price.replace(/[^0-9.-]+/g, '')), 0
                                ) / transportBids.length).toFixed(2)}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-xs text-neutral-400">Lowest Bid</Text>
                              <Text className="text-sm text-green-400 font-mono">
                                €{Math.min(...transportBids.map(b => 
                                  parseFloat(b.price.replace(/[^0-9.-]+/g, ''))
                                )).toFixed(2)}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-xs text-neutral-400">Highest Bid</Text>
                              <Text className="text-sm text-red-400 font-mono">
                                €{Math.max(...transportBids.map(b => 
                                  parseFloat(b.price.replace(/[^0-9.-]+/g, ''))
                                )).toFixed(2)}
                              </Text>
                            </View>
                          </View>
                          
                          <View className="p-2 bg-neutral-900 border border-neutral-700 rounded">
                            <Text className="text-xs text-neutral-400 mb-1">Bid Status</Text>
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center gap-2">
                                <View className="w-2 h-2 bg-green-500 rounded-full" />
                                <Text className="text-xs text-white">Active - Receiving Bids</Text>
                              </View>
                              <Text className="text-xs text-neutral-400">{transportBids.length} participants</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}

                    {transportBids.length === 0 && (
                      <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-sm font-bold text-white mb-2">SIMULATE BIDDING</Text>
                        <TouchableOpacity
                          onPress={() => {
                            const basePrice = (transportEstimate?.distance || 500) * (bidConfiguration?.ratePerKm || 2.5);
                            const mockBids: TransportBid[] = transporters.map((transporter, i) => ({
                              id: `BID-${Date.now()}-${i}`,
                              transporterId: transporter.id,
                              price: `€${(basePrice * (0.85 + Math.random() * 0.3)).toFixed(2)}`,
                              eta: `${Math.floor(transportEstimate?.duration || 6) + i}h ${Math.floor(Math.random() * 60)}m`,
                              timestamp: new Date().toISOString(),
                              status: 'pending' as const,
                              specialRequirements: transporter.specialization.slice(0, 2)
                            }));
                            setTransportBids(mockBids);
                          }}
                          className="bg-yellow-600 rounded py-2 flex-row items-center justify-center"
                        >
                          <Zap width={16} height={16} color="#fff" />
                          <Text className="text-white font-medium ml-2">Generate Sample Bids</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <View className="flex-row gap-2">
                      {transportBids.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            if (transportBids.length > 0) {
                              const winningBid = transportBids.sort((a, b) => 
                                parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''))
                              )[0];
                              const transporter = transporters.find(t => t.id === winningBid.transporterId);
                              completeTrade({ ...winningBid, transporter });
                            }
                          }}
                          className="flex-1 bg-green-600 rounded py-2 flex-row items-center justify-center"
                        >
                          <CheckCircle width={16} height={16} color="#fff" />
                          <Text className="text-white font-medium ml-2">Accept Winning Bid</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={resetTradeFlow}
                        className="px-4 bg-neutral-700 rounded py-2 flex-row items-center justify-center"
                      >
                        <X width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {tradeFlowStage === 'completed' && (
                  <View className="space-y-3">
                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <View className="flex-row items-center gap-2 mb-2">
                        <CheckCircle width={20} height={20} color="#22c55e" />
                        <Text className="text-sm font-bold text-white">TRADE COMPLETED</Text>
                      </View>
                      <Text className="text-xs text-neutral-400">Deal finalized and ready for execution</Text>
                    </View>

                    <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                      <Text className="text-sm font-bold text-white mb-3">TRADE SUMMARY</Text>
                      <View className="space-y-2">
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">Product:</Text>
                          <Text className="text-xs text-white">{activeTradeFlow.buyOrder.product}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">Quantity:</Text>
                          <Text className="text-xs text-white">{activeTradeFlow.buyOrder.quantity} tons</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-neutral-400">Final Price:</Text>
                          <Text className="text-xs text-green-400 font-mono">
                            ${((parseFloat(activeTradeFlow.buyOrder.maxPrice.replace('$', '')) + 
                               parseFloat(activeTradeFlow.sellOrder.minPrice.replace('$', ''))) / 2).toFixed(0)}/ton
                          </Text>
                        </View>
                        {transportEstimate && (
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-neutral-400">Transport Cost:</Text>
                            <Text className="text-xs text-orange-400 font-mono">
                              ${transportEstimate.cost.toFixed(0)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {matchedTransporter && (
                      <View className="p-3 bg-neutral-800/50 border border-neutral-700 rounded">
                        <Text className="text-sm font-bold text-white mb-3">SELECTED TRANSPORTER</Text>
                        <View className="flex-row justify-between items-start">
                          <View>
                            <Text className="text-sm text-white font-medium">{matchedTransporter.company}</Text>
                            <View className="flex-row items-center gap-1 mt-1">
                              <MapPin width={10} height={10} color="#6b7280" />
                              <Text className="text-xs text-neutral-400">{matchedTransporter.location}</Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <View className="flex-row items-center gap-1">
                              <Star width={12} height={12} color="#eab308" fill="#eab308" />
                              <Text className="text-xs text-neutral-400">{matchedTransporter.rating}</Text>
                            </View>
                            <Text className="text-xs text-neutral-400 mt-1">
                              {matchedTransporter.capacity} tons capacity
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => {
                          // Create a new trade record - this would integrate with backend
                          Alert.alert(
                            'Trade Created Successfully',
                            `Trade ID: TRD-${Date.now()}\nStatus: Contract Pending\nNext: Logistics coordination`,
                            [{ text: 'OK', onPress: resetTradeFlow }]
                          );
                        }}
                        className="flex-1 bg-blue-600 rounded py-2 flex-row items-center justify-center"
                      >
                        <Package width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">Create Trade</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={resetTradeFlow}
                        className="px-4 bg-green-600 rounded py-2 flex-row items-center justify-center"
                      >
                        <Plus width={16} height={16} color="#fff" />
                        <Text className="text-white font-medium ml-2">New Flow</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}