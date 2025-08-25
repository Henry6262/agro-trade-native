"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Package, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { products } from "../constants"
import type { ProductSpecification } from "../types"
import { useState } from "react"
import { motion } from "framer-motion"

interface ProductSpecificationsProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
}

export function ProductSpecifications({
  selectedProducts,
  specifications,
  onSpecificationsChange,
}: ProductSpecificationsProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const updateSpecification = (productId: string, field: string, value: any) => {
    const updatedSpecs = specifications.map((spec) =>
      spec.productId === productId ? { ...spec, [field]: value } : spec,
    )
    onSpecificationsChange(updatedSpecs)
  }

  const toggleCardExpansion = (productId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedCards(newExpanded)
  }

  const getSpecificationFields = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return []

    const baseFields = [
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        required: true,
        placeholder: "e.g., 100",
        priority: "high",
      },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        options: ["kg", "quintal", "ton", "pieces", "boxes"],
        priority: "high",
      },
      {
        key: "pricePerKilo",
        label: "Price per Kilo",
        type: "number",
        placeholder: "e.g., 25",
        priority: "high",
      },
    ]

    const categoryFields: Record<string, any[]> = {
      "Grains & Cereals": [
        { key: "moistureContent", label: "Moisture %", type: "number", placeholder: "e.g., 12", priority: "low" },
        { key: "harvestDate", label: "Harvest Date", type: "date", priority: "low" },
        {
          key: "storageLocation",
          label: "Storage Location",
          type: "text",
          placeholder: "e.g., Warehouse A",
          priority: "low",
        },
        {
          key: "qualityGrade",
          label: "Quality Grade",
          type: "select",
          options: ["Premium", "Grade A", "Grade B", "Standard", "Organic Certified"],
          priority: "low",
        },
      ],
      Fruits: [
        {
          key: "qualityGrade",
          label: "Quality Grade",
          type: "select",
          options: ["Premium", "Grade A", "Grade B", "Standard", "Organic Certified"],
          priority: "low",
        },
        {
          key: "ripeness",
          label: "Ripeness",
          type: "select",
          options: ["Green", "Semi-ripe", "Ripe", "Overripe"],
          priority: "low",
        },
        {
          key: "size",
          label: "Size",
          type: "select",
          options: ["Small", "Medium", "Large", "Extra Large"],
          priority: "low",
        },
        {
          key: "packingType",
          label: "Packing",
          type: "select",
          options: ["Loose", "Crates", "Boxes", "Bags"],
          priority: "low",
        },
      ],
      Vegetables: [
        {
          key: "qualityGrade",
          label: "Quality Grade",
          type: "select",
          options: ["Premium", "Grade A", "Grade B", "Standard", "Organic Certified"],
          priority: "low",
        },
        {
          key: "freshness",
          label: "Freshness",
          type: "select",
          options: ["Fresh", "Day Old", "2-3 Days"],
          priority: "low",
        },
        {
          key: "size",
          label: "Size",
          type: "select",
          options: ["Small", "Medium", "Large"],
          priority: "low",
        },
        {
          key: "packingType",
          label: "Packing",
          type: "select",
          options: ["Loose", "Bundles", "Crates", "Bags"],
          priority: "low",
        },
      ],
      "Spices & Herbs": [
        {
          key: "qualityGrade",
          label: "Quality Grade",
          type: "select",
          options: ["Premium", "Grade A", "Grade B", "Standard", "Organic Certified"],
          priority: "low",
        },
        {
          key: "dryness",
          label: "Dryness",
          type: "select",
          options: ["Well Dried", "Semi Dried", "Fresh"],
          priority: "low",
        },
        {
          key: "purity",
          label: "Purity %",
          type: "number",
          placeholder: "e.g., 99",
          priority: "low",
        },
        {
          key: "packingType",
          label: "Packing",
          type: "select",
          options: ["Loose", "Sealed Bags", "Containers"],
          priority: "low",
        },
      ],
    }

    const additionalFields = categoryFields[product.category] || []
    return [...baseFields, ...additionalFields]
  }

  const renderSpecificationForm = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    const spec = specifications.find((s) => s.productId === productId)
    if (!product || !spec) return null

    const fields = getSpecificationFields(productId)
    const isExpanded = expandedCards.has(productId)

    const highPriorityFields = fields.filter((f) => f.priority === "high")
    const otherFields = fields.filter((f) => f.priority !== "high")

    const hasRequiredFields = spec.quantity && spec.unit

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
              {highPriorityFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={spec[field.key] || ""}
                      onChange={(e) => updateSpecification(productId, field.key, e.target.value)}
                      className="w-full px-2 py-2 text-sm border-2 border-gray-200 rounded-lg bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-emerald-300"
                    >
                      <option value="">Select</option>
                      {field.options?.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type}
                      value={spec[field.key] || ""}
                      onChange={(e) => updateSpecification(productId, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`border-2 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 py-2 text-sm bg-white/90 backdrop-blur-sm hover:border-emerald-300 transition-all duration-200 ${
                        field.required && !spec[field.key] ? "border-red-300 focus:border-red-500" : ""
                      }`}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>

            {otherFields.length > 0 && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleCardExpansion(productId)}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/80 backdrop-blur-sm transition-all duration-200 py-3"
                >
                  <Plus className={`w-4 h-4 mr-2 transition-transform duration-200 ${isExpanded ? "rotate-45" : ""}`} />
                  {isExpanded ? "Hide Additional Details" : "Add More Details"}
                  {isExpanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            )}

            {isExpanded && otherFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-gray-200"
              >
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  Additional Specifications
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {otherFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          value={spec[field.key] || ""}
                          onChange={(e) => updateSpecification(productId, field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 hover:border-emerald-300"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option: string) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={field.type}
                          value={spec[field.key] || ""}
                          onChange={(e) => updateSpecification(productId, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 bg-white/90 backdrop-blur-sm hover:border-emerald-300 transition-all duration-200"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-3">
        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
          Product Details
        </h2>
        <p className="text-gray-600 lg:text-lg max-w-2xl mx-auto">
          Set your quantity and unit to get started. Add more details to attract better buyers.
        </p>
      </div>

      {specifications.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {specifications.map((spec) => renderSpecificationForm(spec.productId))}
          </div>
        </div>
      )}

      {specifications.length === 0 && (
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
