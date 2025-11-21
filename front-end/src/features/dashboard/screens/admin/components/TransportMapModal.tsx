import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import {
  X,
  Truck,
  MapPin,
  Package,
  DollarSign,
  Clock,
  Route,
  CheckCircle,
} from 'lucide-react-native';
import { TransportMapView } from './TransportMapView';
import type { TradeOperation, TransportEstimate } from '@services/tradeOperationService';

const { height: screenHeight } = Dimensions.get('window');

interface TransportMapModalProps {
  visible: boolean;
  onClose: () => void;
  tradeOperation: TradeOperation | null;
  transportEstimate: TransportEstimate | null;
  onConfirmRoute?: () => void;
}

export const TransportMapModal: React.FC<TransportMapModalProps> = ({
  visible,
  onClose,
  tradeOperation,
  transportEstimate,
  onConfirmRoute,
}) => {
  if (!tradeOperation || !transportEstimate) {
    return null;
  }

  // Prepare route data for map
  const prepareRouteData = () => {
    // Mock coordinates - in production these would come from real addresses
    const warehouseCoords = {
      latitude: 42.0,
      longitude: -93.0,
      address: 'Central Warehouse, Iowa',
    };

    const buyerCoords = {
      latitude: tradeOperation.buyListing.deliveryAddress?.latitude || 41.8781,
      longitude: tradeOperation.buyListing.deliveryAddress?.longitude || -87.6298,
      address: tradeOperation.buyListing.deliveryAddress?.address || 'Chicago, IL',
    };

    const pickupLocations =
      tradeOperation.selectedSellers?.map((seller, index) => ({
        sellerId: seller.sellerId,
        sellerName: seller.saleListing.seller.name,
        latitude: 42.0 + index * 0.15, // Mock coordinates
        longitude: -93.0 + index * 0.15,
        address: seller.saleListing.address?.address || `Farm ${index + 1}`,
        quantity: seller.requestedQuantity,
        product: seller.saleListing.product.name,
      })) || [];

    return {
      origin: warehouseCoords,
      pickupLocations,
      destination: buyerCoords,
      totalDistance: transportEstimate.distance,
      estimatedDuration: transportEstimate.duration,
      estimatedCost: transportEstimate.costs.totalCost,
    };
  };

  const route = prepareRouteData();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Truck size={24} color="#3B82F6" />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-gray-800">Transport Route Planning</Text>
                <Text className="text-sm text-gray-600">{tradeOperation.operationNumber}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-gray-100">
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map View */}
        <View style={{ height: screenHeight * 0.5 }}>
          <TransportMapView route={route} height={screenHeight * 0.5} showDetails={true} />
        </View>

        {/* Transport Details */}
        <ScrollView className="flex-1 bg-gray-50">
          <View className="p-4">
            {/* Summary Card */}
            <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Route Summary</Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Route size={18} color="#6B7280" />
                    <Text className="text-gray-600 ml-2">Total Distance</Text>
                  </View>
                  <Text className="font-semibold text-gray-800">
                    {transportEstimate.distance} km
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Clock size={18} color="#6B7280" />
                    <Text className="text-gray-600 ml-2">Estimated Time</Text>
                  </View>
                  <Text className="font-semibold text-gray-800">
                    {Math.round(transportEstimate.duration / 60)} hours
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Package size={18} color="#6B7280" />
                    <Text className="text-gray-600 ml-2">Pickup Stops</Text>
                  </View>
                  <Text className="font-semibold text-gray-800">
                    {route.pickupLocations.length} locations
                  </Text>
                </View>

                <View className="h-px bg-gray-200 my-2" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <DollarSign size={18} color="#10B981" />
                    <Text className="text-gray-800 font-semibold ml-2">Transport Cost</Text>
                  </View>
                  <Text className="font-bold text-green-600 text-lg">
                    ${transportEstimate.costs.totalCost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Cost Breakdown</Text>

              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Base Rate</Text>
                  <Text className="text-gray-800">
                    ${transportEstimate.breakdown.baseRate.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Distance Charge</Text>
                  <Text className="text-gray-800">
                    ${transportEstimate.breakdown.distanceCharge.toFixed(2)}
                  </Text>
                </View>

                {transportEstimate.breakdown.multiPickupSurcharge > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Multi-Pickup Surcharge</Text>
                    <Text className="text-gray-800">
                      ${transportEstimate.breakdown.multiPickupSurcharge.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Cost per km</Text>
                  <Text className="text-gray-500 text-sm">
                    ${transportEstimate.breakdown.costPerKm.toFixed(2)}/km
                  </Text>
                </View>
              </View>
            </View>

            {/* Vehicle Info */}
            <View className="bg-blue-50 rounded-lg p-4 mb-4">
              <View className="flex-row items-center">
                <Truck size={20} color="#2563EB" />
                <Text className="text-blue-800 font-semibold ml-2">
                  Vehicle Type: {transportEstimate.vehicleType}
                </Text>
              </View>
              <Text className="text-blue-600 text-sm mt-1">
                Capacity: {tradeOperation.buyListing.quantity} {tradeOperation.buyListing.unit}
              </Text>
            </View>

            {/* Pickup Schedule */}
            <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">Pickup Schedule</Text>

              {route.pickupLocations.map((pickup, index) => (
                <View
                  key={pickup.sellerId}
                  className="flex-row items-start pb-3 mb-3 border-b border-gray-100 last:border-0"
                >
                  <View className="bg-orange-500 rounded-full px-2 py-1 mt-1">
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-gray-800">{pickup.sellerName}</Text>
                    <Text className="text-gray-600 text-sm mt-1">{pickup.address}</Text>
                    <View className="flex-row items-center mt-2">
                      <Package size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">
                        {pickup.product} - {pickup.quantity} units
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Delivery */}
              <View className="flex-row items-start pt-3 border-t border-gray-200">
                <View className="bg-green-500 rounded-full p-1.5">
                  <MapPin size={14} color="white" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-gray-800">Final Delivery</Text>
                  <Text className="text-gray-600 text-sm mt-1">{route.destination.address}</Text>
                  <Text className="text-green-600 text-sm mt-1">
                    Buyer: {tradeOperation.buyListing.buyer.name}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {onConfirmRoute && (
              <TouchableOpacity
                onPress={onConfirmRoute}
                className="bg-green-600 rounded-lg p-4 flex-row items-center justify-center"
              >
                <CheckCircle size={20} color="white" />
                <Text className="text-white font-bold ml-2">Confirm Transport Route</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default TransportMapModal;
