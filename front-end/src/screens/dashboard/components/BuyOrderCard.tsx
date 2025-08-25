import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Weight } from 'lucide-react-native';
import { Badge } from '../../../components/common/Badge';

interface BuyOrder {
  id: string;
  product: string;
  buyer: string;
  quantity: string;
  unit: string;
  maxPrice: string;
  priceUnit: string;
  location: string;
  flag: string;
  deadline: string;
  requirements: string[];
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface BuyOrderCardProps {
  order: BuyOrder;
  isSelected: boolean;
  onPress: () => void;
}

export const BuyOrderCard: React.FC<BuyOrderCardProps> = ({ order, isSelected, onPress }) => {
  const getUrgencyStyle = () => {
    switch (order.urgency) {
      case 'critical':
        return { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' };
      case 'high':
        return { backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#F97316' };
      default:
        return { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FCD34D' };
    }
  };

  const urgencyStyle = getUrgencyStyle();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#1F2937',
        borderColor: isSelected ? 'rgba(59, 130, 246, 0.5)' : '#374151',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>{order.product}</Text>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
          backgroundColor: urgencyStyle.backgroundColor,
        }}>
          <Text style={{ color: urgencyStyle.color, fontSize: 11 }}>{order.urgency}</Text>
        </View>
      </View>

      <Text style={{ color: '#D1D5DB', fontSize: 12, marginBottom: 8 }}>{order.buyer}</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {order.requirements.map((req, idx) => (
          <View key={idx} style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 4,
          }}>
            <Text style={{ color: '#3B82F6', fontSize: 11 }}>{req}</Text>
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
        <Clock size={12} color="#F97316" />
        <Text style={{ color: '#F97316', fontSize: 11, marginLeft: 4 }}>
          Due: {order.deadline}
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
            Max: {order.maxPrice}{order.priceUnit}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};