import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Truck, MapPin, Package, Users, TrendingUp } from 'lucide-react-native';
import { Card } from '@shared/components/Card';
import { Badge } from '@shared/components/Badge';
import { useOnboardingStore } from '@stores/onboarding.store';

interface TransporterListingProps {
  onComplete?: () => void;
}

export function TransporterListing({ onComplete }: TransporterListingProps) {
  const { transportData } = useOnboardingStore();

  const fleetInfo = transportData?.fleetInfo;
  const totalCapacity = fleetInfo?.capacity?.total || 0;
  const vehicleCount = fleetInfo?.vehicleCount || 0;
  const location = fleetInfo?.baseLocation;

  const handleCreateListing = () => {
    console.log('Creating transporter listing...');
    onComplete?.();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#111827' }}>
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              backgroundColor: 'rgba(5, 150, 105, 0.2)',
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Package size={32} color="#22C55E" />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Ready to Transport
          </Text>
          <Text style={{ color: '#9CA3AF', maxWidth: 600, textAlign: 'center', fontSize: 16 }}>
            Review your profile and get started
          </Text>
        </View>

        <Card
          style={{
            padding: 24,
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            borderColor: '#ea580c',
            marginBottom: 32,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(234, 88, 12, 0.2)',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Truck size={24} color="#ea580c" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                  Fleet Overview
                </Text>
                <Text style={{ color: '#9CA3AF' }}>
                  {vehicleCount} trucks • {totalCapacity} tons capacity
                </Text>
              </View>
            </View>
            <Badge style={{ backgroundColor: 'rgba(234, 88, 12, 0.2)', borderColor: '#ea580c' }}>
              <Text style={{ color: '#ea580c' }}>{vehicleCount} Vehicles</Text>
            </Badge>
          </View>
        </Card>

        <Card
          style={{
            padding: 24,
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderColor: '#2563eb',
            marginBottom: 32,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(37, 99, 235, 0.2)',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <MapPin size={24} color="#2563eb" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                  Service Area
                </Text>
                <Text style={{ color: '#9CA3AF' }}>
                  {location?.city && location?.state && location?.country
                    ? `${location.city}, ${location.state}, ${location.country}`
                    : 'Location not set'}
                </Text>
                {location?.address && (
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                    {location.address}
                  </Text>
                )}
              </View>
            </View>
            <Badge style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', borderColor: '#2563eb' }}>
              <Text style={{ color: '#2563eb' }}>Base Location</Text>
            </Badge>
          </View>
        </Card>

        {fleetInfo?.vehicleTypes && fleetInfo.vehicleTypes.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
              Vehicle Details
            </Text>
            <View>
              {fleetInfo.vehicleTypes.map((vehicle, index) => (
                <Card
                  key={vehicle.id}
                  style={{
                    padding: 16,
                    backgroundColor: '#1F2937',
                    borderColor: '#374151',
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'rgba(234, 88, 12, 0.2)',
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Truck size={20} color="#ea580c" />
                      </View>
                      <View>
                        <Text style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {vehicle.name} Truck {index + 1}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                          {vehicle.capacity} {vehicle.unit?.toLowerCase() || 'tons'} capacity
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
            Market Insights
          </Text>
          <View>
            <Card
              style={{
                padding: 24,
                alignItems: 'center',
                backgroundColor: '#1F2937',
                borderColor: '#374151',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Users size={24} color="#22C55E" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>2,400+</Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Active Shippers</Text>
            </Card>

            <Card
              style={{
                padding: 24,
                alignItems: 'center',
                backgroundColor: '#1F2937',
                borderColor: '#374151',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(37, 99, 235, 0.2)',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Package size={24} color="#2563eb" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>850+</Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Weekly Shipments</Text>
            </Card>

            <Card
              style={{
                padding: 24,
                alignItems: 'center',
                backgroundColor: '#1F2937',
                borderColor: '#374151',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(234, 88, 12, 0.2)',
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <TrendingUp size={24} color="#ea580c" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>₹2,500</Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Avg. Daily Earnings</Text>
            </Card>
          </View>
        </View>

        <View style={{ alignItems: 'center', paddingTop: 32 }}>
          <TouchableOpacity
            onPress={handleCreateListing}
            style={{
              backgroundColor: '#22C55E',
              borderRadius: 8,
              paddingHorizontal: 48,
              paddingVertical: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              Create Transportation Listing
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
            Complete setup to start receiving transport requests
          </Text>
        </View>
    </SafeAreaView>
  );
}
