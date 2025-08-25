import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { Calendar, TrendingUp, Users, Package } from 'lucide-react-native'
import { Card } from '../../common/Card'
import { Badge } from '../../common/Badge'
import { products } from '../../../constants/onboarding'
import type { ProductSpecification } from '../../../types/onboarding'

interface BuyerMarketRequestProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
  onComplete?: () => void
}

export function BuyerMarketRequest({
  selectedProducts,
  specifications,
  onSpecificationsChange,
  onComplete,
}: BuyerMarketRequestProps) {
  const [deliveryDeadline, setDeliveryDeadline] = useState('')

  const totalValue = specifications.reduce((sum, spec) => {
    const quantity = Number(spec.quantity) || 0
    const price = Number(spec.pricePerKilo) || 0
    return sum + quantity * price
  }, 0)

  const totalWeight = specifications.reduce((sum, spec) => {
    return sum + (Number(spec.quantity) || 0)
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

  const handleComplete = () => {
    onComplete?.()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#22C55E', textAlign: 'center', marginBottom: 12 }}>
              Purchase Request
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 16, maxWidth: 600, textAlign: 'center' }}>
              Review your buying requirements and set delivery preferences
            </Text>
          </View>

          <Card style={{ padding: 24, backgroundColor: '#1F2937', borderWidth: 2, borderColor: '#3B82F6', marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(59, 130, 246, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Calendar size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>Delivery Deadline</Text>
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>When do you need this delivered?</Text>
              </View>
            </View>
            <TextInput
              value={deliveryDeadline}
              onChangeText={setDeliveryDeadline}
              placeholder="Enter delivery date (YYYY-MM-DD)"
              style={{ maxWidth: 300, borderWidth: 2, borderColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', color: '#FFFFFF' }}
              placeholderTextColor="#9CA3AF"
            />
          </Card>

          <Card style={{ padding: 24, backgroundColor: '#1F2937', borderColor: '#374151', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(34, 197, 94, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Package size={20} color="#22C55E" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>Request Summary</Text>
                <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{specifications.length} products in your request</Text>
              </View>
            </View>

            <View>
              {specifications.map((spec, index) => {
                const product = products.find((p) => p.id === spec.productId)
                if (!product) return null

                const quantity = Number(spec.quantity) || 0
                const price = Number(spec.pricePerKilo) || 0
                const itemTotal = quantity * price

                return (
                  <View
                    key={spec.productId}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(34, 197, 94, 0.3)',
                      marginBottom: 16
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, marginRight: 16 }}>
                        <Text style={{ fontSize: 24 }}>{product.icon}</Text>
                      </View>
                      <View>
                        <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>{product.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                            {spec.quantity} {spec.unit}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#9CA3AF', marginHorizontal: 8 }}>•</Text>
                          <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                            Max ₹{spec.pricePerKilo}/{spec.unit}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#FFFFFF' }}>₹{itemTotal.toFixed(2)}</Text>
                      <Badge variant="secondary" style={{ backgroundColor: '#374151', borderColor: '#9CA3AF' }}>
                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Budget</Text>
                      </Badge>
                    </View>
                  </View>
                )
              })}
            </View>

            <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#374151' }}>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#374151', borderRadius: 8, marginRight: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>{totalWeight}</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Total Weight (kg)</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', padding: 16, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 8, marginLeft: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#22C55E' }}>₹{totalValue.toFixed(2)}</Text>
                  <Text style={{ fontSize: 14, color: '#22C55E' }}>Total Budget</Text>
                </View>
              </View>
            </View>
          </Card>

          <View style={{ marginBottom: 32 }}>
            <Card style={{ padding: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Users size={32} color="#3B82F6" style={{ marginRight: 12 }} />
                <View>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3B82F6' }}>{insights.activeSellers}</Text>
                  <Text style={{ fontSize: 14, color: '#3B82F6' }}>Active Sellers</Text>
                  <Text style={{ fontSize: 12, color: '#3B82F6', marginTop: 4 }}>Ready to fulfill requests</Text>
                </View>
              </View>
            </Card>

            <Card style={{ padding: 16, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22C55E', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Package size={32} color="#22C55E" style={{ marginRight: 12 }} />
                <View>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#22C55E' }}>{insights.availableStock.toLocaleString()}</Text>
                  <Text style={{ fontSize: 14, color: '#22C55E' }}>kg Available</Text>
                  <Text style={{ fontSize: 12, color: '#22C55E', marginTop: 4 }}>In selected products</Text>
                </View>
              </View>
            </Card>

            <Card style={{ padding: 16, backgroundColor: 'rgba(217, 119, 6, 0.1)', borderColor: '#D97706' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TrendingUp size={32} color="#D97706" style={{ marginRight: 12 }} />
                <View>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#D97706' }}>{insights.matchRate}%</Text>
                  <Text style={{ fontSize: 14, color: '#D97706' }}>Success Rate</Text>
                  <Text style={{ fontSize: 12, color: '#D97706', marginTop: 4 }}>Request fulfillment</Text>
                </View>
              </View>
            </Card>
          </View>

          <View style={{ alignItems: 'center', paddingTop: 32 }}>
            <TouchableOpacity
              onPress={handleComplete}
              style={{
                backgroundColor: '#22C55E',
                borderRadius: 8,
                paddingHorizontal: 48,
                paddingVertical: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 6
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Create Purchase Request</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
              Submit your buying requirements to connect with sellers
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}