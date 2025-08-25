"use client"

import { useState } from "react"
import { Plus, X, ChevronDown, Package } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { PRODUCTS } from "../constants"

interface CustomField {
  id: string
  name: string
  value: string
  type: "text" | "number" | "percentage"
}

export function BuyerSpecifications() {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [customFields, setCustomFields] = useState<Record<string, CustomField[]>>({})

  const { 
    selectedProducts, 
    buyerSpecifications,
    updateBuyerSpecification 
  } = useOnboardingStore()

  const updateSpecification = (productId: string, field: string, value: any) => {
    const currentSpec = buyerSpecifications[productId] || {}
    updateBuyerSpecification(productId, { ...currentSpec, [field]: value })
  }

  const toggleCard = (productId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const addCustomField = (productId: string) => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: "",
      value: "",
      type: "text",
    }

    setCustomFields((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] || []), newField],
    }))
  }

  const updateCustomField = (productId: string, fieldId: string, updates: Partial<CustomField>) => {
    setCustomFields((prev) => ({
      ...prev,
      [productId]: prev[productId]?.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)) || [],
    }))
  }

  const removeCustomField = (productId: string, fieldId: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [productId]: prev[productId]?.filter((field) => field.id !== fieldId) || [],
    }))
  }

  const renderProductCard = (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId)
    const spec = buyerSpecifications[productId] || {}
    if (!product) return null

    const isExpanded = expandedCards.has(productId)
    const hasRequiredFields = spec.quantity && spec.unit && spec.pricePerKilo

    return (
      <Card
        key={productId}
        className={`overflow-hidden transition-all duration-300 border ${
          hasRequiredFields
            ? "bg-neutral-800/50 border-green-500/30 shadow-lg shadow-green-500/10"
            : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"
        }`}
      >
        <div
          className={`p-4 border-b border-neutral-700 ${
            hasRequiredFields
              ? "bg-gradient-to-r from-green-500/10 to-neutral-800/80"
              : "bg-neutral-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                  hasRequiredFields ? "bg-green-500/20" : "bg-neutral-700"
                }`}
              >
                <span className="text-2xl">{product.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{product.name}</h3>
                <p className="text-sm text-neutral-400">{product.description}</p>
              </div>
            </div>
            <Badge
              variant={hasRequiredFields ? "default" : "secondary"}
              className={`font-medium transition-all duration-200 ${
                hasRequiredFields 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : "bg-neutral-700 text-neutral-300"
              }`}
            >
              {hasRequiredFields ? "Ready" : "Setup Required"}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Amount Needed <span className="text-red-400 ml-1">*</span>
              </label>
              <Input
                type="number"
                value={spec.quantity || ""}
                onChange={(e) => updateSpecification(productId, "quantity", Number(e.target.value))}
                placeholder="e.g., 100"
                className={`bg-neutral-900 border-neutral-600 focus:border-green-500 focus:ring-green-500 text-white placeholder:text-neutral-500 ${
                  !spec.quantity ? "border-red-500 focus:border-red-400" : ""
                }`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Unit <span className="text-red-400 ml-1">*</span>
              </label>
              <select
                value={spec.unit || ""}
                onChange={(e) => updateSpecification(productId, "unit", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select</option>
                <option value="kg">Kilograms</option>
                <option value="quintal">Quintal</option>
                <option value="ton">Tons</option>
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Max Price per {spec.unit || "Unit"} <span className="text-red-400 ml-1">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={spec.pricePerKilo || ""}
                onChange={(e) => updateSpecification(productId, "pricePerKilo", Number(e.target.value))}
                placeholder="Max price"
                className={`bg-neutral-900 border-neutral-600 focus:border-green-500 focus:ring-green-500 text-white placeholder:text-neutral-500 ${
                  !spec.pricePerKilo ? "border-red-500 focus:border-red-400" : ""
                }`}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => toggleCard(productId)}
              className="w-full border-2 border-dashed border-neutral-600 hover:border-green-500 hover:bg-green-500/10 text-neutral-300 hover:text-white transition-all duration-200"
            >
              <Plus className={`w-4 h-4 mr-2 transition-transform duration-200 ${isExpanded ? "rotate-45" : ""}`} />
              {isExpanded ? "Hide Custom Requirements" : "Add Custom Requirements"}
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-neutral-700">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-neutral-200 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Custom Requirements
                </h4>
                <Button
                  onClick={() => addCustomField(productId)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {customFields[productId]?.map((field) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-neutral-900 rounded-lg border border-neutral-700"
                >
                  <Input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateCustomField(productId, field.id, { name: e.target.value })}
                    placeholder="Requirement name"
                    className="bg-neutral-800 border-neutral-600 focus:border-green-500 focus:ring-green-500 text-white placeholder:text-neutral-500"
                  />

                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateCustomField(productId, field.id, { type: e.target.value as CustomField["type"] })
                    }
                    className="px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="percentage">Percentage</option>
                  </select>

                  <Input
                    type={field.type === "text" ? "text" : "number"}
                    value={field.value}
                    onChange={(e) => updateCustomField(productId, field.id, { value: e.target.value })}
                    placeholder={field.type === "percentage" ? "0-100%" : "Value"}
                    className="bg-neutral-800 border-neutral-600 focus:border-green-500 focus:ring-green-500 text-white placeholder:text-neutral-500"
                  />

                  <Button
                    onClick={() => removeCustomField(productId, field.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10 border-red-500/50 hover:border-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {(!customFields[productId] || customFields[productId].length === 0) && (
                <div className="text-center py-8 text-neutral-400">
                  <p>No custom requirements added yet.</p>
                  <p className="text-sm">Click "Add Field" to specify your needs.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
          Your Requirements
        </h2>
        <p className="text-neutral-400 lg:text-lg max-w-2xl mx-auto">
          Specify what you're looking for in each product. Add custom requirements for specific needs.
        </p>
      </div>

      {selectedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedProducts.map((productId) => renderProductCard(productId))}
          </div>
        </div>
      )}

      {selectedProducts.length === 0 && (
        <Card className="p-6 lg:p-8 text-center bg-neutral-800 border-neutral-700">
          <div className="space-y-3 lg:space-y-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-neutral-700 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-6 h-6 lg:w-8 lg:h-8 text-neutral-400" />
            </div>
            <div>
              <h3 className="font-semibold lg:text-lg text-white">No Products Selected</h3>
              <p className="text-sm lg:text-base text-neutral-400">Go back to select products first</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}