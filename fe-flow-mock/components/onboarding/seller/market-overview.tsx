"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { products } from "../constants"
import type { ProductSpecification } from "../types"
import { TrendingUp, Users, Zap, ShoppingCart } from "lucide-react"

interface MarketOverviewProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onComplete?: () => void
}

export function MarketOverview({ selectedProducts, specifications, onComplete }: MarketOverviewProps) {
  const handleCreateSellRequest = () => {
    // Handle sell request creation
    console.log("Creating sell request with:", { selectedProducts, specifications })
    onComplete?.()
  }

  const totalWeight = specifications.reduce((sum, spec) => {
    const quantity = Number.parseInt(spec.quantity) || 0
    const multiplier = spec.unit === "ton" ? 1000 : spec.unit === "quintal" ? 100 : 1
    return sum + quantity * multiplier
  }, 0)

  const totalValue = specifications.reduce((sum, spec) => {
    const quantity = Number.parseInt(spec.quantity) || 0
    const pricePerKilo = Number.parseFloat(spec.pricePerKilo) || 0
    const multiplier = spec.unit === "ton" ? 1000 : spec.unit === "quintal" ? 100 : 1
    return sum + quantity * multiplier * pricePerKilo
  }, 0)

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-4">
        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Ready to Sell
        </h2>
        <p className="text-muted-foreground lg:text-lg">Review your products and connect with buyers</p>
      </div>

      <div className="flex justify-center space-x-6 text-center">
        <div className="flex items-center space-x-2 text-sm text-emerald-600">
          <Users className="w-4 h-4" />
          <span>1,847 active buyers</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <TrendingUp className="w-4 h-4" />
          <span>₹2.8Cr traded today</span>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-emerald-600" />
            Your Products
          </h3>
          <Badge className="bg-emerald-100 text-emerald-700">
            {specifications.length} item{specifications.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="space-y-4">
          {specifications.map((spec) => {
            const product = products.find((p) => p.id === spec.productId)
            if (!product) return null

            const itemWeight = (() => {
              const quantity = Number.parseInt(spec.quantity) || 0
              const multiplier = spec.unit === "ton" ? 1000 : spec.unit === "quintal" ? 100 : 1
              return quantity * multiplier
            })()

            const itemValue = (() => {
              const pricePerKilo = Number.parseFloat(spec.pricePerKilo) || 0
              return itemWeight * pricePerKilo
            })()

            return (
              <div
                key={spec.productId}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{product.icon}</div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{product.name}</h4>
                    <p className="text-sm text-slate-600">
                      {spec.quantity} {spec.unit} • ₹{spec.pricePerKilo}/kg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800">₹{itemValue.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">{itemWeight}kg total</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-200 mt-6 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-slate-800">Total Weight</div>
              <div className="text-sm text-slate-600">{totalWeight.toLocaleString()} kg</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-800">Total Value</div>
              <div className="text-lg font-bold text-emerald-600">₹{totalValue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center space-y-4">
        <Button
          size="lg"
          onClick={handleCreateSellRequest}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={specifications.length === 0 || !specifications.every((spec) => spec.quantity && spec.pricePerKilo)}
        >
          <Zap className="w-5 h-5 mr-2" />
          Create Sell Request
        </Button>

        <p className="text-xs text-slate-500">You'll be asked to sign in to complete your listing</p>
      </div>
    </div>
  )
}
