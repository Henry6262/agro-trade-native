"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, ChevronDown, Package } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { products } from "../constants"
import type { ProductSpecification } from "../types"

interface BuyerSpecificationsProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
}

interface CustomField {
  id: string
  name: string
  value: string
  type: "text" | "number" | "percentage"
}

export function BuyerSpecifications({
  selectedProducts,
  specifications,
  onSpecificationsChange,
}: BuyerSpecificationsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [customFields, setCustomFields] = useState<Record<string, CustomField[]>>({})

  const safeSpecifications = specifications || []

  const updateSpecification = (productId: string, field: string, value: any) => {
    const updatedSpecs = safeSpecifications.map((spec) =>
      spec.productId === productId ? { ...spec, [field]: value } : spec,
    )
    onSpecificationsChange(updatedSpecs)
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
    const product = products.find((p) => p.id === productId)
    const spec = safeSpecifications.find((s) => s.productId === productId)
    if (!product || !spec) return null

    const isExpanded = expandedCards.has(productId)
    const hasRequiredFields = spec.quantity && spec.unit && spec.pricePerKilo

    return (
      <motion.div
        key={productId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={`overflow-hidden transition-all duration-300 border-2 ${
            hasRequiredFields
              ? "bg-emerald-500/10 backdrop-blur-sm border-emerald-500/30 shadow-lg shadow-emerald-200/30 hover:shadow-xl hover:shadow-emerald-200/40"
              : "hover:shadow-lg hover:border-emerald-200"
          }`}
        >
          <div
            className={`p-4 border-b ${
              hasRequiredFields
                ? "bg-gradient-to-r from-emerald-50/80 to-blue-50/80 backdrop-blur-sm"
                : "bg-gradient-to-r from-emerald-50 to-blue-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                    hasRequiredFields ? "bg-white/90 backdrop-blur-sm" : "bg-white"
                  }`}
                >
                  <span className="text-2xl">{product.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
              </div>
              <Badge
                variant={hasRequiredFields ? "default" : "secondary"}
                className={`font-medium transition-all duration-200 ${
                  hasRequiredFields ? "bg-emerald-500/90 hover:bg-emerald-600 shadow-lg shadow-emerald-200/50" : ""
                }`}
              >
                {hasRequiredFields ? "Ready" : "Setup Required"}
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Amount Needed <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  type="number"
                  value={spec.quantity || ""}
                  onChange={(e) => updateSpecification(productId, "quantity", Number(e.target.value))}
                  placeholder="e.g., 100"
                  className={`border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 py-2 text-sm bg-white/90 backdrop-blur-sm hover:border-emerald-300 transition-all duration-200 ${
                    !spec.quantity ? "border-red-300 focus:border-red-500" : ""
                  }`}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Unit <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={spec.unit || ""}
                  onChange={(e) => updateSpecification(productId, "unit", e.target.value)}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-emerald-300"
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
                <label className="block text-xs font-semibold text-gray-700">
                  Max Price per {spec.unit || "Unit"} <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={spec.pricePerKilo || ""}
                  onChange={(e) => updateSpecification(productId, "pricePerKilo", Number(e.target.value))}
                  placeholder="Max price"
                  className={`border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 py-2 text-sm bg-white/90 backdrop-blur-sm hover:border-emerald-300 transition-all duration-200 ${
                    !spec.pricePerKilo ? "border-red-300 focus:border-red-500" : ""
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
                className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/80 backdrop-blur-sm transition-all duration-200 py-3"
              >
                <Plus className={`w-4 h-4 mr-2 transition-transform duration-200 ${isExpanded ? "rotate-45" : ""}`} />
                {isExpanded ? "Hide Custom Requirements" : "Add Custom Requirements"}
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </Button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden space-y-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Custom Requirements
                    </h4>
                    <Button
                      onClick={() => addCustomField(productId)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Field
                    </Button>
                  </div>

                  {customFields[productId]?.map((field) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200"
                    >
                      <Input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateCustomField(productId, field.id, { name: e.target.value })}
                        placeholder="Requirement name"
                        className="border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />

                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateCustomField(productId, field.id, { type: e.target.value as CustomField["type"] })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        className="border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />

                      <Button
                        onClick={() => removeCustomField(productId, field.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  {(!customFields[productId] || customFields[productId].length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No custom requirements added yet.</p>
                      <p className="text-sm">Click "Add Field" to specify your needs.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-3">
        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Your Requirements
        </h2>
        <p className="text-gray-600 lg:text-lg max-w-2xl mx-auto">
          Specify what you're looking for in each product. Add custom requirements for specific needs.
        </p>
      </div>

      {safeSpecifications.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {safeSpecifications.map((spec) => renderProductCard(spec.productId))}
          </div>
        </div>
      )}

      {safeSpecifications.length === 0 && (
        <Card className="p-6 lg:p-8 text-center">
          <div className="space-y-3 lg:space-y-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Package className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold lg:text-lg">No Products Selected</h3>
              <p className="text-sm lg:text-base text-muted-foreground">Go back to select products first</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
