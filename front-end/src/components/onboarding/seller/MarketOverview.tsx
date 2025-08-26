import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { TrendingUp, Users, Zap, ShoppingCart } from 'lucide-react-native'
import { products } from '../../../constants/onboarding'
import type { ProductSpecification } from '../../../types/onboarding'
import { Card } from '../../common/Card'
import { Badge } from '../../common/Badge'

interface MarketOverviewProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onComplete?: () => void
}

export function MarketOverview({ selectedProducts, specifications, onComplete }: MarketOverviewProps) {
  const handleCreateSellRequest = () => {
    // Handle sell request creation
    console.log('Creating sell request with:', { selectedProducts, specifications })
    onComplete?.()
  }

  const totalWeight = specifications.reduce((sum, spec) => {
    const quantity = Number.parseInt(spec.quantity) || 0
    const multiplier = spec.unit === 'ton' ? 1000 : spec.unit === 'quintal' ? 100 : 1
    return sum + quantity * multiplier
  }, 0)

  const totalValue = specifications.reduce((sum, spec) => {
    const quantity = Number.parseInt(spec.quantity) || 0
    const pricePerKilo = Number.parseFloat(spec.pricePerKilo) || 0
    const multiplier = spec.unit === 'ton' ? 1000 : spec.unit === 'quintal' ? 100 : 1
    return sum + quantity * multiplier * pricePerKilo
  }, 0)

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        <View className="pb-24">
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold text-primary-500 text-center mb-3">
              Ready to Sell
            </Text>
            <Text className="text-gray-400 text-base text-center">Review your products and connect with buyers</Text>
          </View>

          <View className="flex-row justify-center items-center mb-6">
            <View className="flex-row items-center mr-6">
              <Users size={16} color="#22C55E" />
              <Text className="text-sm text-primary-500 ml-2">1,847 active buyers</Text>
            </View>
            <View className="flex-row items-center">
              <TrendingUp size={16} color="#3B82F6" />
              <Text className="text-sm text-blue-500 ml-2">₹2.8Cr traded today</Text>
            </View>
          </View>

          <Card className="p-6 bg-gray-800 border-gray-600">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <ShoppingCart size={20} color="#22C55E" className="mr-2" />
                <Text className="text-xl font-bold text-white">Your Products</Text>
              </View>
              <Badge className="bg-primary-500/20 border-primary-500">
                <Text className="text-primary-500">
                  {specifications.length} item{specifications.length !== 1 ? 's' : ''}
                </Text>
              </Badge>
            </View>

            <View>
              {specifications.map((spec) => {
                const product = products.find((p) => p.id === spec.productId)
                if (!product) return null

                const itemWeight = (() => {
                  const quantity = Number.parseInt(spec.quantity) || 0
                  const multiplier = spec.unit === 'ton' ? 1000 : spec.unit === 'quintal' ? 100 : 1
                  return quantity * multiplier
                })()

                const itemValue = (() => {
                  const pricePerKilo = Number.parseFloat(spec.pricePerKilo) || 0
                  return itemWeight * pricePerKilo
                })()

                return (
                  <View
                    key={spec.productId}
                    className="flex-row items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-600 mb-4"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-4">{product.icon}</Text>
                      <View>
                        <Text className="font-semibold text-white">{product.name}</Text>
                        <Text className="text-sm text-gray-400">
                          {spec.quantity} {spec.unit} • ₹{spec.pricePerKilo}/kg
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-semibold text-white">₹{itemValue.toLocaleString()}</Text>
                      <Text className="text-xs text-gray-400">{itemWeight}kg total</Text>
                    </View>
                  </View>
                )
              })}
            </View>

            <View className="border-t border-gray-600 mt-6 pt-4">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="font-semibold text-white">Total Weight</Text>
                  <Text className="text-sm text-gray-400">{totalWeight.toLocaleString()} kg</Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-white">Total Value</Text>
                  <Text className="text-lg font-bold text-primary-500">₹{totalValue.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </Card>

          <View className="items-center mt-8">
            <TouchableOpacity
              className={`
                w-full py-6 px-4 rounded-lg flex-row items-center justify-center
                ${
                  specifications.length === 0 || !specifications.every((spec) => spec.quantity && spec.pricePerKilo)
                    ? 'bg-gray-600'
                    : 'bg-primary-500'
                }
              `}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 6
              }}
              onPress={handleCreateSellRequest}
              disabled={specifications.length === 0 || !specifications.every((spec) => spec.quantity && spec.pricePerKilo)}
              activeOpacity={0.8}
            >
              <Zap size={20} color="white" className="mr-2" />
              <Text className="text-white text-lg font-semibold">Create Sell Request</Text>
            </TouchableOpacity>

            <Text className="text-xs text-gray-400 text-center mt-3">You'll be asked to sign in to complete your listing</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}