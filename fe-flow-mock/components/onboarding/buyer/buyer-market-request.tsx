"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, TrendingUp, Users, Package } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { products } from "../constants"
import type { ProductSpecification } from "../types"

interface BuyerMarketRequestProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
}

export function BuyerMarketRequest({
  selectedProducts,
  specifications,
  onSpecificationsChange,
}: BuyerMarketRequestProps) {
  const [deliveryDeadline, setDeliveryDeadline] = useState("")

  const totalValue = specifications.reduce((sum, spec) => {
    const quantity = spec.quantity || 0
    const price = spec.pricePerKilo || 0
    return sum + quantity * price
  }, 0)

  const totalWeight = specifications.reduce((sum, spec) => {
    return sum + (spec.quantity || 0)
  }, 0)

  const getMarketInsights = () => {
    const productCount = specifications.length
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
    <div className="space-y-8 pb-24">
      <div className="text-center space-y-3">
        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Purchase Request
        </h2>
        <p className="text-gray-600 lg:text-lg max-w-2xl mx-auto">
          Review your buying requirements and set delivery preferences
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50/80 to-emerald-50/80 backdrop-blur-sm border-2 border-blue-200/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Delivery Deadline</h3>
            <p className="text-sm text-gray-600">When do you need this delivered?</p>
          </div>
        </div>
        <Input
          type="date"
          value={deliveryDeadline}
          onChange={(e) => setDeliveryDeadline(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="max-w-xs border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white/90 backdrop-blur-sm"
        />
      </Card>

      <Card className="p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Request Summary</h3>
            <p className="text-sm text-gray-600">{specifications.length} products in your request</p>
          </div>
        </div>

        <div className="space-y-4">
          {specifications.map((spec, index) => {
            const product = products.find((p) => p.id === spec.productId)
            if (!product) return null

            const itemTotal = (spec.quantity || 0) * (spec.pricePerKilo || 0)

            return (
              <motion.div
                key={spec.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl border border-emerald-200/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <span className="text-2xl">{product.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                  <div className="font-bold text-lg text-gray-900">${itemTotal.toFixed(2)}</div>
                  <Badge variant="secondary" className="text-xs">
                    Budget
                  </Badge>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{totalWeight}</div>
              <div className="text-sm text-gray-600">Total Weight (kg)</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">${totalValue.toFixed(2)}</div>
              <div className="text-sm text-emerald-700">Total Budget</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{insights.activeSellers}</div>
              <div className="text-sm text-blue-700">Active Sellers</div>
              <div className="text-xs text-blue-600 mt-1">Ready to fulfill requests</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-emerald-600" />
            <div>
              <div className="text-2xl font-bold text-emerald-600">{insights.availableStock.toLocaleString()}</div>
              <div className="text-sm text-emerald-700">kg Available</div>
              <div className="text-xs text-emerald-600 mt-1">In selected products</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-amber-600" />
            <div>
              <div className="text-2xl font-bold text-amber-600">{insights.matchRate}%</div>
              <div className="text-sm text-amber-700">Success Rate</div>
              <div className="text-xs text-amber-600 mt-1">Request fulfillment</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
