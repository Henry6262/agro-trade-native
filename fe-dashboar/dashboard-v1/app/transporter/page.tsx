"use client"

import { useState } from "react"
import {
  Package,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Route,
  Timer,
  CheckCircle,
  Play,
  Pause,
  Navigation,
  Shield,
  AlertTriangle,
  Zap,
  Fuel,
  Weight,
  Plus,
  User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TransporterDashboardProps {
  activeTab: string
}

export default function TransporterDashboard({ activeTab }: TransporterDashboardProps) {
  const [selectedBid, setSelectedBid] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null)
  const [showAddTruck, setShowAddTruck] = useState(false)
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [newTruckData, setNewTruckData] = useState({
    licensePlate: "",
    model: "",
    capacity: "",
    year: "",
  })
  const [newDriverData, setNewDriverData] = useState({
    name: "",
    license: "",
    phone: "",
    experience: "",
  })

  const handleVerifyToBid = () => {
    setIsVerified(true)
    // Simulate verification process
    setTimeout(() => {
      alert("Verification complete! You can now place bids.")
    }, 1500)
  }

  const getTransferStages = () => [
    { name: "Assign Driver", description: "Assign driver to truck", icon: User },
    { name: "Traveling", description: "En route to pickup", icon: Truck },
    { name: "Arrived", description: "At pickup location", icon: MapPin },
    { name: "Completed", description: "Delivery completed", icon: CheckCircle },
  ]

  const renderTransferStageIndicator = (currentStage: number) => {
    const stages = getTransferStages()
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

  if (activeTab === "bidding") {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">ACTIVE BIDS</p>
                  <p className="text-lg md:text-2xl font-bold text-blue-400">8</p>
                </div>
                <Target className="w-4 h-4 md:w-8 md:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">WIN RATE</p>
                  <p className="text-lg md:text-2xl font-bold text-green-400">73%</p>
                </div>
                <Trophy className="w-4 h-4 md:w-8 md:h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">AVG BID</p>
                  <p className="text-lg md:text-2xl font-bold text-yellow-400">$2.8k</p>
                </div>
                <DollarSign className="w-4 h-4 md:w-8 md:h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">RANK</p>
                  <p className="text-lg md:text-2xl font-bold text-purple-400">#12</p>
                </div>
                <TrendingUp className="w-4 h-4 md:w-8 md:h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {!isVerified && (
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-yellow-400">Verification Required</h3>
                    <p className="text-sm text-neutral-300">Complete verification to unlock premium bidding features</p>
                  </div>
                </div>
                <Button
                  onClick={handleVerifyToBid}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  VERIFY NOW
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-green-500 flex items-center gap-2">
              <Package className="w-5 h-5" />
              LIVE TRANSPORT AUCTIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: "T001",
                product: "🌾 Premium Wheat",
                quantity: "25 tons",
                from: "Iowa Farm Co.",
                fromFlag: "🇺🇸",
                to: "Chicago Grain Terminal",
                toFlag: "🇺🇸",
                distance: "180 mi",
                userDistance: "45 mi",
                deadline: "Sep 29",
                currentBid: "$3,200",
                totalBids: 12,
                timeLeft: "18h 24m",
                priority: "high",
                fuelCost: "$420",
                profitMargin: "28%",
                tags: ["Non-GMO", "Premium Grade"],
              },
              {
                id: "T002",
                product: "🌽 Organic Corn",
                quantity: "40 tons",
                from: "Nebraska Harvest",
                fromFlag: "🇺🇸",
                to: "Kansas Processing",
                toFlag: "🇺🇸",
                distance: "220 mi",
                userDistance: "120 mi",
                deadline: "Oct 2",
                currentBid: "$4,800",
                totalBids: 8,
                timeLeft: "2d 6h",
                priority: "medium",
                fuelCost: "$580",
                profitMargin: "22%",
                tags: ["Organic", "Grade A"],
              },
              {
                id: "T003",
                product: "🫘 Premium Soybeans",
                quantity: "15 tons",
                from: "Illinois Organic",
                fromFlag: "🇺🇸",
                to: "Milwaukee Port",
                toFlag: "🇺🇸",
                distance: "150 mi",
                userDistance: "28 mi",
                deadline: "Sep 30",
                currentBid: "$2,400",
                totalBids: 15,
                timeLeft: "1d 12h",
                priority: "urgent",
                fuelCost: "$320",
                profitMargin: "35%",
                tags: ["Export Quality", "Premium"],
              },
            ].map((job) => (
              <Card
                key={job.id}
                className="bg-neutral-900 border-neutral-700 hover:border-green-500/50 transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-green-600/10 rounded-lg flex items-center justify-center border border-green-500/30">
                        <Package className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{job.product}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs text-neutral-400 border-neutral-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          job.priority === "urgent" ? "destructive" : job.priority === "high" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {job.priority === "urgent" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {job.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs animate-pulse">
                        <Timer className="w-3 h-3 mr-1" />
                        {job.timeLeft}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className="text-base">{job.fromFlag}</span>
                    <span className="text-neutral-300 truncate">{job.from}</span>
                    <span className="text-neutral-500">→</span>
                    <span className="text-base">{job.toFlag}</span>
                    <span className="text-neutral-300 truncate">{job.to}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Weight className="w-4 h-4 text-blue-400" />
                      <span className="text-neutral-300">{job.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-neutral-300">{job.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-yellow-400" />
                      <span className="text-neutral-300">{job.deadline}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 space-y-2 pr-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-blue-400" />
                        <span className="text-neutral-400">Distance from you:</span>
                        <span className="font-semibold text-blue-400">{job.userDistance}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Fuel className="w-4 h-4 text-red-400" />
                        <span className="text-neutral-400">Est. Fuel:</span>
                        <span className="font-semibold text-red-400">{job.fuelCost}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg border border-green-500/30"></div>
                      <div className="relative bg-gradient-to-br from-green-500/10 to-transparent rounded-lg p-4 border border-green-500/20">
                        <p className="text-xs text-green-400 mb-1 font-medium">CURRENT BID</p>
                        <p className="text-2xl font-bold text-green-400 mb-1">{job.currentBid}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">{job.totalBids} bids</span>
                          <span className="text-green-300 font-medium">
                            $
                            {(
                              Number.parseInt(job.currentBid.replace("$", "").replace(",", "")) /
                              Number.parseInt(job.distance.replace(" mi", ""))
                            ).toFixed(2)}
                            /km
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end items-center">
                    {selectedBid === job.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
                          <Input
                            type="number"
                            placeholder="2800"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-20 h-8 pl-6 bg-neutral-700 border-neutral-600 text-white text-sm"
                          />
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 font-semibold h-8 text-sm px-3"
                          disabled={!isVerified}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          BID
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedBid(null)}
                          className="h-8 text-sm px-2"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-semibold h-8 text-sm px-3"
                        onClick={() => setSelectedBid(job.id)}
                        disabled={!isVerified}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        PLACE BID
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeTab === "transfers") {
    return (
      <div className="p-6 space-y-6">
        {/* Transfer Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">TOTAL EARNED</p>
                  <p className="text-2xl font-bold text-green-400">$47k</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">ACTIVE</p>
                  <p className="text-2xl font-bold text-blue-400">3</p>
                </div>
                <Truck className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">COMPLETED</p>
                  <p className="text-2xl font-bold text-purple-400">28</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">RATING</p>
                  <p className="text-2xl font-bold text-yellow-400">4.8</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incoming Offers */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-yellow-500 flex items-center gap-2">
              <Package className="w-5 h-5" />
              INCOMING OFFERS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: "IO001",
                product: "Premium Wheat",
                quantity: "30 tons",
                from: "Iowa Premium Farms",
                fromFlag: "🇺🇸",
                to: "Chicago Grain Terminal",
                toFlag: "🇺🇸",
                distance: "195 mi",
                userDistance: "52 mi",
                deadline: "Oct 5",
                offeredPrice: "$3,800",
                estimatedFuel: "$485",
                estimatedProfit: "$1,200",
                priority: "high",
                timeToRespond: "2d 14h",
                tags: ["Non-GMO", "Premium Grade"],
                adminNote: "Preferred transporter for this route",
              },
              {
                id: "IO002",
                product: "Organic Soybeans",
                quantity: "22 tons",
                from: "Nebraska Organic Co.",
                fromFlag: "🇺🇸",
                to: "Kansas Processing Hub",
                toFlag: "🇺🇸",
                distance: "165 mi",
                userDistance: "38 mi",
                deadline: "Oct 8",
                offeredPrice: "$2,950",
                estimatedFuel: "$380",
                estimatedProfit: "$890",
                priority: "medium",
                timeToRespond: "4d 8h",
                tags: ["Organic", "Export Quality"],
                adminNote: "Long-term partnership opportunity",
              },
            ].map((offer) => (
              <Card
                key={offer.id}
                className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/30 to-yellow-600/10 rounded-lg flex items-center justify-center border border-yellow-500/30">
                        <Package className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{offer.product}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {offer.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs text-yellow-400 border-yellow-500/50"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={offer.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                        {offer.priority === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        DIRECT OFFER
                      </Badge>
                      <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/50">
                        <Timer className="w-3 h-3 mr-1" />
                        {offer.timeToRespond}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                    <p className="text-sm text-yellow-300 italic">"{offer.adminNote}"</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className="text-base">{offer.fromFlag}</span>
                    <span className="text-neutral-300 truncate">{offer.from}</span>
                    <span className="text-neutral-500">→</span>
                    <span className="text-base">{offer.toFlag}</span>
                    <span className="text-neutral-300 truncate">{offer.to}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Weight className="w-4 h-4 text-blue-400" />
                      <span className="text-neutral-300">{offer.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-neutral-300">{offer.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-yellow-400" />
                      <span className="text-neutral-300">{offer.deadline}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-400 mb-1">OFFERED PRICE</p>
                      <p className="text-lg font-bold text-green-400">{offer.offeredPrice}</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-red-400 mb-1">EST. FUEL</p>
                      <p className="text-lg font-bold text-red-400">{offer.estimatedFuel}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-400 mb-1">EST. PROFIT</p>
                      <p className="text-lg font-bold text-blue-400">{offer.estimatedProfit}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <Navigation className="w-4 h-4 text-blue-400" />
                      <span>
                        Distance from you: <span className="text-blue-400 font-medium">{offer.userDistance}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                      >
                        DECLINE
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
                      >
                        COUNTER OFFER
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        ACCEPT
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Active Transfers */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-green-500 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              MY ACTIVE TRANSFERS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: "TR001",
                product: "Wheat",
                quantity: "25 tons",
                from: "Iowa Farm Co.",
                to: "Chicago Terminal",
                status: "traveling",
                currentStage: 2,
                earnings: "$3,200",
                eta: "4h 30m",
                distance: "180 miles",
              },
              {
                id: "TR002",
                product: "Corn",
                quantity: "40 tons",
                from: "Nebraska Harvest",
                to: "Kansas Processing",
                status: "scheduled",
                currentStage: 0,
                earnings: "$4,800",
                eta: "Tomorrow 8:00 AM",
                distance: "220 miles",
              },
              {
                id: "TR003",
                product: "Soybeans",
                quantity: "15 tons",
                from: "Illinois Organic",
                to: "Milwaukee Port",
                status: "arrived",
                currentStage: 3,
                earnings: "$2,400",
                eta: "Ready for pickup",
                distance: "150 miles",
              },
            ].map((transfer) => (
              <Card key={transfer.id} className="bg-neutral-900 border-neutral-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{transfer.product}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Weight className="w-4 h-4" />
                          {transfer.quantity}
                        </div>
                        <div className="flex items-center gap-1">
                          <Route className="w-4 h-4" />
                          {transfer.distance}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-500">Earnings:</span>
                          <span className="text-green-400 font-medium">{transfer.earnings}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        transfer.status === "traveling"
                          ? "bg-purple-500"
                          : transfer.status === "arrived"
                            ? "bg-indigo-500"
                            : "bg-blue-500"
                      } text-white flex items-center gap-1`}
                    >
                      {transfer.status === "traveling" && <Truck className="w-3 h-3 mr-1" />}
                      {transfer.status === "arrived" && <MapPin className="w-3 h-3 mr-1" />}
                      {transfer.status === "scheduled" && <Calendar className="w-3 h-3 mr-1" />}
                      {transfer.status.toUpperCase()}
                    </Badge>
                  </div>

                  {renderTransferStageIndicator(transfer.currentStage)}

                  {/* Transfer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-neutral-400">From:</span>
                        <div className="text-white font-medium">{transfer.from}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-neutral-400">To:</span>
                        <div className="text-white font-medium">{transfer.to}</div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Clock className="w-3 h-3" />
                          ETA: {transfer.eta}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-6">
                    {transfer.status === "traveling" && (
                      <Button size="sm" variant="outline" className="bg-transparent border-neutral-600">
                        <Pause className="w-3 h-3 mr-1" />
                        UPDATE STATUS
                      </Button>
                    )}
                    {transfer.status === "scheduled" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Play className="w-3 h-3 mr-1" />
                        START JOURNEY
                      </Button>
                    )}
                    {transfer.status === "arrived" && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        CONFIRM PICKUP
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-neutral-400 hover:text-white">
                      VIEW DETAILS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (activeTab === "fleet") {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {/* Fleet Overview Stats */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">TOTAL TRUCKS</p>
                  <p className="text-lg md:text-2xl font-bold text-blue-400">12</p>
                </div>
                <Truck className="w-4 h-4 md:w-8 md:h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">AVAILABLE</p>
                  <p className="text-lg md:text-2xl font-bold text-green-400">8</p>
                </div>
                <CheckCircle className="w-4 h-4 md:w-8 md:h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">IN TRANSIT</p>
                  <p className="text-lg md:text-2xl font-bold text-yellow-400">4</p>
                </div>
                <Route className="w-4 h-4 md:w-8 md:h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400">VERIFIED</p>
                  <p className="text-lg md:text-2xl font-bold text-purple-400">10</p>
                </div>
                <Shield className="w-4 h-4 md:w-8 md:h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Popover open={showAddTruck} onOpenChange={setShowAddTruck}>
            <PopoverTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                ADD NEW TRUCK
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 bg-neutral-900 border-neutral-700">
              <div className="space-y-4">
                <h3 className="font-semibold text-green-500">Add New Truck</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">License Plate *</label>
                    <Input
                      placeholder="ABC-1234"
                      value={newTruckData.licensePlate}
                      onChange={(e) => setNewTruckData({ ...newTruckData, licensePlate: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Model</label>
                    <Input
                      placeholder="Volvo FH16"
                      value={newTruckData.model}
                      onChange={(e) => setNewTruckData({ ...newTruckData, model: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Capacity (tons)</label>
                    <Input
                      placeholder="40"
                      value={newTruckData.capacity}
                      onChange={(e) => setNewTruckData({ ...newTruckData, capacity: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Year</label>
                    <Input
                      placeholder="2022"
                      value={newTruckData.year}
                      onChange={(e) => setNewTruckData({ ...newTruckData, year: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowAddTruck(false)}>
                  <Shield className="w-4 h-4 mr-2" />
                  SUBMIT FOR VERIFICATION
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={showAddDriver} onOpenChange={setShowAddDriver}>
            <PopoverTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                ADD NEW DRIVER
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-neutral-900 border-neutral-700">
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-500">Add New Driver</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Driver Name</label>
                    <Input
                      placeholder="John Smith"
                      value={newDriverData.name}
                      onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">License Number</label>
                    <Input
                      placeholder="CDL123456789"
                      value={newDriverData.license}
                      onChange={(e) => setNewDriverData({ ...newDriverData, license: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Phone Number</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={newDriverData.phone}
                      onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 mb-1 block">Experience</label>
                    <Input
                      placeholder="8 years"
                      value={newDriverData.experience}
                      onChange={(e) => setNewDriverData({ ...newDriverData, experience: e.target.value })}
                      className="bg-neutral-800 border-neutral-600"
                    />
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddDriver(false)}>
                  <User className="w-4 h-4 mr-2" />
                  ADD DRIVER
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Fleet List */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-green-500 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              MY FLEET
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: "T001",
                licensePlate: "ABC-1234",
                model: "Volvo FH16",
                capacity: "40 tons",
                status: "available",
                location: "Chicago, IL 🇺🇸",
                verified: true,
                driver: null,
              },
              {
                id: "T002",
                licensePlate: "DEF-5678",
                model: "Mercedes Actros",
                capacity: "35 tons",
                status: "assigned",
                location: "En route to Kansas 🇺🇸",
                verified: true,
                driver: "Mike Johnson",
                assignment: "Wheat Transport - Iowa to Chicago",
              },
              {
                id: "T003",
                licensePlate: "GHI-9012",
                model: "Scania R500",
                capacity: "45 tons",
                status: "assigned",
                location: "Milwaukee, WI 🇺🇸",
                verified: true,
                driver: "Sarah Davis",
                assignment: "Corn Transport - Wisconsin to Kansas",
              },
              {
                id: "T004",
                licensePlate: "JKL-3456",
                model: "Peterbilt 579",
                capacity: "38 tons",
                status: "available",
                location: "Des Moines, IA 🇺🇸",
                verified: false,
              },
            ].map((truck) => (
              <Card
                key={truck.id}
                className="bg-neutral-900 border-neutral-700 hover:border-green-500/50 transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500/30 to-green-600/10 rounded-lg flex items-center justify-center border border-green-500/30">
                        <Truck className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{truck.licensePlate}</h3>
                          {truck.verified && <Shield className="w-4 h-4 text-green-400" />}
                        </div>
                        <p className="text-sm text-neutral-400">
                          {truck.model} • {truck.capacity}
                        </p>
                      </div>
                    </div>
                    <Badge variant={truck.status === "available" ? "secondary" : "default"} className="text-xs">
                      {truck.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-neutral-300">{truck.location}</span>
                    </div>

                    {truck.status === "assigned" && truck.driver && (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-yellow-400" />
                          <span className="text-neutral-300">Driver: {truck.driver}</span>
                        </div>
                        {truck.assignment && (
                          <div className="flex items-center gap-2 text-sm">
                            <Route className="w-4 h-4 text-green-400" />
                            <span className="text-neutral-300">{truck.assignment}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-end items-center">
                    <Button size="sm" variant="ghost" className="text-xs">
                      EDIT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-blue-500 flex items-center gap-2">
              <User className="w-5 h-5" />
              AVAILABLE DRIVERS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: "D001",
                name: "John Smith",
                license: "CDL123456789",
                phone: "+1 (555) 123-4567",
                status: "available",
                experience: "8 years",
              },
              {
                id: "D002",
                name: "Mike Johnson",
                license: "CDL987654321",
                phone: "+1 (555) 987-6543",
                status: "assigned",
                experience: "12 years",
                assignment: "Truck DEF-5678",
              },
              {
                id: "D003",
                name: "Sarah Davis",
                license: "CDL456789123",
                phone: "+1 (555) 456-7890",
                status: "assigned",
                experience: "6 years",
                assignment: "Truck GHI-9012",
              },
            ].map((driver) => (
              <Card
                key={driver.id}
                className="bg-neutral-900 border-neutral-700 hover:border-blue-500/50 transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-blue-600/10 rounded-lg flex items-center justify-center border border-blue-500/30">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{driver.name}</h3>
                        <p className="text-sm text-neutral-400">{driver.experience} experience</p>
                        {driver.assignment && (
                          <p className="text-xs text-green-400">Assigned to: {driver.assignment}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={driver.status === "available" ? "secondary" : "default"} className="text-xs mb-2">
                        {driver.status.toUpperCase()}
                      </Badge>
                      <Button size="sm" variant="ghost" className="text-xs">
                        EDIT
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
