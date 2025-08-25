"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Filter } from "lucide-react"
import { products, categories } from "../constants"
import { useOnboardingStore } from "@/stores/onboarding-store"
import type { FilterState } from "../types"

export function ProductSelection() {
  const { selectedProducts, setSelectedProducts } = useOnboardingStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    qualityGrade: [],
    organic: false,
    distance: 50,
    availability: "all",
    sortBy: "relevance",
  })

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.subcategory.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((cat) => product.category.toLowerCase().includes(cat.toLowerCase()))

    return matchesSearch && matchesCategory
  })

  const productsByCategory =
    selectedCategories.length === 0
      ? categories
          .filter((cat) => cat !== "all")
          .reduce(
            (acc, category) => {
              const categoryProducts = filteredProducts.filter((product) =>
                product.category.toLowerCase().includes(category.toLowerCase()),
              )
              if (categoryProducts.length > 0) {
                acc[category] = categoryProducts
              }
              return acc
            },
            {} as Record<string, typeof products>,
          )
      : selectedCategories.reduce(
          (acc, category) => {
            const categoryProducts = filteredProducts.filter((product) =>
              product.category.toLowerCase().includes(category.toLowerCase()),
            )
            if (categoryProducts.length > 0) {
              acc[category] = categoryProducts
            }
            return acc
          },
          {} as Record<string, typeof products>,
        )

  const toggleProduct = (productId: string) => {
    console.log("[v0] toggleProduct called with productId:", productId)
    console.log("[v0] current selectedProducts:", selectedProducts)

    const newSelected = selectedProducts.includes(productId)
      ? selectedProducts.filter((id) => id !== productId)
      : [...selectedProducts, productId]

    console.log("[v0] newSelected products:", newSelected)
    setSelectedProducts(newSelected)
    console.log("[v0] Zustand setSelectedProducts called successfully")
  }

  const clearAllProducts = () => {
    setSelectedProducts([])
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((cat) => cat !== category) : [...prev, category],
    )
  }

  const selectAllCategories = () => {
    setSelectedCategories(categories.filter((cat) => cat !== "all"))
  }

  const clearAllCategories = () => {
    setSelectedCategories([])
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">What do you sell?</h2>
        <p className="text-muted-foreground lg:text-lg">Select the products you're interested in</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 lg:text-lg lg:py-3"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="text-xs px-3 py-1 bg-primary text-primary-foreground">
                All Categories
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryModal(true)}
                className="h-7 px-3 text-xs hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
              >
                <Filter className="w-3 h-3 mr-1" />
                Categories
              </Button>
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {selectedProducts.length} selected
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearAllProducts} className="text-xs h-7 px-2">
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="text-xs px-2 py-1 capitalize cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setShowCategoryModal(true)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 max-h-96 lg:max-h-[500px] overflow-y-auto">
        {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base lg:text-lg font-semibold text-foreground capitalize">{category}</h3>
              <Badge variant="outline" className="text-xs">
                {categoryProducts.length} items
              </Badge>
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
              {categoryProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative cursor-pointer"
                  onClick={() => toggleProduct(product.id)}
                >
                  <Card
                    className={`p-2 lg:p-3 text-center transition-all duration-300 aspect-square flex flex-col justify-center ${
                      selectedProducts.includes(product.id)
                        ? "bg-emerald-500/20 backdrop-blur-sm border-2 border-emerald-500/50 shadow-lg shadow-emerald-200/50"
                        : "hover:shadow-md hover:border-emerald-200"
                    }`}
                  >
                    <div className="text-lg lg:text-xl mb-1">{product.icon}</div>
                    <h4
                      className={`font-medium text-xs lg:text-sm leading-tight ${
                        selectedProducts.includes(product.id) ? "text-emerald-800 font-semibold" : ""
                      }`}
                    >
                      {product.name}
                    </h4>
                  </Card>
                  {selectedProducts.includes(product.id) && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <span className="text-white text-xs font-bold">✓</span>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(productsByCategory).length === 0 && (
          <Card className="p-6 lg:p-8 text-center">
            <div className="space-y-3 lg:space-y-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold lg:text-lg">No products found</h3>
                <p className="text-sm lg:text-base text-muted-foreground">Try adjusting your search or categories</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Select Categories</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCategoryModal(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllCategories}
                    className="flex-1 text-xs bg-transparent hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllCategories}
                    className="flex-1 text-xs bg-transparent hover:bg-red-50 hover:border-red-300"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((cat) => cat !== "all")
                    .map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategories.includes(category) ? "default" : "outline"}
                        className={`text-xs px-3 py-2 capitalize cursor-pointer transition-all duration-200 hover:scale-105 ${
                          selectedCategories.includes(category)
                            ? "bg-emerald-500/90 backdrop-blur-sm text-white border-emerald-500 shadow-lg shadow-emerald-200/50"
                            : "hover:bg-emerald-50 hover:border-emerald-300"
                        }`}
                        onClick={() => toggleCategory(category)}
                      >
                        {category}
                        {selectedCategories.includes(category) && <span className="ml-1 text-xs">✓</span>}
                      </Badge>
                    ))}
                </div>

                <Button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200/50"
                >
                  Apply Categories ({selectedCategories.length})
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
