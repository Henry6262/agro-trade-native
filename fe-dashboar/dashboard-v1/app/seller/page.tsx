"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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
  Wheat,
  Coins as Corn,
  Bean,
  Apple,
  Carrot,
  Milk,
  Egg,
  Target,
  Award,
} from "lucide-react"

interface SellerDashboardProps {
  activeTab: string
}

export default function SellerDashboard({ activeTab }: SellerDashboardProps) {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedQualityTags, setSelectedQualityTags] = useState<string[]>([])
  const [isVerified, setIsVerified] = useState(false)
  const [showProductPopover, setShowProductPopover] = useState(false)

  const earningsData = {
    totalEarnings: 156750,
    monthlyEarnings: 28500,
    completedTrades: 47,
    averagePerTrade: 3335,
    topProduct: "Premium Wheat",
    growthRate: 23.5,
  }

  const productDistribution = [
    { name: "Premium Wheat", value: 45, earnings: 70650, color: "#10b981" },
    { name: "Corn Grain", value: 25, earnings: 39187, color: "#f59e0b" },
    { name: "Soybeans", value: 20, earnings: 31350, color: "#3b82f6" },
    { name: "Other Products", value: 10, earnings: 15563, color: "#8b5cf6" },
  ]

  const monthlyEarnings = [
    { month: "Aug", earnings: 18500 },
    { month: "Sep", earnings: 22300 },
    { month: "Oct", earnings: 26800 },
    { month: "Nov", earnings: 31200 },
    { month: "Dec", earnings: 28500 },
    { month: "Jan", earnings: 29450 },
  ]

  const productDatabase = {
    "Grains & Cereals": [
      { id: "wheat", name: "Wheat", icon: Wheat },
      { id: "corn", name: "Corn", icon: Corn },
      { id: "rice", name: "Rice", icon: Package },
      { id: "barley", name: "Barley", icon: Wheat },
      { id: "oats", name: "Oats", icon: Package },
    ],
    Legumes: [
      { id: "soybeans", name: "Soybeans", icon: Bean },
      { id: "lentils", name: "Lentils", icon: Bean },
      { id: "chickpeas", name: "Chickpeas", icon: Bean },
      { id: "peas", name: "Peas", icon: Bean },
    ],
    Fruits: [
      { id: "apples", name: "Apples", icon: Apple },
      { id: "oranges", name: "Oranges", icon: Apple },
      { id: "bananas", name: "Bananas", icon: Apple },
      { id: "grapes", name: "Grapes", icon: Apple },
    ],
    Vegetables: [
      { id: "carrots", name: "Carrots", icon: Carrot },
      { id: "potatoes", name: "Potatoes", icon: Package },
      { id: "onions", name: "Onions", icon: Package },
      { id: "tomatoes", name: "Tomatoes", icon: Apple },
    ],
    "Dairy & Livestock": [
      { id: "milk", name: "Milk", icon: Milk },
      { id: "eggs", name: "Eggs", icon: Egg },
      { id: "beef", name: "Beef", icon: Package },
      { id: "pork", name: "Pork", icon: Package },
    ],
  }

  const qualityTagsDatabase = [
    "Organic",
    "Non-GMO",
    "Protein 14%",
    "Protein 15%",
    "Protein 16%",
    "Protein 18%",
    "Grade A",
    "Grade B",
    "Moisture 12%",
    "Moisture 15%",
    "Fair Trade",
    "Pesticide Free",
    "Gluten Free",
    "Kosher",
    "Halal",
  ]

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
  ]

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
  ]

  const incomingOffers = [
    {
      id: "IO001",
      product: "Premium Wheat",
      quantity: 45,
      offeredPricePerTon: 295,
      totalValue: 13275,
      buyer: "Global Grain Corp",
      buyerLocation: "New York, NY",
      buyerFlag: "🇺🇸",
      adminNote: "Urgent order for premium wheat. Client willing to pay above market rate for quality assurance.",
      deadline: "2025-01-26",
      responseTime: "18 hours",
      estimatedProfit: 675,
      qualityRequirements: ["Organic", "Non-GMO", "Protein 15%+"],
    },
    {
      id: "IO002",
      product: "Soybeans",
      quantity: 60,
      offeredPricePerTon: 365,
      totalValue: 21900,
      buyer: "EuroFeed Solutions",
      buyerLocation: "Hamburg, Germany",
      buyerFlag: "🇩🇪",
      adminNote: "Export opportunity to European market. Premium pricing for certified organic soybeans.",
      deadline: "2025-01-28",
      responseTime: "2 days",
      estimatedProfit: 900,
      qualityRequirements: ["Organic", "EU Certified", "Protein 18%"],
    },
  ]

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
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Deal Accepted":
        return <Package className="w-4 h-4" />
      case "Awaiting Departure":
        return <Clock className="w-4 h-4" />
      case "Traveling":
        return <Truck className="w-4 h-4" />
      case "At Location":
        return <MapPin className="w-4 h-4" />
      case "Completed":
        return <Package className="w-4 h-4" />
      case "Scheduled":
        return <Calendar className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getTradeStages = () => [
    { name: "Scheduled", description: "Pickup scheduled", icon: Calendar },
    { name: "Traveling", description: "Driver en route", icon: Truck },
    { name: "Arrived", description: "At pickup location", icon: MapPin },
    { name: "Completed", description: "Goods delivered", icon: CheckCircle },
  ]

  const renderStageIndicator = (currentStage: number) => {
    const stages = getTradeStages()
    return (
      <div className="relative mb-6">
        {/* Progress Bar Background */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-neutral-700 z-0"></div>

        {/* Active Progress Bar */}
        <div
          className="absolute top-4 left-8 h-0.5 bg-green-500 z-0 transition-all duration-500"
          style={{ width: `calc(${(currentStage / (stages.length - 1)) * 100}% - 2rem)` }}
        ></div>

        <div className="flex justify-between relative z-10">
          {stages.map((stage, index) => {
            const Icon = stage.icon
            const isCompleted = index < currentStage
            const isCurrent = index === currentStage
            const isUpcoming = index > currentStage

            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                        ? "bg-yellow-500 text-black animate-pulse shadow-lg shadow-yellow-500/50"
                        : "bg-neutral-700 text-neutral-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></div>
                  )}
                </div>
                <div
                  className={`text-xs text-center mt-2 max-w-16 ${
                    isCompleted ? "text-green-400" : isCurrent ? "text-yellow-400" : "text-neutral-500"
                  }`}
                >
                  {stage.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product)
    setShowProductPopover(false)
  }

  const toggleQualityTag = (tag: string) => {
    setSelectedQualityTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const removeQualityTag = (tag: string) => {
    setSelectedQualityTags((prev) => prev.filter((t) => t !== tag))
  }

  if (activeTab === "products") {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">My Products</h1>
            <p className="text-neutral-400">Manage your agricultural products and listings</p>
          </div>
          <Button onClick={() => setShowAddProduct(true)} className="bg-green-500 hover:bg-green-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellerProducts.map((product) => (
            <Card key={product.id} className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg text-white">{product.name}</CardTitle>
                      {product.verified ? (
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <Shield className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-400">
                        {product.flag} {product.location}
                      </span>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(product.status)} text-white text-xs`}>{product.status}</Badge>
                </div>

                {/* Quality Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.quality.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-green-500 text-green-400">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-white">{product.quantity} tons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-white">${product.pricePerTon}/ton</span>
                  </div>
                </div>

                <div className="text-xs text-neutral-500">Listed: {new Date(product.listed).toLocaleDateString()}</div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800 bg-transparent"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-neutral-900 border-neutral-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Add New Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-neutral-300">Product Type</Label>
                  <Popover open={showProductPopover} onOpenChange={setShowProductPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
                      >
                        {selectedProduct ? (
                          <div className="flex items-center gap-2">
                            <selectedProduct.icon className="w-4 h-4" />
                            {selectedProduct.name}
                          </div>
                        ) : (
                          "Select a product..."
                        )}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-neutral-800 border-neutral-600 p-0">
                      <div className="max-h-80 overflow-y-auto">
                        {Object.entries(productDatabase).map(([category, products]) => (
                          <div key={category}>
                            <div className="px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-700">
                              {category}
                            </div>
                            <div className="grid grid-cols-2 gap-1 p-2">
                              {products.map((product) => (
                                <Button
                                  key={product.id}
                                  variant="ghost"
                                  className="h-auto p-2 flex flex-col items-center gap-1 hover:bg-neutral-700 text-white"
                                  onClick={() => handleProductSelect(product)}
                                >
                                  <product.icon className="w-6 h-6" />
                                  <span className="text-xs">{product.name}</span>
                                </Button>
                              ))}
                            </div>
                            <Separator className="bg-neutral-600" />
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-neutral-300">Quantity (tons)</Label>
                    <Input className="bg-neutral-800 border-neutral-600 text-white" placeholder="50" />
                  </div>
                  <div>
                    <Label className="text-neutral-300">Price per ton ($)</Label>
                    <Input className="bg-neutral-800 border-neutral-600 text-white" placeholder="220" />
                  </div>
                </div>

                <div>
                  <Label className="text-neutral-300">Location</Label>
                  <Input className="bg-neutral-800 border-neutral-600 text-white" placeholder="Iowa, USA" />
                </div>

                <div>
                  <Label className="text-neutral-300">Quality Tags</Label>
                  <div className="space-y-2">
                    {/* Selected Tags Display */}
                    {selectedQualityTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedQualityTags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-green-500 text-green-400 pr-1">
                            {tag}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-1 hover:bg-transparent"
                              onClick={() => removeQualityTag(tag)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Available Tags */}
                    <div className="max-h-32 overflow-y-auto border border-neutral-600 rounded-md p-2 bg-neutral-800">
                      <div className="flex flex-wrap gap-1">
                        {qualityTagsDatabase
                          .filter((tag) => !selectedQualityTags.includes(tag))
                          .map((tag) => (
                            <Button
                              key={tag}
                              variant="ghost"
                              size="sm"
                              className="h-auto px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-green-400"
                              onClick={() => toggleQualityTag(tag)}
                            >
                              + {tag}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-md">
                  <div className="flex items-center gap-2">
                    {isVerified ? (
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <Shield className="w-5 h-5 text-neutral-500" />
                    )}
                    <div>
                      <Label className="text-neutral-300">Verification Status</Label>
                      <p className="text-xs text-neutral-500">
                        {isVerified ? "Product verified by inspection team" : "Awaiting verification"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVerified(!isVerified)}
                    className={`${
                      isVerified
                        ? "border-green-500 text-green-400 hover:bg-green-500/10"
                        : "border-neutral-600 text-neutral-400 hover:bg-neutral-700"
                    }`}
                  >
                    {isVerified ? "Verified" : "Not Verified"}
                  </Button>
                </div>

                <div>
                  <Label className="text-neutral-300">Description</Label>
                  <Textarea
                    className="bg-neutral-800 border-neutral-600 text-white"
                    placeholder="Product description..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowAddProduct(false)
                      setSelectedProduct(null)
                      setSelectedQualityTags([])
                      setIsVerified(false)
                    }}
                    variant="outline"
                    className="flex-1 border-neutral-600 text-neutral-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddProduct(false)
                      setSelectedProduct(null)
                      setSelectedQualityTags([])
                      setIsVerified(false)
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === "trades") {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">My Trades</h1>
          <p className="text-neutral-400">Track your active trades and earnings performance</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {/* Total Earnings Card */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Total</p>
                <p className="text-lg font-bold text-white">${(earningsData.totalEarnings / 1000).toFixed(0)}k</p>
                <p className="text-xs text-green-400">+{earningsData.growthRate}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Earnings */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Month</p>
                <p className="text-lg font-bold text-white">${(earningsData.monthlyEarnings / 1000).toFixed(0)}k</p>
                <p className="text-xs text-blue-400">Jan 2025</p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Trades */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <Target className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Trades</p>
                <p className="text-lg font-bold text-white">{earningsData.completedTrades}</p>
                <p className="text-xs text-purple-400">${(earningsData.averagePerTrade / 1000).toFixed(1)}k avg</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Product */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <Award className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Top</p>
                <p className="text-sm font-bold text-white">Wheat</p>
                <p className="text-xs text-orange-400">45%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incoming Offers */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Incoming Offers</h2>
            {incomingOffers.map((offer) => (
              <Card
                key={offer.id}
                className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{offer.product}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight className="w-4 h-4 text-orange-400" />
                          <span className="text-white font-medium">{offer.quantity} tons</span>
                        </div>
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign className="w-4 h-4 text-orange-400" />
                          <span className="text-white font-medium">${offer.offeredPricePerTon}/ton</span>
                        </div>
                        <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded">
                          <span className="text-orange-300 text-xs">Total:</span>
                          <span className="text-orange-400 font-bold">${offer.totalValue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-orange-500 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {offer.responseTime} left
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-neutral-400">Buyer:</span>
                        <div className="text-white font-medium">{offer.buyer}</div>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <MapPin className="w-3 h-3" />
                          {offer.buyerFlag} {offer.buyerLocation}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-neutral-400">Quality Requirements:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {offer.qualityRequirements.map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-orange-400 text-orange-300">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                    <div className="text-sm">
                      <span className="text-neutral-400">Admin Note:</span>
                      <p className="text-neutral-300 mt-1">{offer.adminNote}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="bg-green-500 hover:bg-green-600 text-white">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Offer
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      variant="outline"
                      className="border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Counter Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active Trades */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Active Trades</h2>
            {activeTrades.map((trade) => (
              <Card key={trade.id} className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{trade.product}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">{trade.quantity} tons</span>
                        </div>
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">${trade.agreedPricePerTon}/ton</span>
                        </div>
                        <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded">
                          <span className="text-green-300 text-xs">Total:</span>
                          <span className="text-green-400 font-bold">${trade.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(trade.status)} text-white flex items-center gap-1`}>
                      {getStatusIcon(trade.status)}
                      {trade.status}
                    </Badge>
                  </div>

                  {renderStageIndicator(trade.currentStage)}

                  {/* Trade Details */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-neutral-400">Buyer:</span>
                        <div className="text-white font-medium">{trade.buyer}</div>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <MapPin className="w-3 h-3" />
                          {trade.buyerFlag} {trade.buyerLocation}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-neutral-400">Transporter:</span>
                        <div className="text-white font-medium">{trade.transporter}</div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Truck className="w-3 h-3" />
                          {trade.transporterTrucks} trucks
                          <div className="flex items-center gap-1">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span>4.8</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTrade(expandedTrade === trade.id ? null : trade.id)}
                      className="text-neutral-400 hover:text-white"
                    >
                      {expandedTrade === trade.id ? "Hide Details" : "View Details"}
                    </Button>
                  </div>

                  {expandedTrade === trade.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Transport Details</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-neutral-400">License Plate:</span>
                              <span className="text-white font-mono">{trade.licensePlate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-400">Fleet Size:</span>
                              <span className="text-white">{trade.transporterTrucks} trucks</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-400">Rating:</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-white">4.8/5</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Trade Summary</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-neutral-400">Quantity:</span>
                              <span className="text-white">{trade.quantity} tons</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-400">Price/ton:</span>
                              <span className="text-white">${trade.agreedPricePerTon}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span className="text-neutral-400">Total Value:</span>
                              <span className="text-green-400">${trade.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
