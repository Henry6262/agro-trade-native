"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Truck,
  MapPin,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Weight,
  MessageSquare,
  Gavel,
  Route,
  Calendar,
} from "lucide-react"

export default function TradeOperationsPage() {
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [activeView, setActiveView] = useState("operations") // "operations" or "matcher"
  const [selectedBuyOrder, setSelectedBuyOrder] = useState(null)
  const [selectedSellOrder, setSelectedSellOrder] = useState(null)
  const [matchedTransporter, setMatchedTransporter] = useState(null)
  const [activeTradeFlow, setActiveTradeFlow] = useState(null)
  const [tradeFlowStage, setTradeFlowStage] = useState("matching") // matching, negotiating, transport-search, bidding, completed

  const [counterOfferForm, setCounterOfferForm] = useState({
    party: "",
    customPrice: "",
    isOpen: false,
  })

  const [pendingOffers, setPendingOffers] = useState([])
  const [counterOffers, setCounterOffers] = useState([])

  const [transportBids, setTransportBids] = useState([])
  const [biddingTimeLeft, setBiddingTimeLeft] = useState(48) // hours

  const buyOrders = [
    {
      id: "BUY-001",
      product: "Organic Wheat",
      buyer: "Fresh Market Co",
      quantity: "500",
      unit: "tons",
      maxPrice: "$320",
      priceUnit: "/ton",
      location: "Chicago, IL",
      flag: "🇺🇸",
      deadline: "2025-06-25",
      requirements: ["Organic Certified", "Grade A", "Non-GMO"],
      urgency: "high",
    },
    {
      id: "BUY-002",
      product: "Sweet Corn",
      buyer: "Global Food Distributors",
      quantity: "200",
      unit: "tons",
      maxPrice: "$280",
      priceUnit: "/ton",
      location: "New York, NY",
      flag: "🇺🇸",
      deadline: "2025-06-30",
      requirements: ["Non-GMO", "Fresh", "Protein +15%"],
      urgency: "medium",
    },
    {
      id: "BUY-003",
      product: "Mixed Vegetables",
      buyer: "Restaurant Supply Chain",
      quantity: "150",
      unit: "tons",
      maxPrice: "$450",
      priceUnit: "/ton",
      location: "Los Angeles, CA",
      flag: "🇺🇸",
      deadline: "2025-06-22",
      requirements: ["Fresh", "Local Preferred", "Pesticide Free"],
      urgency: "critical",
    },
  ]

  const sellOrders = [
    {
      id: "SELL-001",
      product: "Organic Wheat",
      farmer: "Green Valley Farms",
      quantity: "600",
      unit: "tons",
      minPrice: "$300",
      priceUnit: "/ton",
      location: "Iowa, USA",
      flag: "🇺🇸",
      harvestDate: "2025-06-20",
      categories: ["Organic Certified", "Grade A", "Premium Quality"],
      quality: "premium",
    },
    {
      id: "SELL-002",
      product: "Sweet Corn",
      farmer: "Sunrise Orchards",
      quantity: "300",
      unit: "tons",
      minPrice: "$260",
      priceUnit: "/ton",
      location: "Illinois, USA",
      flag: "🇺🇸",
      harvestDate: "2025-06-18",
      categories: ["Non-GMO", "High Protein"],
      quality: "standard",
    },
    {
      id: "SELL-003",
      product: "Mixed Vegetables",
      farmer: "Valley Fresh Produce",
      quantity: "200",
      unit: "tons",
      minPrice: "$420",
      priceUnit: "/ton",
      location: "California, USA",
      flag: "🇺🇸",
      harvestDate: "2025-06-15",
      categories: ["Fresh", "Local", "Organic"],
      quality: "premium",
    },
  ]

  const transporters = [
    {
      id: "TRANS-001",
      company: "Swift Transport LLC",
      capacity: "50",
      unit: "tons",
      rate: "$2.5",
      rateUnit: "/mile",
      truckCount: 12,
      specialization: ["Refrigerated", "Bulk"],
      location: "Texas, USA",
      flag: "🇺🇸",
      rating: 4.8,
      availability: "available",
    },
    {
      id: "TRANS-002",
      company: "AgriLogistics Pro",
      capacity: "75",
      unit: "tons",
      rate: "$2.2",
      rateUnit: "/mile",
      truckCount: 8,
      specialization: ["Temperature Controlled", "Express"],
      location: "Florida, USA",
      flag: "🇺🇸",
      rating: 4.6,
      availability: "available",
    },
    {
      id: "TRANS-003",
      company: "Cold Chain Express",
      capacity: "100",
      unit: "tons",
      rate: "$3.0",
      rateUnit: "/mile",
      truckCount: 15,
      specialization: ["Refrigerated", "Long Distance"],
      location: "California, USA",
      flag: "🇺🇸",
      rating: 4.9,
      availability: "busy",
    },
  ]

  const trades = [
    {
      id: "TR-CORN-001",
      name: "MIDWEST CORN SHIPMENT",
      status: "in-transit",
      priority: "high",
      origin: "Iowa, USA",
      destination: "Chicago, IL",
      quantity: "500 tons",
      progress: 75,
      startDate: "2025-06-15",
      estimatedDelivery: "2025-06-18",
      description: "Premium grade corn delivery to processing facility",
      milestones: ["Order confirmed", "Pickup completed", "In transit", "Delivery pending"],
      farmer: "Green Valley Farms",
      buyer: "Midwest Processing Co",
      transporter: "AgriLogistics Pro",
    },
    {
      id: "TR-WHEAT-002",
      name: "ORGANIC WHEAT EXPORT",
      status: "negotiating",
      priority: "medium",
      origin: "Kansas, USA",
      destination: "Port of Seattle",
      quantity: "1200 tons",
      progress: 25,
      startDate: "2025-06-20",
      estimatedDelivery: "2025-06-28",
      description: "Organic wheat for international export",
      milestones: ["Price negotiation", "Contract pending", "Logistics planning", "Delivery scheduled"],
      farmer: "Prairie Wheat Co",
      buyer: "Global Grain Exports",
      transporter: "Swift Transport LLC",
    },
    {
      id: "TR-APPLE-003",
      name: "FRESH APPLE DELIVERY",
      status: "delivered",
      priority: "low",
      origin: "Washington, USA",
      destination: "Los Angeles, CA",
      quantity: "200 tons",
      progress: 100,
      startDate: "2025-06-10",
      estimatedDelivery: "2025-06-12",
      description: "Fresh Gala apples for retail distribution",
      milestones: ["Order placed", "Harvested", "Shipped", "Delivered"],
      farmer: "Sunrise Orchards",
      buyer: "Fresh Market Co",
      transporter: "Cold Chain Express",
    },
    {
      id: "TR-SOY-004",
      name: "SOYBEAN BULK ORDER",
      status: "confirmed",
      priority: "high",
      origin: "Illinois, USA",
      destination: "New Orleans, LA",
      quantity: "800 tons",
      progress: 60,
      startDate: "2025-06-12",
      estimatedDelivery: "2025-06-20",
      description: "Non-GMO soybeans for export processing",
      milestones: ["Contract signed", "Quality inspection", "Loading in progress", "Transit pending"],
      farmer: "Heartland Soy Farms",
      buyer: "Export Commodities Inc",
      transporter: "Bulk Transport Solutions",
    },
    {
      id: "TR-VEG-005",
      name: "MIXED VEGETABLE ORDER",
      status: "delayed",
      priority: "critical",
      origin: "California, USA",
      destination: "Denver, CO",
      quantity: "150 tons",
      progress: 40,
      startDate: "2025-06-08",
      estimatedDelivery: "2025-06-15",
      description: "Fresh mixed vegetables for restaurant chain",
      milestones: ["Order confirmed", "Harvest delayed", "Rescheduling", "New delivery date"],
      farmer: "Valley Fresh Produce",
      buyer: "Restaurant Supply Chain",
      transporter: "Fresh Logistics Pro",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "in-transit":
        return "bg-blue-500/20 text-blue-500"
      case "negotiating":
        return "bg-orange-500/20 text-orange-500"
      case "delivered":
        return "bg-green-500/20 text-green-500"
      case "confirmed":
        return "bg-white/20 text-white"
      case "delayed":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-500"
      case "high":
        return "bg-orange-500/20 text-orange-500"
      case "medium":
        return "bg-neutral-500/20 text-neutral-300"
      case "low":
        return "bg-green-500/20 text-green-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "in-transit":
        return <Truck className="w-4 h-4" />
      case "negotiating":
        return <Clock className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      case "confirmed":
        return <Package className="w-4 h-4" />
      case "delayed":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const navigateToStage = (stage) => {
    setTradeFlowStage(stage)
  }

  const resetTradeFlow = () => {
    setActiveTradeFlow(null)
    setTradeFlowStage("matching")
    setCounterOffers([])
    setTransportBids([])
    setBiddingTimeLeft(48)
  }

  const initiateTrade = () => {
    if (selectedBuyOrder && selectedSellOrder) {
      const newTradeFlow = {
        id: `FLOW-${Date.now()}`,
        buyOrder: selectedBuyOrder,
        sellOrder: selectedSellOrder,
        stage: "matching",
        createdAt: new Date().toISOString(),
        potentialMargin: calculateMargin(selectedBuyOrder, selectedSellOrder),
        route: null,
        transporter: null,
      }
      setActiveTradeFlow(newTradeFlow)
      setTradeFlowStage("matching")
    }
  }

  const calculateMargin = (buyOrder, sellOrder) => {
    const buyPrice = Number.parseFloat(buyOrder.maxPrice.replace("$", ""))
    const sellPrice = Number.parseFloat(sellOrder.minPrice.replace("$", ""))
    return (((buyPrice - sellPrice) / buyPrice) * 100).toFixed(1)
  }

  const sendCounterOffer = (party, customPrice = null) => {
    const price = customPrice || counterOfferForm.customPrice
    const offer = {
      id: `OFFER-${Date.now()}`,
      party,
      price: `$${price}`,
      timestamp: new Date().toISOString(),
      status: "pending",
      sentBy: "platform",
    }
    setPendingOffers([...pendingOffers, offer])
    setCounterOfferForm({ party: "", customPrice: "", isOpen: false })
  }

  const respondToOffer = (offerId, response) => {
    setPendingOffers(
      pendingOffers.map((offer) =>
        offer.id === offerId ? { ...offer, status: response, respondedAt: new Date().toISOString() } : offer,
      ),
    )

    if (response === "accepted") {
      // Move to transport search after acceptance
      setTimeout(() => {
        setTradeFlowStage("transport-search")
        setTimeout(() => {
          setTradeFlowStage("bidding")
          setBiddingTimeLeft(48)
        }, 2000)
      }, 1000)
    }
  }

  const submitTransportBid = (transporter, bidPrice) => {
    const bid = {
      id: `BID-${Date.now()}`,
      transporter,
      price: bidPrice,
      timestamp: new Date().toISOString(),
    }
    setTransportBids([...transportBids, bid])
  }

  const completeTrade = (winningBid) => {
    setMatchedTransporter(winningBid.transporter)
    setTradeFlowStage("completed")
    setActiveTradeFlow({
      ...activeTradeFlow,
      transporter: winningBid.transporter,
      finalTransportCost: winningBid.price,
      stage: "completed",
    })
  }

  const getStageIcon = (stage) => {
    switch (stage) {
      case "matching":
        return <Target className="w-4 h-4" />
      case "negotiating":
        return <MessageSquare className="w-4 h-4" />
      case "transport-search":
        return <Route className="w-4 h-4" />
      case "bidding":
        return <Gavel className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getStageColor = (stage) => {
    switch (stage) {
      case "matching":
        return "bg-blue-500/20 text-blue-500"
      case "negotiating":
        return "bg-orange-500/20 text-orange-500"
      case "transport-search":
        return "bg-purple-500/20 text-purple-500"
      case "bidding":
        return "bg-yellow-500/20 text-yellow-500"
      case "completed":
        return "bg-green-500/20 text-green-500"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  const createTrade = () => {
    if (selectedBuyOrder && selectedSellOrder && matchedTransporter) {
      // Logic to create new trade would go here
      alert(`Trade created: ${selectedSellOrder.farmer} → ${selectedBuyOrder.buyer} via ${matchedTransporter.company}`)
      // Reset selections
      setSelectedBuyOrder(null)
      setSelectedSellOrder(null)
      setMatchedTransporter(null)
    }
  }

  const acceptTerms = () => {
    alert("Terms accepted!")
    navigateToStage("transport-search")
  }

  const getTradeStages = (status) => {
    switch (status) {
      case "negotiating":
        return [
          { name: "Negotiating", icon: MessageSquare, active: true },
          { name: "Confirmed", icon: CheckCircle, active: false },
          { name: "In Transit", icon: Truck, active: false },
          { name: "Delivered", icon: Package, active: false },
        ]
      case "confirmed":
        return [
          { name: "Negotiating", icon: MessageSquare, active: false, completed: true },
          { name: "Confirmed", icon: CheckCircle, active: true },
          { name: "In Transit", icon: Truck, active: false },
          { name: "Delivered", icon: Package, active: false },
        ]
      case "in-transit":
        return [
          { name: "Negotiating", icon: MessageSquare, active: false, completed: true },
          { name: "Confirmed", icon: CheckCircle, active: false, completed: true },
          { name: "In Transit", icon: Truck, active: true },
          { name: "Delivered", icon: Package, active: false },
        ]
      case "delivered":
        return [
          { name: "Negotiating", icon: MessageSquare, active: false, completed: true },
          { name: "Confirmed", icon: CheckCircle, active: false, completed: true },
          { name: "In Transit", icon: Truck, active: false, completed: true },
          { name: "Delivered", icon: Package, active: false, completed: true },
        ]
      case "delayed":
        return [
          { name: "Negotiating", icon: MessageSquare, active: false, completed: true },
          { name: "Confirmed", icon: CheckCircle, active: false, completed: true },
          { name: "Delayed", icon: XCircle, active: true },
          { name: "Delivered", icon: Package, active: false },
        ]
      default:
        return [
          { name: "Negotiating", icon: MessageSquare, active: true },
          { name: "Confirmed", icon: CheckCircle, active: false },
          { name: "In Transit", icon: Truck, active: false },
          { name: "Delivered", icon: Package, active: false },
        ]
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">TRADE OPERATIONS</h1>
          <p className="text-sm text-neutral-400">Monitor trades and match orders with transporters</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveView("operations")}
            className={`${activeView === "operations" ? "bg-green-600 hover:bg-green-700" : "bg-neutral-700 hover:bg-neutral-600"} text-white`}
          >
            Operations
          </Button>
          <Button
            onClick={() => setActiveView("matcher")}
            className={`${activeView === "matcher" ? "bg-green-600 hover:bg-green-700" : "bg-neutral-700 hover:bg-neutral-600"} text-white`}
          >
            Matcher
          </Button>
        </div>
      </div>

      {activeView === "operations" ? (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-2 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">ACTIVE TRADES</p>
                    <p className="text-lg md:text-2xl font-bold text-white font-mono">47</p>
                  </div>
                  <Truck className="w-4 h-4 md:w-8 md:h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-2 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">DELIVERED</p>
                    <p className="text-lg md:text-2xl font-bold text-green-500 font-mono">324</p>
                  </div>
                  <CheckCircle className="w-4 h-4 md:w-8 md:h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-2 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">DELAYED</p>
                    <p className="text-lg md:text-2xl font-bold text-red-500 font-mono">8</p>
                  </div>
                  <XCircle className="w-4 h-4 md:w-8 md:h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-2 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">SUCCESS RATE</p>
                    <p className="text-lg md:text-2xl font-bold text-white font-mono">96%</p>
                  </div>
                  <Package className="w-4 h-4 md:w-8 md:h-8 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trade Operations List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {trades.map((trade) => {
              const stages = getTradeStages(trade.status)
              return (
                <Card
                  key={trade.id}
                  className="bg-neutral-900 border-neutral-700 hover:border-green-500/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTrade(trade)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-white tracking-wider">{trade.name}</CardTitle>
                        <p className="text-xs text-neutral-400 font-mono">{trade.id}</p>
                      </div>
                      <Badge className={getStatusColor(trade.status)}>{trade.status.toUpperCase()}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2 relative">
                        {stages.map((stage, index) => {
                          const Icon = stage.icon
                          return (
                            <div key={stage.name} className="flex flex-col items-center relative z-10">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  stage.active
                                    ? "bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50"
                                    : stage.completed
                                      ? "bg-green-500"
                                      : "bg-neutral-700"
                                }`}
                              >
                                <Icon
                                  className={`w-4 h-4 ${
                                    stage.active ? "text-black" : stage.completed ? "text-white" : "text-neutral-400"
                                  }`}
                                />
                              </div>
                              <span className="text-xs text-neutral-400 mt-1 text-center max-w-16 leading-tight">
                                {stage.name}
                              </span>
                            </div>
                          )
                        })}
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-neutral-700 -z-10">
                          <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{
                              width: `${(stages.filter((s) => s.completed).length / (stages.length - 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {trade.origin} → {trade.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Weight className="w-3 h-3" />
                        <span>{trade.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Calendar className="w-3 h-3" />
                        <span>Est. delivery: {trade.estimatedDelivery}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-neutral-400">Farmer</div>
                        <div className="text-white font-medium">{trade.farmer}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-neutral-400">Buyer</div>
                        <div className="text-white font-medium">{trade.buyer}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-neutral-400">Transport</div>
                        <div className="text-white font-medium">{trade.transporter}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      ) : (
        /* Enhanced matcher system interface */
        <div className="space-y-6">
          {!activeTradeFlow && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Buy Orders */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-blue-400 tracking-wider">BUY ORDERS</h3>
                {buyOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-colors ${
                      selectedBuyOrder?.id === order.id
                        ? "bg-blue-500/20 border-blue-500"
                        : "bg-neutral-900 border-neutral-700 hover:border-blue-500/50"
                    }`}
                    onClick={() => setSelectedBuyOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-white">{order.product}</div>
                          <div className="text-xs text-neutral-400">{order.buyer}</div>
                        </div>
                        <Badge
                          className={
                            order.urgency === "critical"
                              ? "bg-red-500/20 text-red-500"
                              : order.urgency === "high"
                                ? "bg-orange-500/20 text-orange-500"
                                : "bg-neutral-500/20 text-neutral-300"
                          }
                        >
                          {order.urgency}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-neutral-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="mr-1">{order.flag}</span>
                        <span>{order.location}</span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Weight className="w-3 h-3" />
                          <span>
                            {order.quantity} {order.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400 font-mono">
                          <span>
                            Max: {order.maxPrice}
                            {order.priceUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-orange-400 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>Due: {order.deadline}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {order.requirements.map((req, index) => (
                          <Badge key={index} className="bg-neutral-700 text-neutral-300 text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Sell Orders */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-green-400 tracking-wider">SELL ORDERS</h3>
                {sellOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSellOrder?.id === order.id
                        ? "bg-green-500/20 border-green-500"
                        : "bg-neutral-900 border-neutral-700 hover:border-green-500/50"
                    }`}
                    onClick={() => setSelectedSellOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-white">{order.product}</div>
                          <div className="text-xs text-neutral-400">{order.farmer}</div>
                        </div>
                        <Badge
                          className={
                            order.quality === "premium"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-neutral-500/20 text-neutral-300"
                          }
                        >
                          {order.quality}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-neutral-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="mr-1">{order.flag}</span>
                        <span>{order.location}</span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Weight className="w-3 h-3" />
                          <span>
                            {order.quantity} {order.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400 font-mono">
                          <span>
                            Min: {order.minPrice}
                            {order.priceUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-blue-400 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>Harvest: {order.harvestDate}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {order.categories.map((cat, index) => (
                          <Badge key={index} className="bg-neutral-700 text-neutral-300 text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Transporters */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-orange-400 tracking-wider">TRANSPORTERS</h3>
                {transporters.map((transporter) => (
                  <Card
                    key={transporter.id}
                    className={`cursor-pointer transition-colors ${
                      matchedTransporter?.id === transporter.id
                        ? "bg-orange-500/20 border-orange-500"
                        : "bg-neutral-900 border-neutral-700 hover:border-orange-500/50"
                    }`}
                    onClick={() => setMatchedTransporter(transporter)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-white">{transporter.company}</div>
                          <div className="flex items-center gap-1 text-xs text-neutral-400">
                            <MapPin className="w-3 h-3" />
                            <span className="mr-1">{transporter.flag}</span>
                            <span>{transporter.location}</span>
                          </div>
                        </div>
                        <Badge
                          className={
                            transporter.availability === "available"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }
                        >
                          {transporter.availability}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <Weight className="w-3 h-3" />
                          <span>
                            {transporter.capacity} {transporter.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-orange-400 font-mono">
                          <span>
                            {transporter.rate}
                            {transporter.rateUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-neutral-400 mb-2">
                        <Truck className="w-3 h-3" />
                        <span>{transporter.truckCount} trucks</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {transporter.specialization.map((spec, index) => (
                          <Badge key={index} className="bg-neutral-700 text-neutral-300 text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
