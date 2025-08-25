"use client"

import { Calendar, TrendingUp, Users, Package } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { PRODUCTS } from "../constants"

export function BuyerMarketRequest() {
  const { 
    selectedProducts, 
    buyerSpecifications,
    deliveryDeadline,
    setDeliveryDeadline 
  } = useOnboardingStore()

  const totalValue = selectedProducts.reduce((sum, productId) => {
    const spec = buyerSpecifications[productId] || {}
    const quantity = spec.quantity || 0
    const price = spec.pricePerKilo || 0
    return sum + quantity * price
  }, 0)

  const totalWeight = selectedProducts.reduce((sum, productId) => {
    const spec = buyerSpecifications[productId] || {}
    return sum + (spec.quantity || 0)
  }, 0)

  const getMarketInsights = () => {
    const productCount = selectedProducts.length
    const avgPrice = totalValue / totalWeight || 0

    return {
      activeSellers: Math.floor(Math.random() * 50) + 20,
      availableStock: Math.floor(totalWeight * (2 + Math.random() * 3)),
      matchRate: Math.floor(85 + Math.random() * 15),
      avgMarketPrice: avgPrice * (0.9 + Math.random() * 0.2),
    }
  }

  const insights = getMarketInsights()

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
          Purchase Request
        </h2>
        <p className="text-neutral-400 lg:text-lg max-w-2xl mx-auto">
          Review your buying requirements and set delivery preferences
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-neutral-800 to-neutral-800/80 border-neutral-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Delivery Deadline</h3>
            <p className="text-sm text-neutral-400">When do you need this delivered?</p>
          </div>
        </div>
        <Input
          type="date"
          value={deliveryDeadline}
          onChange={(e) => setDeliveryDeadline(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="max-w-xs bg-neutral-900 border-neutral-600 focus:border-green-500 focus:ring-green-500 text-white"
        />
      </Card>

      <Card className="p-6 bg-neutral-800 border-neutral-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Request Summary</h3>
            <p className="text-sm text-neutral-400">{selectedProducts.length} products in your request</p>
          </div>
        </div>

        <div className="space-y-4">
          {selectedProducts.map((productId, index) => {
            const product = PRODUCTS.find((p) => p.id === productId)
            const spec = buyerSpecifications[productId] || {}
            if (!product) return null

            const itemTotal = (spec.quantity || 0) * (spec.pricePerKilo || 0)

            return (
              <div
                key={productId}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-900 to-neutral-800/80 rounded-xl border border-neutral-700"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-700 flex items-center justify-center shadow-sm">
                    <span className="text-2xl">{product.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{product.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-neutral-400">
                      <span>
                        {spec.quantity} {spec.unit}
                      </span>
                      <span>•</span>
                      <span>
                        Max ${spec.pricePerKilo}/{spec.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">${itemTotal.toFixed(2)}</div>
                  <Badge variant="secondary" className="text-xs bg-neutral-700 text-neutral-300">
                    Budget
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-neutral-700">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-neutral-900 rounded-lg border border-neutral-700">
              <div className="text-2xl font-bold text-white">{totalWeight}</div>
              <div className="text-sm text-neutral-400">Total Weight (kg)</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">${totalValue.toFixed(2)}</div>
              <div className="text-sm text-green-400">Total Budget</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-blue-400">{insights.activeSellers}</div>
              <div className="text-sm text-blue-400">Active Sellers</div>
              <div className="text-xs text-blue-400/70 mt-1">Ready to fulfill requests</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-green-400">{insights.availableStock.toLocaleString()}</div>
              <div className="text-sm text-green-400">kg Available</div>
              <div className="text-xs text-green-400/70 mt-1">In selected products</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-2xl font-bold text-amber-400">{insights.matchRate}%</div>
              <div className="text-sm text-amber-400">Success Rate</div>
              <div className="text-xs text-amber-400/70 mt-1">Request fulfillment</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}