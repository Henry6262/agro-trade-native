import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.config';
import { MAP_STYLES, MARKER_ICONS } from '../../../config/maps.styles';

interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    description?: string;
    isUserLocation?: boolean;
    isSelection?: boolean;
  }>;
  showUserLocation?: boolean;
  style?: any;
}

// Map component that handles the actual Google Map instance
const Map: React.FC<MapProps> = ({
  center,
  zoom,
  onMapClick,
  markers = [],
  showUserLocation,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [markersArray, setMarkersArray] = useState<google.maps.Marker[]>([]);
  const [userMarker, setUserMarker] = useState<google.maps.Marker>();
  const [selectionCircle, setSelectionCircle] = useState<google.maps.Circle | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener>();

  // Initialize map
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center,
        zoom,
        disableDefaultUI: false,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        // Use custom map styling from config
        styles: MAP_STYLES,
        gestureHandling: 'cooperative', // Better for click detection
        clickableIcons: false, // Disable POI clicks
        disableDoubleClickZoom: false, // Allow double click zoom
      });

      setMap(newMap);
    }
  }, [center, zoom, map]);

  // Handle click events following Google's event handling pattern
  useEffect(() => {
    if (!map || !onMapClick) return;

    // Remove previous listener if exists
    if (clickListenerRef.current) {
      clickListenerRef.current.remove();
    }

    // Add click listener directly to map (Google's recommended approach)
    clickListenerRef.current = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      // Check if click has latLng (it should always have it for map clicks)
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        console.log('Map clicked at:', lat, lng); // Debug log
        
        // Call the callback
        onMapClick({ latitude: lat, longitude: lng });

        // Remove previous selection markers
        markersArray.forEach((marker) => {
          const customData = (marker as any).customData;
          if (customData?.isSelection) {
            marker.setMap(null);
          }
        });

        // Add selection marker with animation
        const selectionMarker = new google.maps.Marker({
          position: { lat, lng },
          map: map,
          animation: google.maps.Animation.DROP,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          },
          title: 'Selected Location',
          zIndex: 1000,
        });

        // Add custom data to track this as a selection marker
        (selectionMarker as any).customData = { isSelection: true };
        
        // Update markers array
        setMarkersArray((prev) => {
          const nonSelectionMarkers = prev.filter(m => !(m as any).customData?.isSelection);
          return [...nonSelectionMarkers, selectionMarker];
        });

        // Remove previous circle if exists
        if (selectionCircle) {
          selectionCircle.setMap(null);
        }

        // Add a circle to show 500m radius around selected point
        const circle = new google.maps.Circle({
          center: { lat, lng },
          radius: 500, // 500 meters
          map: map,
          strokeColor: '#10b981',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.2,
          clickable: false,
        });

        setSelectionCircle(circle);

        // Optional: Pan to clicked location smoothly
        map.panTo(event.latLng);
      }
    });

    return () => {
      if (clickListenerRef.current) {
        clickListenerRef.current.remove();
      }
    };
  }, [map, onMapClick, selectionCircle]);

  // Handle markers
  useEffect(() => {
    if (!map) return;

    // Clear non-selection markers
    markersArray.forEach((marker) => {
      const customData = (marker as any).customData;
      if (!customData?.isSelection) {
        marker.setMap(null);
      }
    });

    // Add new markers
    const newMarkers = markers.map((markerData) => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        animation: markerData.isSelection ? google.maps.Animation.DROP : undefined,
        icon: markerData.isUserLocation
          ? {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          : markerData.isSelection
          ? {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(48, 48),
            }
          : undefined,
      });

      // Add custom data
      (marker as any).customData = {
        isUserLocation: markerData.isUserLocation,
        isSelection: markerData.isSelection,
      };

      // Add info window if description exists
      if (markerData.description) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>${markerData.title || ''}</strong>
              <p style="margin: 4px 0 0 0;">${markerData.description}</p>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }

      return marker;
    });

    // Keep selection markers
    const selectionMarkers = markersArray.filter(m => (m as any).customData?.isSelection);
    setMarkersArray([...selectionMarkers, ...newMarkers]);

  }, [markers, map]);

  // Get user location
  useEffect(() => {
    if (!map || !showUserLocation) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Remove previous user marker
          if (userMarker) {
            userMarker.setMap(null);
          }

          // Add user location marker
          const newUserMarker = new google.maps.Marker({
            position: userLocation,
            map,
            title: 'Your Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            zIndex: 999,
          });

          setUserMarker(newUserMarker);

          // Optional: Pan to user location
          // map.panTo(userLocation);
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, [map, showUserLocation]);

  // Expose map methods via ref
  useEffect(() => {
    if (ref.current && map) {
      (ref.current as any).animateToRegion = (region: any, duration: number) => {
        const center = { lat: region.latitude, lng: region.longitude };
        map.panTo(center);
        
        // Calculate zoom from delta
        const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
        
        setTimeout(() => {
          map.setZoom(zoom);
        }, duration / 2);
      };

      (ref.current as any).googleMap = map;
    }
  }, [map]);

  // Update center and zoom when props change
  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [center, zoom, map]);

  return <div ref={ref} style={{ width: '100%', height: '100%', ...style }} />;
};

// Loading component
const MapLoading = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color="#4285F4" />
    <Text style={styles.loadingText}>Loading map...</Text>
  </View>
);

// Error component
const MapError = ({ error }: { error: string }) => (
  <View style={styles.error}>
    <Text style={styles.errorText}>⚠️ Map Error</Text>
    <Text style={styles.errorMessage}>{error}</Text>
  </View>
);

// Main wrapper component for React Native
interface GoogleMapReactProps {
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onPress?: (event: any) => void;
  showsUserLocation?: boolean;
  children?: React.ReactNode;
}

export const MapView = React.forwardRef<any, GoogleMapReactProps>(
  ({ style, region, onPress, showsUserLocation, children }, ref) => {
    const [markers, setMarkers] = useState<any[]>([]);

    // Extract markers from children
    useEffect(() => {
      const extractedMarkers: any[] = [];
      React.Children.forEach(children, (child: any) => {
        if (child?.props?.coordinate) {
          extractedMarkers.push({
            position: {
              lat: child.props.coordinate.latitude,
              lng: child.props.coordinate.longitude,
            },
            title: child.props.title,
            description: child.props.description,
          });
        }
      });
      setMarkers(extractedMarkers);
    }, [children]);

    const center = {
      lat: region?.latitude || 42.7339,
      lng: region?.longitude || 25.4858,
    };

    const zoom = region
      ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2)
      : 7;

    return (
      <View style={[styles.container, style]}>
        <Wrapper 
          apiKey={GOOGLE_MAPS_API_KEY}
          render={(status: Status) => {
            if (status === Status.LOADING) return <MapLoading />;
            if (status === Status.FAILURE) return <MapError error="Failed to load Google Maps" />;
            return null;
          }}
          libraries={['places', 'geometry']}
        >
          <Map
            ref={ref as any}
            center={center}
            zoom={zoom}
            onMapClick={
              onPress
                ? (coords) =>
                    onPress({
                      nativeEvent: { coordinate: coords },
                    })
                : undefined
            }
            markers={markers}
            showUserLocation={showsUserLocation}
            style={style}
          />
        </Wrapper>
      </View>
    );
  }
);

// Marker component (for compatibility)
export const Marker = ({ coordinate, title, description }: any) => {
  // Marker is handled by parent MapView
  return null;
};

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
  },
});

export default MapView;