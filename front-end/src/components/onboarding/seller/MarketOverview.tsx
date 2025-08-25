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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingBottom: 96 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#22C55E', textAlign: 'center', marginBottom: 12 }}>
              Ready to Sell
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 16, textAlign: 'center' }}>Review your products and connect with buyers</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
              <Users size={16} color="#22C55E" />
              <Text style={{ fontSize: 14, color: '#22C55E', marginLeft: 8 }}>1,847 active buyers</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TrendingUp size={16} color="#3B82F6" />
              <Text style={{ fontSize: 14, color: '#3B82F6', marginLeft: 8 }}>₹2.8Cr traded today</Text>
            </View>
          </View>

          <Card style={{ padding: 24, backgroundColor: '#1F2937', borderColor: '#374151' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShoppingCart size={20} color="#22C55E" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' }}>Your Products</Text>
              </View>
              <Badge style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22C55E' }}>
                <Text style={{ color: '#22C55E' }}>
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
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      backgroundColor: '#111827',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#374151',
                      marginBottom: 16
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, marginRight: 16 }}>{product.icon}</Text>
                      <View>
                        <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>{product.name}</Text>
                        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                          {spec.quantity} {spec.unit} • ₹{spec.pricePerKilo}/kg
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>₹{itemValue.toLocaleString()}</Text>
                      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{itemWeight}kg total</Text>
                    </View>
                  </View>
                )
              })}
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: '#374151', marginTop: 24, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>Total Weight</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{totalWeight.toLocaleString()} kg</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>Total Value</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#22C55E' }}>₹{totalValue.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </Card>

          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <TouchableOpacity
              style={{
                width: '100%',
                paddingVertical: 24,
                paddingHorizontal: 16,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (specifications.length === 0 || !specifications.every((spec) => spec.quantity && spec.pricePerKilo)) 
                  ? '#374151' 
                  : '#22C55E',
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
              <Zap size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Create Sell Request</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>You'll be asked to sign in to complete your listing</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}