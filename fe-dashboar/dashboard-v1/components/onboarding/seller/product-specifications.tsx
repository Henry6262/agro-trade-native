"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PRODUCTS } from "../constants"
import { useOnboardingStore } from "@/stores/onboarding-store"

export function ProductSpecifications() {
  const { selectedProducts, sellerSpecifications, updateSellerSpecification } = useOnboardingStore()

  const getSelectedProductsData = () => {
    return PRODUCTS.filter((p) => selectedProducts.includes(p.id))
  }

  const handleSpecificationChange = (productId: string, specKey: string, value: string) => {
    updateSellerSpecification(productId, { [specKey]: value })
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Product Specifications</h2>
        <p className="text-neutral-400">Set the quality parameters for your products</p>
      </div>

      <div className="space-y-6">
        {getSelectedProductsData().map((product) => (
          <Card key={product.id} className="p-6 bg-neutral-800 border-neutral-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{product.icon}</span>
              <h3 className="text-lg font-semibold text-white">{product.name}</h3>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Selected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, spec]) => (
                <div key={key}>
                  <Label className="text-sm text-neutral-400 mb-1">
                    {key.replace(/_/g, " ").charAt(0).toUpperCase() + key.replace(/_/g, " ").slice(1)}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={`${spec.min} - ${spec.max}`}
                      value={sellerSpecifications[product.id]?.[key] || ""}
                      onChange={(e) => handleSpecificationChange(product.id, key, e.target.value)}
                      className="bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-500"
                    />
                    <span className="text-sm text-neutral-500">{spec.unit}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Standard: {spec.min} - {spec.max} {spec.unit}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}