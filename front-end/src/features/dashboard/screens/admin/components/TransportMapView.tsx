import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { 
  Marker, 
  Polyline,
  PROVIDER_GOOGLE, 
  Region,
  LatLng,
} from 'react-native-maps';
import {
  Truck,
  MapPin,
  Package,
  Navigation,
  Info,
  Clock,
  DollarSign,
  Route,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface PickupLocation extends Location {
  sellerId: string;
  sellerName: string;
  quantity: number;
  product: string;
}

interface TransportRoute {
  origin: Location;
  pickupLocations: PickupLocation[];
  destination: Location;
  polylineCoordinates?: LatLng[];
  totalDistance?: number;
  estimatedDuration?: number;
  estimatedCost?: number;
}

export interface TransportMapViewProps {
  route: TransportRoute;
  height?: number;
  showDetails?: boolean;
  onMarkerPress?: (location: Location | PickupLocation) => void;
}

export const TransportMapView: React.FC<TransportMapViewProps> = ({
  route,
  height = 400,
  showDetails = true,
  onMarkerPress,
}) => {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Calculate region to fit all points
  const calculateRegion = (): Region => {
    const points = [
      route.origin,
      ...route.pickupLocations,
      route.destination,
    ];

    const latitudes = points.map(p => p.latitude);
    const longitudes = points.map(p => p.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    
    const deltaLat = (maxLat - minLat) * 1.3; // Add padding
    const deltaLng = (maxLng - minLng) * 1.3;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(deltaLat, 0.02),
      longitudeDelta: Math.max(deltaLng, 0.02),
    };
  };

  // Generate polyline coordinates (simplified - in production use real routing API)
  const generatePolyline = (): LatLng[] => {
    if (route.polylineCoordinates) {
      return route.polylineCoordinates;
    }

    // Simple direct lines for demonstration
    const coordinates: LatLng[] = [];
    
    // Origin to first pickup
    coordinates.push(route.origin);
    
    // Through all pickups
    route.pickupLocations.forEach(pickup => {
      coordinates.push(pickup);
    });
    
    // To destination
    coordinates.push(route.destination);
    
    return coordinates;
  };

  // Fit map to show all markers
  useEffect(() => {
    if (mapReady && mapRef.current) {
      const coordinates = [
        route.origin,
        ...route.pickupLocations,
        route.destination,
      ];
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [mapReady, route]);

  const handleMarkerPress = (location: Location | PickupLocation, markerId: string) => {
    setSelectedMarker(markerId);
    onMarkerPress?.(location);
  };

  // Custom map style for better visibility
  const mapStyle = [
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
  ];

  return (
    <View style={{ height }}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={calculateRegion()}
          onMapReady={() => setMapReady(true)}
          customMapStyle={mapStyle}
        >
          {/* Route Polyline */}
          <Polyline
            coordinates={generatePolyline()}
            strokeColor="#3B82F6"
            strokeWidth={3}
            lineDashPattern={[1]}
          />

          {/* Origin Marker (Warehouse) */}
          <Marker
            coordinate={route.origin}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => handleMarkerPress(route.origin, 'origin')}
          >
            <View className="items-center">
              <View className={`p-3 rounded-full shadow-lg ${
                selectedMarker === 'origin' ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                <Package size={24} color="white" />
              </View>
              <View className="bg-white px-2 py-1 rounded mt-1">
                <Text className="text-xs font-semibold">Warehouse</Text>
              </View>
            </View>
          </Marker>

          {/* Pickup Markers (Sellers) */}
          {route.pickupLocations.map((pickup, index) => (
            <Marker
              key={`pickup-${pickup.sellerId}`}
              coordinate={pickup}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => handleMarkerPress(pickup, `pickup-${pickup.sellerId}`)}
            >
              <View className="items-center">
                <View className={`p-2 rounded-full shadow-lg ${
                  selectedMarker === `pickup-${pickup.sellerId}` ? 'bg-orange-600' : 'bg-orange-500'
                }`}>
                  <Text className="text-white font-bold">{index + 1}</Text>
                </View>
                <View className="bg-white px-2 py-1 rounded mt-1">
                  <Text className="text-xs font-semibold" numberOfLines={1}>
                    {pickup.sellerName}
                  </Text>
                </View>
              </View>
            </Marker>
          ))}

          {/* Destination Marker (Buyer) */}
          <Marker
            coordinate={route.destination}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => handleMarkerPress(route.destination, 'destination')}
          >
            <View className="items-center">
              <View className={`p-3 rounded-full shadow-lg ${
                selectedMarker === 'destination' ? 'bg-green-600' : 'bg-green-500'
              }`}>
                <MapPin size={24} color="white" />
              </View>
              <View className="bg-white px-2 py-1 rounded mt-1">
                <Text className="text-xs font-semibold">Delivery</Text>
              </View>
            </View>
          </Marker>
        </MapView>

        {/* Map Loading */}
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-2">Loading map...</Text>
          </View>
        )}

        {/* Route Info Overlay */}
        {showDetails && route.totalDistance && (
          <View style={styles.infoOverlay}>
            <View className="bg-white rounded-lg p-3 shadow-lg">
              <View className="flex-row items-center mb-2">
                <Truck size={16} color="#3B82F6" />
                <Text className="text-gray-800 font-semibold ml-2">Transport Route</Text>
              </View>
              
              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <Route size={14} color="#6B7280" />
                  <Text className="text-gray-600 text-sm ml-1">
                    {route.totalDistance} km
                  </Text>
                </View>
                
                <View className="flex-row items-center ml-3">
                  <Clock size={14} color="#6B7280" />
                  <Text className="text-gray-600 text-sm ml-1">
                    {Math.round((route.estimatedDuration || 0) / 60)} hrs
                  </Text>
                </View>
                
                {route.estimatedCost && (
                  <View className="flex-row items-center ml-3">
                    <DollarSign size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-1">
                      ${route.estimatedCost.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Center on Route Button */}
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => {
            if (mapRef.current) {
              const coordinates = [
                route.origin,
                ...route.pickupLocations,
                route.destination,
              ];
              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
          className="bg-white rounded-full p-3 shadow-lg"
        >
          <Navigation size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Pickup Details List */}
      {showDetails && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="bg-gray-50 border-t border-gray-200"
        >
          <View className="flex-row p-3">
            {/* Origin Card */}
            <TouchableOpacity
              onPress={() => handleMarkerPress(route.origin, 'origin')}
              className={`bg-white rounded-lg p-3 mr-2 border-2 ${
                selectedMarker === 'origin' ? 'border-blue-500' : 'border-gray-200'
              }`}
              style={{ width: screenWidth * 0.7 }}
            >
              <View className="flex-row items-center mb-2">
                <Package size={16} color="#4B5563" />
                <Text className="font-semibold text-gray-800 ml-2">Warehouse</Text>
              </View>
              <Text className="text-gray-600 text-sm" numberOfLines={2}>
                {route.origin.address}
              </Text>
              <Text className="text-blue-600 text-xs mt-1">Starting Point</Text>
            </TouchableOpacity>

            {/* Pickup Cards */}
            {route.pickupLocations.map((pickup, index) => (
              <TouchableOpacity
                key={`card-${pickup.sellerId}`}
                onPress={() => handleMarkerPress(pickup, `pickup-${pickup.sellerId}`)}
                className={`bg-white rounded-lg p-3 mr-2 border-2 ${
                  selectedMarker === `pickup-${pickup.sellerId}` ? 'border-orange-500' : 'border-gray-200'
                }`}
                style={{ width: screenWidth * 0.7 }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="bg-orange-500 rounded-full px-2 py-1">
                      <Text className="text-white text-xs font-bold">{index + 1}</Text>
                    </View>
                    <Text className="font-semibold text-gray-800 ml-2">
                      {pickup.sellerName}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-600 text-sm" numberOfLines={2}>
                  {pickup.address}
                </Text>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-gray-500 text-xs">
                    {pickup.product}
                  </Text>
                  <Text className="text-orange-600 text-xs font-semibold">
                    {pickup.quantity} units
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Destination Card */}
            <TouchableOpacity
              onPress={() => handleMarkerPress(route.destination, 'destination')}
              className={`bg-white rounded-lg p-3 border-2 ${
                selectedMarker === 'destination' ? 'border-green-500' : 'border-gray-200'
              }`}
              style={{ width: screenWidth * 0.7 }}
            >
              <View className="flex-row items-center mb-2">
                <MapPin size={16} color="#10B981" />
                <Text className="font-semibold text-gray-800 ml-2">Delivery Point</Text>
              </View>
              <Text className="text-gray-600 text-sm" numberOfLines={2}>
                {route.destination.address}
              </Text>
              <Text className="text-green-600 text-xs mt-1">Final Destination</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});