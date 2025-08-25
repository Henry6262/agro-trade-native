"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react"
import { PRODUCTS, MARKET_CONDITIONS } from "../constants"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useState } from "react"

export function MarketOverview() {
  const { selectedProducts, sellerSpecifications } = useOnboardingStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const getSelectedProductsData = () => {
    return PRODUCTS.filter((p) => selectedProducts.includes(p.id))
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "rising") return <TrendingUp className="w-4 h-4 text-green-400" />
    if (trend === "falling") return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-neutral-400" />
  }

  const getDemandColor = (level: string) => {
    if (level === "high") return "text-green-400"
    if (level === "medium") return "text-yellow-400"
    return "text-red-400"
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Products Listed Successfully!</h2>
        <p className="text-neutral-400 text-center mb-6">
          Your products are now available in the marketplace
        </p>
        <Button
          onClick={() => window.location.href = "/seller"}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Market Overview</h2>
        <p className="text-neutral-400">Review current market conditions and list your products</p>
      </div>

      <div className="space-y-6">
        {getSelectedProductsData().map((product) => {
          const demand = MARKET_CONDITIONS.demand[product.id as keyof typeof MARKET_CONDITIONS.demand]
          const price = MARKET_CONDITIONS.averagePrices[product.id as keyof typeof MARKET_CONDITIONS.averagePrices]

          return (
            <Card key={product.id} className="p-6 bg-neutral-800 border-neutral-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                    <p className="text-sm text-neutral-400">{product.description}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Ready to List
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-neutral-700 rounded-lg">
                  <p className="text-xs text-neutral-400 mb-1">Demand Level</p>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getDemandColor(demand.level)}`}>
                      {demand.level.toUpperCase()}
                    </span>
                    {getTrendIcon(demand.trend)}
                  </div>
                </div>

                <div className="p-3 bg-neutral-700 rounded-lg">
                  <p className="text-xs text-neutral-400 mb-1">Market Price</p>
                  <p className="font-semibold text-white">
                    ${price.min} - ${price.max}
                  </p>
                  <p className="text-xs text-neutral-500">{price.currency}</p>
                </div>

                <div className="p-3 bg-neutral-700 rounded-lg">
                  <p className="text-xs text-neutral-400 mb-1">Premium</p>
                  <p className={`font-semibold ${demand.premium > 0 ? "text-green-400" : demand.premium < 0 ? "text-red-400" : "text-neutral-400"}`}>
                    {demand.premium > 0 ? "+" : ""}{demand.premium}%
                  </p>
                </div>
              </div>

              <div className="p-3 bg-neutral-700/50 rounded-lg">
                <p className="text-xs text-neutral-400 mb-2">Your Specifications</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sellerSpecifications[product.id] || {}).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs bg-neutral-600 text-neutral-300">
                      {key.replace(/_/g, " ")}: {value}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <h3 className="font-semibold text-green-400 mb-2">Summary</h3>
        <p className="text-sm text-neutral-300 mb-4">
          You are listing {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} in the marketplace.
          Market conditions are favorable with high demand for most agricultural products.
        </p>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
        >
          {isSubmitting ? "Listing Products..." : "List Products in Marketplace"}
        </Button>
      </div>
    </div>
  )
}