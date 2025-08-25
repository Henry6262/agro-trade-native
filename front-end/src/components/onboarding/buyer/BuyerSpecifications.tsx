import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native'
import { Animated } from 'react-native'
import { Plus, X, ChevronDown, Package } from 'lucide-react-native'
import { Card } from '../../common/Card'
import { Badge } from '../../common/Badge'
import { Input } from '../../common/Input'
import { Button } from '../../common/Button'
import { products } from '../../../constants/onboarding'
import type { ProductSpecification } from '../../../types/onboarding'

interface BuyerSpecificationsProps {
  selectedProducts: string[]
  specifications: ProductSpecification[]
  onSpecificationsChange: (specifications: ProductSpecification[]) => void
}

interface CustomField {
  id: string
  name: string
  value: string
  type: 'text' | 'number' | 'percentage'
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
      name: '',
      value: '',
      type: 'text',
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
      <View
        key={productId}
        style={{ marginBottom: 16 }}
      >
        <Card
          style={{
            overflow: 'hidden',
            borderWidth: 2,
            backgroundColor: hasRequiredFields ? 'rgba(34, 197, 94, 0.1)' : '#1F2937',
            borderColor: hasRequiredFields ? 'rgba(34, 197, 94, 0.3)' : '#374151',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#374151',
              backgroundColor: hasRequiredFields ? 'rgba(34, 197, 94, 0.15)' : '#374151'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                    marginRight: 12
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{product.icon}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#FFFFFF' }}>{product.name}</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{product.category}</Text>
                </View>
              </View>
              <Badge
                variant={hasRequiredFields ? 'default' : 'secondary'}
                style={{
                  backgroundColor: hasRequiredFields ? 'rgba(34, 197, 94, 0.9)' : '#374151',
                  borderColor: hasRequiredFields ? '#22C55E' : '#9CA3AF'
                }}
              >
                <Text style={{ color: hasRequiredFields ? '#FFFFFF' : '#9CA3AF' }}>
                  {hasRequiredFields ? 'Ready' : 'Setup Required'}
                </Text>
              </Badge>
            </View>
          </View>

          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 }}>
                  Amount Needed <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={spec.quantity?.toString() || ''}
                  onChangeText={(text) => updateSpecification(productId, 'quantity', text)}
                  placeholder="e.g., 100"
                  style={{
                    borderWidth: 2,
                    borderColor: !spec.quantity ? '#EF4444' : '#374151',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 14,
                    backgroundColor: '#1F2937',
                    color: '#FFFFFF'
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 }}>
                  Unit <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>
                </Text>
                <View style={{ borderWidth: 2, borderColor: '#374151', borderRadius: 8, backgroundColor: '#1F2937' }}>
                  <TextInput
                    value={spec.unit?.toString() || ''}
                    onChangeText={(text) => updateSpecification(productId, 'unit', text)}
                    placeholder="kg, tons, etc."
                    style={{ paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#FFFFFF' }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 }}>
                  Max Price per {spec.unit || 'Unit'} <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>
                </Text>
                <TextInput
                  keyboardType="numeric"
                  value={spec.pricePerKilo?.toString() || ''}
                  onChangeText={(text) => updateSpecification(productId, 'pricePerKilo', text)}
                  placeholder="Max price"
                  style={{
                    borderWidth: 2,
                    borderColor: !spec.pricePerKilo ? '#EF4444' : '#374151',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 14,
                    backgroundColor: '#1F2937',
                    color: '#FFFFFF'
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={{ paddingTop: 8 }}>
              <TouchableOpacity
                onPress={() => toggleCard(productId)}
                style={{
                  width: '100%',
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: '#374151',
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: 'rgba(31, 41, 55, 0.5)'
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={16} color="#9CA3AF" />
                  <Text style={{ marginLeft: 8, color: '#9CA3AF', fontWeight: '500' }}>
                    {isExpanded ? 'Hide Custom Requirements' : 'Add Custom Requirements'}
                  </Text>
                  <ChevronDown
                    size={16}
                    color="#9CA3AF"
                    style={{
                      marginLeft: 8,
                      transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {isExpanded && (
              <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: '#374151' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>
                    Custom Requirements
                  </Text>
                  <TouchableOpacity
                    onPress={() => addCustomField(productId)}
                    style={{ backgroundColor: '#22C55E', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Plus size={16} color="white" />
                      <Text style={{ marginLeft: 4, color: 'white', fontWeight: '500' }}>Add Field</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {customFields[productId]?.map((field) => (
                  <View
                    key={field.id}
                    style={{ padding: 16, backgroundColor: '#1F2937', borderRadius: 8, borderWidth: 1, borderColor: '#374151', marginBottom: 12 }}
                  >
                    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                      <TextInput
                        value={field.name}
                        onChangeText={(text) => updateCustomField(productId, field.id, { name: text })}
                        placeholder="Requirement name"
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: '#374151',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: '#111827',
                          color: '#FFFFFF',
                          marginRight: 12
                        }}
                        placeholderTextColor="#9CA3AF"
                      />
                      <TouchableOpacity
                        onPress={() => removeCustomField(productId, field.id)}
                        style={{ borderWidth: 1, borderColor: '#EF4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                        activeOpacity={0.7}
                      >
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flex: 1, borderWidth: 1, borderColor: '#374151', borderRadius: 8, backgroundColor: '#111827', marginRight: 12 }}>
                        <TextInput
                          value={field.type}
                          placeholder="Type"
                          editable={false}
                          style={{ paddingHorizontal: 12, paddingVertical: 8, color: '#9CA3AF' }}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <TextInput
                        keyboardType={field.type === 'text' ? 'default' : 'numeric'}
                        value={field.value}
                        onChangeText={(text) => updateCustomField(productId, field.id, { value: text })}
                        placeholder={field.type === 'percentage' ? '0-100%' : 'Value'}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: '#374151',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          backgroundColor: '#111827',
                          color: '#FFFFFF'
                        }}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                ))}

                {(!customFields[productId] || customFields[productId].length === 0) && (
                  <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                    <Text style={{ color: '#9CA3AF' }}>No custom requirements added yet.</Text>
                    <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Click "Add Field" to specify your needs.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Card>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#22C55E', textAlign: 'center', marginBottom: 12 }}>
              Your Requirements
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 16, maxWidth: 600, textAlign: 'center' }}>
              Specify what you're looking for in each product. Add custom requirements for specific needs.
            </Text>
          </View>

          {safeSpecifications.length > 0 && (
            <View>
              {safeSpecifications.map((spec) => renderProductCard(spec.productId))}
            </View>
          )}

          {safeSpecifications.length === 0 && (
            <Card style={{ padding: 24, alignItems: 'center', backgroundColor: '#1F2937', borderColor: '#374151' }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ 
                  width: 64, 
                  height: 64, 
                  backgroundColor: '#374151', 
                  borderRadius: 32, 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: 16 
                }}>
                  <Package size={24} color="#9CA3AF" />
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', fontSize: 18, color: '#FFFFFF', marginBottom: 8 }}>No Products Selected</Text>
                  <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>Go back to select products first</Text>
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}