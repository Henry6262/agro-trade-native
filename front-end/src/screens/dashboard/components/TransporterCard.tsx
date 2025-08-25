import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Truck, Weight, Star } from 'lucide-react-native';

interface Transporter {
  id: string;
  company: string;
  capacity: string;
  unit: string;
  rate: string;
  rateUnit: string;
  truckCount: number;
  specialization: string[];
  location: string;
  flag: string;
  rating: number;
  availability: 'available' | 'busy';
}

interface TransporterCardProps {
  transporter: Transporter;
  onPress: () => void;
}

export const TransporterCard: React.FC<TransporterCardProps> = ({ transporter, onPress }) => {
  const getAvailabilityStyle = () => {
    return transporter.availability === 'available'
      ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }
      : { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' };
  };

  const availabilityStyle = getAvailabilityStyle();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: '#1F2937',
        borderColor: '#374151',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>{transporter.company}</Text>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
          backgroundColor: availabilityStyle.backgroundColor,
        }}>
          <Text style={{ color: availabilityStyle.color, fontSize: 11 }}>{transporter.availability}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {transporter.specialization.map((spec, idx) => (
          <View key={idx} style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderRadius: 4,
          }}>
            <Text style={{ color: '#FCD34D', fontSize: 11 }}>{spec}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <MapPin size={12} color="#9CA3AF" />
        <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>
          {transporter.flag} {transporter.location}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Truck size={12} color="#9CA3AF" />
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>
            {transporter.truckCount} trucks
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Weight size={12} color="#9CA3AF" />
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>
            {transporter.capacity} {transporter.unit}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#FCD34D', fontSize: 11, fontFamily: 'monospace' }}>
          {transporter.rate}{transporter.rateUnit}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              color={i < Math.floor(transporter.rating) ? '#FCD34D' : '#4B5563'}
              fill={i < Math.floor(transporter.rating) ? '#FCD34D' : 'transparent'}
            />
          ))}
          <Text style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>{transporter.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};