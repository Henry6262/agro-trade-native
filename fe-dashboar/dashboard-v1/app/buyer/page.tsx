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

interface BuyerDashboardProps {
  activeTab: string
}

export default function BuyerDashboard({ activeTab }: BuyerDashboardProps) {
  const [showAddRequest, setShowAddRequest] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedQualityTags, setSelectedQualityTags] = useState<string[]>([])
  const [showProductPopover, setShowProductPopover] = useState(false)

  const buyerStats = {
    totalSpent: 245600,
    monthlySpent: 42300,
    completedOrders: 32,
    averagePerOrder: 7675,
    topProduct: "Premium Wheat",
    savingsRate: 15.2,
  }

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

  const activeOrders = [
    {
      id: "O001",
      product: "Premium Wheat",
      quantity: 35,
      maxPricePerTon: 290,
      seller: "GreenFields Farm",
      sellerLocation: "Iowa, USA",
      sellerFlag: "🇺🇸",
      transporter: "FastHaul Logistics",
      transporterTrucks: 2,
      licensePlate: "TRK-4521",
      status: "In Transit",
      deliveryDate: "2025-01-28",
      estimatedArrival: "2025-01-27 14:00",
      totalCost: 10150,
      currentStage: 2,
      qualityRequirements: ["Organic", "Non-GMO", "Protein 15%+"],
    },
    {
      id: "O002",
      product: "Soybeans",
      quantity: 50,
      maxPricePerTon: 360,
      seller: "Prairie Harvest Co",
      sellerLocation: "Illinois, USA",
      sellerFlag: "🇺🇸",
      transporter: "AgriTransport",
      transporterTrucks: 3,
      licensePlate: "AGR-7834",
      status: "Scheduled",
      deliveryDate: "2025-02-02",
      estimatedArrival: null,
      totalCost: 18000,
      currentStage: 0,
      qualityRequirements: ["Organic", "Protein 18%"],
    },
  ]

  const incomingOffers = [
    {
      id: "IO001",
      product: "Premium Wheat",
      quantity: 40,
      offeredPricePerTon: 275,
      totalValue: 11000,
      seller: "Midwest Grain Co",
      sellerLocation: "Nebraska, USA",
      sellerFlag: "🇺🇸",
      adminNote:
        "High-quality wheat available for immediate delivery. Seller offers competitive pricing for bulk orders.",
      deadline: "2025-01-26",
      responseTime: "16 hours",
      qualityOffered: ["Organic", "Non-GMO", "Protein 14%"],
      deliveryDate: "2025-01-30",
    },
    {
      id: "IO002",
      product: "Corn Grain",
      quantity: 60,
      offeredPricePerTon: 210,
      totalValue: 12600,
      seller: "Golden Harvest Farm",
      sellerLocation: "Kansas, USA",
      sellerFlag: "🇺🇸",
      adminNote: "Fresh corn harvest with excellent moisture content. Perfect for feed production.",
      deadline: "2025-01-29",
      responseTime: "3 days",
      qualityOffered: ["Grade A", "Moisture 14%"],
      deliveryDate: "2025-02-05",
    },
  ]

  const buyerRequests = [
    {
      id: "R001",
      product: "Premium Wheat",
      quantity: 60,
      maxPricePerTon: 285,
      deliveryLocation: "Chicago, IL",
      deliveryFlag: "🇺🇸",
      requiredDate: "2025-02-15",
      status: "Active",
      qualityRequirements: ["Organic", "Non-GMO", "Protein 15%+"],
      offers: 3,
      bestOffer: 275,
      created: "2025-01-20",
      notes: "Urgent requirement for feed production. Quality is priority over price.",
    },
    {
      id: "R002",
      product: "Soybeans",
      quantity: 80,
      maxPricePerTon: 370,
      deliveryLocation: "Detroit, MI",
      deliveryFlag: "🇺🇸",
      requiredDate: "2025-02-20",
      status: "Matched",
      qualityRequirements: ["Organic", "Protein 18%"],
      offers: 7,
      bestOffer: 355,
      created: "2025-01-18",
      notes: "Looking for consistent supplier for long-term partnership.",
    },
    {
      id: "R003",
      product: "Corn Grain",
      quantity: 45,
      maxPricePerTon: 225,
      deliveryLocation: "Milwaukee, WI",
      deliveryFlag: "🇺🇸",
      requiredDate: "2025-02-10",
      status: "Expired",
      qualityRequirements: ["Grade A", "Moisture 14%"],
      offers: 1,
      bestOffer: 230,
      created: "2025-01-15",
      notes: "Budget-conscious purchase for processing facility.",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500"
      case "Matched":
        return "bg-blue-500"
      case "Confirmed":
        return "bg-green-500"
      case "In Transit":
        return "bg-purple-500"
      case "Delivered":
        return "bg-green-600"
      case "Scheduled":
        return "bg-blue-500"
      case "Active":
        return "bg-green-500"
      case "Expired":
        return "bg-red-500"
      default:
        return "bg-neutral-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4" />
      case "Matched":
        return <Target className="w-4 h-4" />
      case "Confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "In Transit":
        return <Truck className="w-4 h-4" />
      case "Delivered":
        return <Package className="w-4 h-4" />
      case "Scheduled":
        return <Calendar className="w-4 h-4" />
      case "Active":
        return <Star className="w-4 h-4" />
      case "Expired":
        return <X className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getOrderStages = () => [
    { name: "Scheduled", description: "Order confirmed", icon: Calendar },
    { name: "Traveling", description: "In transit", icon: Truck },
    { name: "Arrived", description: "At destination", icon: MapPin },
    { name: "Delivered", description: "Order complete", icon: CheckCircle },
  ]

  const renderStageIndicator = (currentStage: number) => {
    const stages = getOrderStages()
    return (
      <div className="relative mb-6">
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-neutral-700 z-0"></div>
        <div
          className="absolute top-4 left-8 h-0.5 bg-blue-500 z-0 transition-all duration-500"
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
                      ? "bg-blue-500 text-white"
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
                    isCompleted ? "text-blue-400" : isCurrent ? "text-yellow-400" : "text-neutral-500"
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

  if (activeTab === "requests") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">My Requests</h1>
            <p className="text-neutral-400">Manage your product requests and requirements</p>
          </div>
          <Button onClick={() => setShowAddRequest(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        <div className="space-y-4">
          {buyerRequests.map((request) => (
            <Card key={request.id} className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{request.product}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                        <Weight className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{request.quantity} tons</span>
                      </div>
                      <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                        <DollarSign className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">${request.maxPricePerTon}/ton max</span>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                        <span className="text-blue-300 text-xs">Budget:</span>
                        <span className="text-blue-400 font-bold">
                          ${(request.quantity * request.maxPricePerTon).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(request.status)} text-white`}>{request.status}</Badge>
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {request.offers} offers
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-neutral-400">Delivery Location:</span>
                      <div className="flex items-center gap-1 text-white">
                        <MapPin className="w-3 h-3" />
                        {request.deliveryFlag} {request.deliveryLocation}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-400">Required Date:</span>
                      <div className="text-white">{new Date(request.requiredDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-neutral-400">Best Offer:</span>
                      <div className="text-green-400 font-medium">${request.bestOffer}/ton</div>
                    </div>
                    <div className="text-sm">
                      <span className="text-neutral-400">Created:</span>
                      <div className="text-white">{new Date(request.created).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm mb-2">
                    <span className="text-neutral-400">Quality Requirements:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {request.qualityRequirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-blue-400 text-blue-300">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                    className="text-neutral-400 hover:text-white"
                  >
                    {expandedRequest === request.id ? "Hide Details" : "View Details"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                  >
                    Edit Request
                  </Button>
                  {request.status === "Active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-400 hover:bg-green-500/10 bg-transparent"
                    >
                      View Offers ({request.offers})
                    </Button>
                  )}
                </div>

                {expandedRequest === request.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Request Notes</h4>
                        <div className="bg-neutral-800/50 rounded-lg p-3">
                          <p className="text-neutral-300 text-sm">{request.notes}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Request Summary</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Total Budget:</span>
                            <span className="text-white">
                              ${(request.quantity * request.maxPricePerTon).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Potential Savings:</span>
                            <span className="text-green-400">
                              ${((request.maxPricePerTon - request.bestOffer) * request.quantity).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Days Until Required:</span>
                            <span className="text-white">
                              {Math.ceil(
                                (new Date(request.requiredDate).getTime() - new Date().getTime()) /
                                  (1000 * 60 * 60 * 24),
                              )}{" "}
                              days
                            </span>
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

        {showAddRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-neutral-900 border-neutral-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Create New Request</CardTitle>
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
                    <Label className="text-neutral-300">Max price per ton ($)</Label>
                    <Input className="bg-neutral-800 border-neutral-600 text-white" placeholder="280" />
                  </div>
                </div>

                <div>
                  <Label className="text-neutral-300">Delivery Location</Label>
                  <Input className="bg-neutral-800 border-neutral-600 text-white" placeholder="Chicago, IL" />
                </div>

                <div>
                  <Label className="text-neutral-300">Required Delivery Date</Label>
                  <Input type="date" className="bg-neutral-800 border-neutral-600 text-white" />
                </div>

                <div>
                  <Label className="text-neutral-300">Quality Requirements</Label>
                  <div className="space-y-2">
                    {selectedQualityTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedQualityTags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-blue-500 text-blue-400 pr-1">
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

                    <div className="max-h-32 overflow-y-auto border border-neutral-600 rounded-md p-2 bg-neutral-800">
                      <div className="flex flex-wrap gap-1">
                        {qualityTagsDatabase
                          .filter((tag) => !selectedQualityTags.includes(tag))
                          .map((tag) => (
                            <Button
                              key={tag}
                              variant="ghost"
                              size="sm"
                              className="h-auto px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-blue-400"
                              onClick={() => toggleQualityTag(tag)}
                            >
                              + {tag}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-neutral-300">Additional Notes</Label>
                  <Textarea
                    className="bg-neutral-800 border-neutral-600 text-white"
                    placeholder="Special requirements or notes..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowAddRequest(false)
                      setSelectedProduct(null)
                      setSelectedQualityTags([])
                    }}
                    variant="outline"
                    className="flex-1 border-neutral-600 text-neutral-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddRequest(false)
                      setSelectedProduct(null)
                      setSelectedQualityTags([])
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Create Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === "orders") {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Orders</h1>
          <p className="text-neutral-400">Track your orders and purchase performance</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Total</p>
                <p className="text-lg font-bold text-white">${(buyerStats.totalSpent / 1000).toFixed(0)}k</p>
                <p className="text-xs text-blue-400">-{buyerStats.savingsRate}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <Calendar className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Month</p>
                <p className="text-lg font-bold text-white">${(buyerStats.monthlySpent / 1000).toFixed(0)}k</p>
                <p className="text-xs text-green-400">Jan 2025</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <Target className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Orders</p>
                <p className="text-lg font-bold text-white">{buyerStats.completedOrders}</p>
                <p className="text-xs text-purple-400">${(buyerStats.averagePerOrder / 1000).toFixed(1)}k avg</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-3">
              <div className="text-center">
                <Award className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-xs text-neutral-400">Top</p>
                <p className="text-sm font-bold text-white">Wheat</p>
                <p className="text-xs text-orange-400">42%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Incoming Offers</h2>
            {incomingOffers.map((offer) => (
              <Card key={offer.id} className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-500/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{offer.product}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium">{offer.quantity} tons</span>
                        </div>
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium">${offer.offeredPricePerTon}/ton</span>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                          <span className="text-blue-300 text-xs">Total:</span>
                          <span className="text-blue-400 font-bold">${offer.totalValue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-500 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {offer.responseTime} left
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-neutral-400">Seller:</span>
                        <div className="text-white font-medium">{offer.seller}</div>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <MapPin className="w-3 h-3" />
                          {offer.sellerFlag} {offer.sellerLocation}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-neutral-400">Quality Offered:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {offer.qualityOffered.map((quality, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-blue-400 text-blue-300">
                              {quality}
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
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Counter Offer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Active Orders</h2>
            {activeOrders.map((order) => (
              <Card key={order.id} className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{order.product}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <Weight className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium">{order.quantity} tons</span>
                        </div>
                        <div className="flex items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                          <DollarSign className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium">${order.maxPricePerTon}/ton max</span>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                          <span className="text-blue-300 text-xs">Total:</span>
                          <span className="text-blue-400 font-bold">${order.totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </div>

                  {renderStageIndicator(order.currentStage)}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-neutral-400">Seller:</span>
                        <div className="text-white font-medium">{order.seller}</div>
                        <div className="flex items-center gap-1 text-neutral-400">
                          <MapPin className="w-3 h-3" />
                          {order.sellerFlag} {order.sellerLocation}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-neutral-400">Transporter:</span>
                        <div className="text-white font-medium">{order.transporter}</div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Truck className="w-3 h-3" />
                          {order.transporterTrucks} trucks
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
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="text-neutral-400 hover:text-white"
                    >
                      {expandedOrder === order.id ? "Hide Details" : "View Details"}
                    </Button>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Quality Requirements</h4>
                          <div className="flex flex-wrap gap-1">
                            {order.qualityRequirements.map((req, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-blue-400 text-blue-300">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-white">Order Summary</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-neutral-400">Delivery Date:</span>
                              <span className="text-white">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-400">License Plate:</span>
                              <span className="text-white font-mono">{order.licensePlate}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span className="text-neutral-400">Total Cost:</span>
                              <span className="text-blue-400">${order.totalCost.toLocaleString()}</span>
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
