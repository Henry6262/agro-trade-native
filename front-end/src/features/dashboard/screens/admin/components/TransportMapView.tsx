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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import { Truck, MapPin, Package, Navigation, Clock, DollarSign, Route } from 'lucide-react-native';
import { COLORS } from '../../../../../design-system';

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
    const points = [route.origin, ...route.pickupLocations, route.destination];

    const latitudes = points.map((p) => p.latitude);
    const longitudes = points.map((p) => p.longitude);

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
    route.pickupLocations.forEach((pickup) => {
      coordinates.push(pickup);
    });

    // To destination
    coordinates.push(route.destination);

    return coordinates;
  };

  // Fit map to show all markers
  useEffect(() => {
    if (mapReady && mapRef.current) {
      const coordinates = [route.origin, ...route.pickupLocations, route.destination];

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
            <View style={styles.markerWrapper}>
              <View
                style={[
                  styles.markerCircle,
                  selectedMarker === 'origin' ? styles.markerOriginActive : styles.markerOrigin,
                ]}
              >
                <Package size={24} color="white" />
              </View>
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText}>Warehouse</Text>
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
              <View style={styles.markerWrapper}>
                <View
                  style={[
                    styles.markerCircleSmall,
                    selectedMarker === `pickup-${pickup.sellerId}`
                      ? styles.markerPickupActive
                      : styles.markerPickup,
                  ]}
                >
                  <Text style={styles.markerPickupText}>{index + 1}</Text>
                </View>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText} numberOfLines={1}>
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
            <View style={styles.markerWrapper}>
              <View
                style={[
                  styles.markerCircle,
                  selectedMarker === 'destination' ? styles.markerDestActive : styles.markerDest,
                ]}
              >
                <MapPin size={24} color="white" />
              </View>
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText}>Delivery</Text>
              </View>
            </View>
          </Marker>
        </MapView>

        {/* Map Loading */}
        {!mapReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.accentGreen} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}

        {/* Route Info Overlay */}
        {showDetails && route.totalDistance && (
          <View style={styles.infoOverlay}>
            <View style={styles.infoCard}>
              <View style={styles.infoTitleRow}>
                <Truck size={16} color={COLORS.info} />
                <Text style={styles.infoTitle}>Transport Route</Text>
              </View>

              <View style={styles.infoMetricsRow}>
                <View style={styles.infoMetric}>
                  <Route size={14} color={COLORS.textMuted} />
                  <Text style={styles.infoMetricText}>{route.totalDistance} km</Text>
                </View>

                <View style={styles.infoMetric}>
                  <Clock size={14} color={COLORS.textMuted} />
                  <Text style={styles.infoMetricText}>
                    {Math.round((route.estimatedDuration || 0) / 60)} hrs
                  </Text>
                </View>

                {route.estimatedCost && (
                  <View style={styles.infoMetric}>
                    <DollarSign size={14} color={COLORS.textMuted} />
                    <Text style={styles.infoMetricText}>${route.estimatedCost.toFixed(2)}</Text>
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
              const coordinates = [route.origin, ...route.pickupLocations, route.destination];
              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }
          }}
        >
          <Navigation size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Pickup Details List */}
      {showDetails && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardStrip}>
          <View style={styles.cardStripInner}>
            {/* Origin Card */}
            <TouchableOpacity
              onPress={() => handleMarkerPress(route.origin, 'origin')}
              style={[
                styles.locationCard,
                selectedMarker === 'origin'
                  ? styles.locationCardOriginActive
                  : styles.locationCardDefault,
                { width: screenWidth * 0.7 },
              ]}
            >
              <View style={styles.locationCardHeader}>
                <Package size={16} color={COLORS.textMuted} />
                <Text style={styles.locationCardTitle}>Warehouse</Text>
              </View>
              <Text style={styles.locationCardAddress} numberOfLines={2}>
                {route.origin.address}
              </Text>
              <Text style={styles.locationCardTag}>Starting Point</Text>
            </TouchableOpacity>

            {/* Pickup Cards */}
            {route.pickupLocations.map((pickup, index) => (
              <TouchableOpacity
                key={`card-${pickup.sellerId}`}
                onPress={() => handleMarkerPress(pickup, `pickup-${pickup.sellerId}`)}
                style={[
                  styles.locationCard,
                  selectedMarker === `pickup-${pickup.sellerId}`
                    ? styles.locationCardPickupActive
                    : styles.locationCardDefault,
                  { width: screenWidth * 0.7 },
                ]}
              >
                <View style={styles.locationCardHeaderRow}>
                  <View style={styles.locationCardHeaderLeft}>
                    <View style={styles.pickupIndexBadge}>
                      <Text style={styles.pickupIndexText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.locationCardTitle}>{pickup.sellerName}</Text>
                  </View>
                </View>
                <Text style={styles.locationCardAddress} numberOfLines={2}>
                  {pickup.address}
                </Text>
                <View style={styles.locationCardFooter}>
                  <Text style={styles.locationCardProductText}>{pickup.product}</Text>
                  <Text style={styles.locationCardQuantityText}>{pickup.quantity} units</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Destination Card */}
            <TouchableOpacity
              onPress={() => handleMarkerPress(route.destination, 'destination')}
              style={[
                styles.locationCard,
                selectedMarker === 'destination'
                  ? styles.locationCardDestActive
                  : styles.locationCardDefault,
                { width: screenWidth * 0.7 },
              ]}
            >
              <View style={styles.locationCardHeader}>
                <MapPin size={16} color={COLORS.accentGreen} />
                <Text style={styles.locationCardTitle}>Delivery Point</Text>
              </View>
              <Text style={styles.locationCardAddress} numberOfLines={2}>
                {route.destination.address}
              </Text>
              <Text style={styles.locationCardTagGreen}>Final Destination</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardStrip: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
  },
  cardStripInner: {
    flexDirection: 'row',
    padding: 12,
  },
  centerButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 24,
    borderWidth: 1,
    bottom: 20,
    elevation: 3,
    padding: 12,
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(2,18,7,0.90)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  infoMetric: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  infoMetricText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  infoMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoOverlay: {
    left: 10,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(2,18,7,0.85)',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  locationCard: {
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 10,
    padding: 12,
  },
  locationCardAddress: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  locationCardDefault: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  locationCardDestActive: {
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderColor: COLORS.accentGreen,
  },
  locationCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  locationCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  locationCardHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  locationCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  locationCardOriginActive: {
    backgroundColor: 'rgba(96,165,250,0.10)',
    borderColor: COLORS.info,
  },
  locationCardPickupActive: {
    backgroundColor: 'rgba(251,146,60,0.10)',
    borderColor: '#FB923C',
  },
  locationCardProductText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  locationCardQuantityText: {
    color: '#FB923C',
    fontSize: 11,
    fontWeight: '600',
  },
  locationCardTag: {
    color: COLORS.info,
    fontSize: 11,
    marginTop: 4,
  },
  locationCardTagGreen: {
    color: COLORS.accentGreen,
    fontSize: 11,
    marginTop: 4,
  },
  locationCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  markerCircle: {
    alignItems: 'center',
    borderRadius: 24,
    elevation: 4,
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerCircleSmall: {
    alignItems: 'center',
    borderRadius: 20,
    elevation: 4,
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerDest: {
    backgroundColor: '#16A34A',
  },
  markerDestActive: {
    backgroundColor: '#15803D',
  },
  markerLabel: {
    backgroundColor: 'rgba(2,18,7,0.85)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  markerLabelText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  markerOrigin: {
    backgroundColor: '#374151',
  },
  markerOriginActive: {
    backgroundColor: '#2563EB',
  },
  markerPickup: {
    backgroundColor: '#EA580C',
  },
  markerPickupActive: {
    backgroundColor: '#C2410C',
  },
  markerPickupText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  markerWrapper: {
    alignItems: 'center',
  },
  pickupIndexBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,146,60,0.20)',
    borderColor: 'rgba(251,146,60,0.40)',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  pickupIndexText: {
    color: '#FB923C',
    fontSize: 11,
    fontWeight: '700',
  },
});
