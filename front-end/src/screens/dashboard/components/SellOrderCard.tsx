import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, Weight } from 'lucide-react-native';

interface SellOrder {
  id: string;
  product: string;
  farmer: string;
  quantity: string;
  unit: string;
  minPrice: string;
  priceUnit: string;
  location: string;
  flag: string;
  harvestDate: string;
  categories: string[];
  quality: 'premium' | 'standard';
}

interface SellOrderCardProps {
  order: SellOrder;
  isSelected: boolean;
  onPress: () => void;
}

export const SellOrderCard: React.FC<SellOrderCardProps> = ({ order, isSelected, onPress }) => {
  const getQualityStyle = () => {
    return order.quality === 'premium'
      ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }
      : { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' };
  };

  const qualityStyle = getQualityStyle();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.2)' : '#1F2937',
        borderColor: isSelected ? 'rgba(34, 197, 94, 0.5)' : '#374151',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>{order.product}</Text>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
          backgroundColor: qualityStyle.backgroundColor,
        }}>
          <Text style={{ color: qualityStyle.color, fontSize: 11 }}>{order.quality}</Text>
        </View>
      </View>

      <Text style={{ color: '#D1D5DB', fontSize: 12, marginBottom: 8 }}>{order.farmer}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {order.categories.map((cat, idx) => (
          <View key={idx} style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 4,
          }}>
            <Text style={{ color: '#22C55E', fontSize: 11 }}>{cat}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <MapPin size={12} color="#9CA3AF" />
        <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>
          {order.flag} {order.location}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Calendar size={12} color="#22C55E" />
        <Text style={{ color: '#22C55E', fontSize: 11, marginLeft: 4 }}>
          Harvest: {order.harvestDate}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Weight size={12} color="#9CA3AF" />
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>
            {order.quantity} {order.unit}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Weight size={12} color="#9CA3AF" />
          <Text style={{ color: '#22C55E', fontSize: 11, fontFamily: 'monospace', marginLeft: 4 }}>
            Min: {order.minPrice}{order.priceUnit}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};