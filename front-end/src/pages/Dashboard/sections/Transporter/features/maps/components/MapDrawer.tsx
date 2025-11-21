import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
  Modal,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { X, MapPin, Truck, Clock, Route, Package, Flag, Navigation } from 'lucide-react-native';
import { MapOffer } from '../types';
import { useTransporterMapDrawer } from '../hooks';

interface MapDrawerProps {
  isOpen: boolean;
  offer: MapOffer | null;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.9; // Increased from 0.75 to 0.9

/**
 * Map drawer component with route visualization
 */
export const MapDrawer: React.FC<MapDrawerProps> = ({ isOpen, offer, onClose }) => {
  const { isLoading, error, fleet, routes, loadMapData } = useTransporterMapDrawer();
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;

  const trucksRequired = offer ? Math.ceil(offer.quantity / 40) : 0;

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0; // Only respond to downward swipes
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down more than 100 pixels to close
          closeDrawer();
        } else {
          // Bounce back to open position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isOpen && offer) {
      openDrawer();
      loadMapData(offer);
    } else {
      closeDrawer();
    }
  }, [isOpen, offer, loadMapData]);

  const openDrawer = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(translateY, {
      toValue: DRAWER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const calculateTotalDistance = () => {
    return routes.reduce((sum, route) => sum + route.distance.total, 0);
  };

  const calculateAverageTime = () => {
    if (routes.length === 0) return 0;
    const totalTime = routes.reduce((sum, route) => sum + route.duration.total, 0);
    return Math.round(totalTime / routes.length);
  };

  if (!isOpen || !offer) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeDrawer}
    >
      <View className="flex-1">
        {/* Backdrop */}
        <TouchableOpacity
          testID="drawer-backdrop"
          className="absolute inset-0 bg-black/50"
          activeOpacity={1}
          onPress={closeDrawer}
        />

        {/* Drawer */}
        <Animated.View
          testID="map-drawer"
          {...panResponder.panHandlers}
          onSwipeDown={closeDrawer}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl"
          style={{
            height: DRAWER_HEIGHT,
            transform: [{ translateY }],
            overflow: isOpen ? 'visible' : 'hidden',
          }}
        >
          {/* Handle */}
          <View className="items-center py-3">
            <View className="w-16 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
          </View>

          {/* Header */}
          <View className="px-4 pb-4 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-800">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="bg-blue-500 rounded-full p-2 mr-2">
                  <Route size={20} color="#FFFFFF" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  Route Planning
                </Text>
              </View>
              <TouchableOpacity testID="drawer-close-button" onPress={closeDrawer} className="p-1">
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-4 py-4">
            {isLoading ? (
              <View testID="map-loading" className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 dark:text-gray-400 mt-2">Loading map data...</Text>
              </View>
            ) : error ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-red-500 text-center">Failed to load map data</Text>
                <TouchableOpacity onPress={loadMapData} className="mt-4">
                  <Text className="text-blue-500">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Key Info Banner */}
                {offer && (
                  <View className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 mb-4 shadow-sm">
                    <View className="flex-row items-center justify-center">
                      <Truck size={24} color="#3b82f6" />
                      <Text className="text-center text-lg font-bold text-blue-800 dark:text-blue-200 ml-2">
                        {trucksRequired} {trucksRequired === 1 ? 'Truck' : 'Trucks'} Required
                      </Text>
                    </View>
                    <Text className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      for {offer.quantity} tons of {offer.productType}
                    </Text>
                  </View>
                )}

                {/* Routes Summary */}
                {routes.length > 0 && (
                  <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-md border border-gray-200 dark:border-gray-700">
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-row items-center">
                        <Route size={16} color="#3B82F6" />
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                          Total Distance
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Total: {calculateTotalDistance()} km
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Clock size={16} color="#3B82F6" />
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                          Average Time
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        ~{calculateAverageTime()} min average
                      </Text>
                    </View>
                  </View>
                )}

                {/* Detailed Truck Routes */}
                {routes.map((route, index) => (
                  <View
                    key={route.truckId}
                    className="bg-white dark:bg-gray-800 border-2 rounded-xl p-4 mb-3 shadow-sm"
                    style={{ borderColor: route.color + '40' }}
                  >
                    {/* Truck Header */}
                    <View className="flex-row items-center mb-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: route.color }}
                      >
                        <Truck size={18} color="#FFFFFF" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-bold text-gray-900 dark:text-white">
                          {route.truckLabel}
                        </Text>
                        <Text className="text-sm text-gray-600 dark:text-gray-400">
                          Total: {route.distance.total} km • {route.duration.total} min
                        </Text>
                      </View>
                    </View>

                    {/* Route Segments */}
                    <View className="space-y-2">
                      {/* Segment 1: Current Location → Pickup */}
                      <View className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center flex-1">
                            <View className="w-2 h-2 bg-blue-500 rounded-full" />
                            <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-2 mr-2">
                              Current → Pickup
                            </Text>
                            <Package size={14} color="#10b981" />
                          </View>
                          <View className="flex-row items-center">
                            <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {route.distance.toPickup} km
                            </Text>
                            <Text className="text-xs text-gray-500 ml-2">
                              ({route.duration.toPickup} min)
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Segment 2: Pickup → Delivery */}
                      <View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center flex-1">
                            <View className="w-2 h-2 bg-green-500 rounded-full" />
                            <Text className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-2 mr-2">
                              Pickup → Delivery
                            </Text>
                            <Flag size={14} color="#ef4444" />
                          </View>
                          <View className="flex-row items-center">
                            <Text className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {route.distance.toDelivery} km
                            </Text>
                            <Text className="text-xs text-gray-500 ml-2">
                              ({route.duration.toDelivery} min)
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Google Maps View */}
                <View className="rounded-lg overflow-hidden mt-4" style={{ height: 400 }}>
                  {offer && (
                    <MapView
                      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                      style={{ flex: 1 }}
                      initialRegion={{
                        latitude:
                          (offer.pickup.coordinates.latitude +
                            offer.delivery.coordinates.latitude) /
                          2,
                        longitude:
                          (offer.pickup.coordinates.longitude +
                            offer.delivery.coordinates.longitude) /
                          2,
                        latitudeDelta: 0.15,
                        longitudeDelta: 0.15,
                      }}
                      showsUserLocation={false}
                      showsMyLocationButton={false}
                    >
                      {/* Pickup Marker with Custom Icon */}
                      <Marker
                        coordinate={offer.pickup.coordinates}
                        title="Pickup Location"
                        description={offer.pickup.name || offer.pickup.address.city}
                      >
                        <View className="bg-green-500 rounded-full p-3 shadow-lg border-2 border-white">
                          <Package size={24} color="#FFFFFF" />
                        </View>
                      </Marker>

                      {/* Delivery Marker with Custom Icon */}
                      <Marker
                        coordinate={offer.delivery.coordinates}
                        title="Delivery Location"
                        description={offer.delivery.name || offer.delivery.address.city}
                      >
                        <View className="bg-red-500 rounded-full p-3 shadow-lg border-2 border-white">
                          <Flag size={24} color="#FFFFFF" />
                        </View>
                      </Marker>

                      {/* Truck Markers */}
                      {routes.map((route, index) => {
                        const truck = fleet?.trucks.find((t) => t.id === route.truckId);
                        if (!truck) return null;

                        return (
                          <Marker
                            key={route.truckId}
                            coordinate={truck.currentLocation.coordinates}
                            title={route.truckLabel}
                            description={`${route.distance.total} km • ${route.duration.total} min`}
                          >
                            <View
                              className="bg-white rounded-full p-2.5 shadow-lg border-2"
                              style={{ borderColor: route.color }}
                            >
                              <Truck size={22} color={route.color} />
                            </View>
                          </Marker>
                        );
                      })}

                      {/* Route Polylines */}
                      {routes.map((route) => {
                        const truck = fleet?.trucks.find((t) => t.id === route.truckId);
                        if (!truck) return null;

                        // Simple straight lines for now - would use Google Directions API for real routes
                        const routeCoordinates = [
                          truck.currentLocation.coordinates,
                          offer.pickup.coordinates,
                          offer.delivery.coordinates,
                        ];

                        return (
                          <Polyline
                            key={`route-${route.truckId}`}
                            coordinates={routeCoordinates}
                            strokeColor={route.color}
                            strokeWidth={4}
                            lineDashPattern={[8, 4]}
                          />
                        );
                      })}
                    </MapView>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};
