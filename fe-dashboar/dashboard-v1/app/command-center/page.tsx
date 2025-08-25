"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, TrendingUp, Package, Truck, AlertCircle, CheckCircle, Clock, ArrowRight } from "lucide-react"

export default function CommandCenterPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-6 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" />
              ORDER OVERVIEW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500 font-mono">47</div>
                <div className="text-xs text-neutral-500">Sell Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500 font-mono">63</div>
                <div className="text-xs text-neutral-500">Buy Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500 font-mono">23</div>
                <div className="text-xs text-neutral-500">Matched</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { id: "ORD-001", product: "WHEAT - 50 TONS", status: "active", price: "$280/ton", icon: Clock },
                { id: "ORD-002", product: "CORN - 25 TONS", status: "matched", price: "$320/ton", icon: CheckCircle },
                { id: "ORD-003", product: "RICE - 100 TONS", status: "active", price: "$450/ton", icon: Clock },
                { id: "ORD-004", product: "SOYBEANS - 75 TONS", status: "transit", price: "$380/ton", icon: Truck },
              ].map((order) => {
                const IconComponent = order.icon
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent
                        className={`w-4 h-4 ${
                          order.status === "active"
                            ? "text-green-400"
                            : order.status === "matched"
                              ? "text-yellow-400"
                              : "text-blue-400"
                        }`}
                      />
                      <div>
                        <div className="text-xs text-white font-mono">{order.id}</div>
                        <div className="text-xs text-neutral-400">{order.product}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-green-400 font-mono">{order.price}</div>
                      <ArrowRight className="w-3 h-3 text-neutral-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              LIVE TRADE EVENTS
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[
                {
                  time: "2 min ago",
                  type: "sale",
                  trader: "FarmCorp Ltd",
                  action: "completed sale of 50T wheat",
                  location: "Mumbai → Delhi",
                  buyer: "GrainTech",
                  icon: CheckCircle,
                  color: "text-green-500",
                },
                {
                  time: "5 min ago",
                  type: "match",
                  trader: "AgriSupply Co",
                  action: "order matched for 25T corn",
                  location: "Delhi",
                  buyer: "FoodChain Inc",
                  icon: TrendingUp,
                  color: "text-yellow-500",
                },
                {
                  time: "12 min ago",
                  type: "alert",
                  trader: "HarvestPro",
                  action: "transport delayed",
                  location: "Bangalore",
                  buyer: null,
                  icon: AlertCircle,
                  color: "text-orange-500",
                },
                {
                  time: "18 min ago",
                  type: "listing",
                  trader: "CropMaster",
                  action: "listed 100T rice order",
                  location: "Chennai",
                  buyer: null,
                  icon: Package,
                  color: "text-blue-500",
                },
                {
                  time: "25 min ago",
                  type: "delivery",
                  trader: "GreenFields",
                  action: "delivery completed",
                  location: "Kolkata",
                  buyer: "FoodChain Inc",
                  icon: CheckCircle,
                  color: "text-green-500",
                },
                {
                  time: "32 min ago",
                  type: "transport",
                  trader: "Swift Transport",
                  action: "pickup scheduled",
                  location: "Punjab → Mumbai",
                  buyer: null,
                  icon: Truck,
                  color: "text-purple-500",
                },
              ].map((event, index) => {
                const IconComponent = event.icon
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <IconComponent className={`w-4 h-4 mt-0.5 ${event.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-400 font-mono">{event.time}</span>
                        <div
                          className={`text-xs px-2 py-0.5 rounded ${
                            event.type === "sale"
                              ? "bg-green-900 text-green-300"
                              : event.type === "match"
                                ? "bg-yellow-900 text-yellow-300"
                                : event.type === "alert"
                                  ? "bg-orange-900 text-orange-300"
                                  : event.type === "delivery"
                                    ? "bg-green-900 text-green-300"
                                    : event.type === "transport"
                                      ? "bg-purple-900 text-purple-300"
                                      : "bg-blue-900 text-blue-300"
                          }`}
                        >
                          {event.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-xs text-white">
                        <span className="text-green-400 font-mono">{event.trader}</span> {event.action}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        📍 {event.location}
                        {event.buyer && (
                          <span className="ml-2">
                            → <span className="text-blue-400 font-mono">{event.buyer}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              TRADE VOLUME OVERVIEW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Line */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,120 50,100 100,110 150,90 200,95 250,85 300,100 350,80"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                />
                <polyline
                  points="0,140 50,135 100,130 150,125 200,130 250,135 300,125 350,120"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-5 font-mono">
                <span>500T</span>
                <span>400T</span>
                <span>300T</span>
                <span>200T</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6 font-mono">
                <span>Jan 28, 2025</span>
                <span>Feb 28, 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
