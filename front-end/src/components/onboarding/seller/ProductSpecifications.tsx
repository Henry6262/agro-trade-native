import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native'
import { Package, ChevronDown, ChevronUp, Plus } from 'lucide-react-native'
import { products } from '../../../constants/onboarding'
import type { ProductSpecification } from '../../../types/onboarding'
import { Card } from '../../common/Card'
import { Badge } from '../../common/Badge'
import { Picker } from '@react-native-picker/picker'

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
        key: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        placeholder: 'e.g., 100',
        priority: 'high',
      },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        options: ['kg', 'quintal', 'ton', 'pieces', 'boxes'],
        priority: 'high',
      },
      {
        key: 'pricePerKilo',
        label: 'Price per Kilo',
        type: 'number',
        placeholder: 'e.g., 25',
        priority: 'high',
      },
    ]

    const categoryFields: Record<string, any[]> = {
      'Grains & Cereals': [
        { key: 'moistureContent', label: 'Moisture %', type: 'number', placeholder: 'e.g., 12', priority: 'low' },
        { key: 'harvestDate', label: 'Harvest Date', type: 'date', priority: 'low' },
        {
          key: 'storageLocation',
          label: 'Storage Location',
          type: 'text',
          placeholder: 'e.g., Warehouse A',
          priority: 'low',
        },
        {
          key: 'qualityGrade',
          label: 'Quality Grade',
          type: 'select',
          options: ['Premium', 'Grade A', 'Grade B', 'Standard', 'Organic Certified'],
          priority: 'low',
        },
      ],
      Fruits: [
        {
          key: 'qualityGrade',
          label: 'Quality Grade',
          type: 'select',
          options: ['Premium', 'Grade A', 'Grade B', 'Standard', 'Organic Certified'],
          priority: 'low',
        },
        {
          key: 'ripeness',
          label: 'Ripeness',
          type: 'select',
          options: ['Green', 'Semi-ripe', 'Ripe', 'Overripe'],
          priority: 'low',
        },
        {
          key: 'size',
          label: 'Size',
          type: 'select',
          options: ['Small', 'Medium', 'Large', 'Extra Large'],
          priority: 'low',
        },
        {
          key: 'packingType',
          label: 'Packing',
          type: 'select',
          options: ['Loose', 'Crates', 'Boxes', 'Bags'],
          priority: 'low',
        },
      ],
      Vegetables: [
        {
          key: 'qualityGrade',
          label: 'Quality Grade',
          type: 'select',
          options: ['Premium', 'Grade A', 'Grade B', 'Standard', 'Organic Certified'],
          priority: 'low',
        },
        {
          key: 'freshness',
          label: 'Freshness',
          type: 'select',
          options: ['Fresh', 'Day Old', '2-3 Days'],
          priority: 'low',
        },
        {
          key: 'size',
          label: 'Size',
          type: 'select',
          options: ['Small', 'Medium', 'Large'],
          priority: 'low',
        },
        {
          key: 'packingType',
          label: 'Packing',
          type: 'select',
          options: ['Loose', 'Bundles', 'Crates', 'Bags'],
          priority: 'low',
        },
      ],
      'Spices & Herbs': [
        {
          key: 'qualityGrade',
          label: 'Quality Grade',
          type: 'select',
          options: ['Premium', 'Grade A', 'Grade B', 'Standard', 'Organic Certified'],
          priority: 'low',
        },
        {
          key: 'dryness',
          label: 'Dryness',
          type: 'select',
          options: ['Well Dried', 'Semi Dried', 'Fresh'],
          priority: 'low',
        },
        {
          key: 'purity',
          label: 'Purity %',
          type: 'number',
          placeholder: 'e.g., 99',
          priority: 'low',
        },
        {
          key: 'packingType',
          label: 'Packing',
          type: 'select',
          options: ['Loose', 'Sealed Bags', 'Containers'],
          priority: 'low',
        },
      ],
    }

    const additionalFields = categoryFields[product.category] || []
    return [...baseFields, ...additionalFields]
  }

  const renderSelectField = (field: any, spec: ProductSpecification, productId: string, isCompact = false) => {
    const isUnitField = field.key === 'unit'
    return (
      <View style={{
        borderWidth: isCompact ? 2 : 1,
        borderColor: '#374151',
        borderRadius: 8,
        backgroundColor: '#1F2937',
        overflow: 'hidden'
      }}>
        <Picker
          selectedValue={spec[field.key] || ''}
          onValueChange={(itemValue) => updateSpecification(productId, field.key, itemValue)}
          style={{ 
            height: isUnitField && isCompact ? 32 : (isCompact ? 40 : 50),
            color: '#FFFFFF',
            fontSize: isUnitField && isCompact ? 12 : undefined,
          }}
        >
          <Picker.Item 
            label={isUnitField ? 'Unit' : `Select ${field.label}`} 
            value="" 
            color="#9CA3AF" 
          />
          {field.options?.map((option: string) => (
            <Picker.Item key={option} label={option} value={option} color="#FFFFFF" />
          ))}
        </Picker>
      </View>
    )
  }

  const renderSpecificationForm = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    const spec = specifications.find((s) => s.productId === productId)
    if (!product || !spec) return null

    const fields = getSpecificationFields(productId)
    const isExpanded = expandedCards.has(productId)

    const highPriorityFields = fields.filter((f) => f.priority === 'high')
    const otherFields = fields.filter((f) => f.priority !== 'high')

    const hasRequiredFields = spec.quantity && spec.unit

    return (
      <View key={productId} style={{ marginBottom: 16 }}>
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
                    backgroundColor: hasRequiredFields ? 'rgba(255, 255, 255, 0.9)' : '#FFFFFF',
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
              {highPriorityFields.map((field, index) => (
                <View key={field.key} style={{ 
                  flex: field.key === 'unit' ? 0.6 : 1, 
                  flexBasis: field.key === 'unit' ? 80 : 'auto',
                  marginRight: index < highPriorityFields.length - 1 ? 12 : 0 
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 }}>
                    {field.label}
                    {field.required && <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>}
                  </Text>
                  {field.type === 'select' ? (
                    renderSelectField(field, spec, productId, true)
                  ) : (
                    <TextInput
                      value={spec[field.key]?.toString() || ''}
                      onChangeText={(text) => updateSpecification(productId, field.key, text)}
                      placeholder={field.placeholder}
                      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                      style={{
                        borderWidth: 2,
                        borderColor: field.required && !spec[field.key] ? '#EF4444' : '#374151',
                        borderRadius: 8,
                        paddingHorizontal: field.key === 'unit' ? 6 : 8,
                        paddingVertical: field.key === 'unit' ? 6 : 8,
                        fontSize: field.key === 'unit' ? 12 : 14,
                        backgroundColor: '#1F2937',
                        color: '#FFFFFF',
                        textAlign: field.key === 'unit' ? 'center' : 'left'
                      }}
                      placeholderTextColor="#9CA3AF"
                    />
                  )}
                </View>
              ))}
            </View>

            {otherFields.length > 0 && (
              <View style={{ paddingTop: 8 }}>
                <TouchableOpacity
                  style={{
                    width: '100%',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#374151',
                    borderRadius: 8,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(31, 41, 55, 0.5)'
                  }}
                  onPress={() => toggleCardExpansion(productId)}
                >
                  <Plus size={16} color="#9CA3AF" style={{ 
                    transform: [{ rotate: isExpanded ? '45deg' : '0deg' }] 
                  }} />
                  <Text style={{ color: '#9CA3AF', marginLeft: 8 }}>
                    {isExpanded ? 'Hide Additional Details' : 'Add More Details'}
                  </Text>
                  {isExpanded ? (
                    <ChevronUp size={16} color="#9CA3AF" style={{ marginLeft: 8 }} />
                  ) : (
                    <ChevronDown size={16} color="#9CA3AF" style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {isExpanded && otherFields.length > 0 && (
              <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: '#374151' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 8, height: 8, backgroundColor: '#22C55E', borderRadius: 4, marginRight: 8 }}></View>
                  <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>Additional Specifications</Text>
                </View>
                <View>
                  {otherFields.map((field) => (
                    <View key={field.key} style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 }}>{field.label}</Text>
                      {field.type === 'select' ? (
                        renderSelectField(field, spec, productId)
                      ) : (
                        <TextInput
                          value={spec[field.key]?.toString() || ''}
                          onChangeText={(text) => updateSpecification(productId, field.key, text)}
                          placeholder={field.placeholder}
                          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                          style={{
                            borderWidth: 1,
                            borderColor: '#374151',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            backgroundColor: '#1F2937',
                            color: '#FFFFFF'
                          }}
                          placeholderTextColor="#9CA3AF"
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Card>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingBottom: 96 }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#22C55E', textAlign: 'center', marginBottom: 12 }}>
              Product Details
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 16, maxWidth: 600, textAlign: 'center' }}>
              Set your quantity and unit to get started. Add more details to attract better buyers.
            </Text>
          </View>

          {specifications.length > 0 && (
            <View>
              {specifications.map((spec) => renderSpecificationForm(spec.productId))}
            </View>
          )}

          {specifications.length === 0 && (
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