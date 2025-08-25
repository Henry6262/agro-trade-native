"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { PRODUCTS } from "../constants"
import { useOnboardingStore } from "@/stores/onboarding-store"

export function ProductSelection() {
  const { selectedProducts, setSelectedProducts } = useOnboardingStore()

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      setSelectedProducts([...selectedProducts, productId])
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Select Your Products</h2>
        <p className="text-neutral-400">Choose the agricultural products you want to trade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRODUCTS.map((product) => {
          const isSelected = selectedProducts.includes(product.id)
          return (
            <Card
              key={product.id}
              onClick={() => toggleProduct(product.id)}
              className={`p-4 cursor-pointer transition-all duration-200 bg-neutral-800 border-2 ${
                isSelected
                  ? "border-green-500 bg-green-500/10"
                  : "border-neutral-700 hover:border-neutral-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{product.icon}</span>
                    <h3 className="font-semibold text-white">{product.name}</h3>
                  </div>
                  <p className="text-sm text-neutral-400 mb-3">{product.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(product.specifications).slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs bg-neutral-700 text-neutral-300">
                        {spec.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {selectedProducts.length > 0 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </div>
  )
}