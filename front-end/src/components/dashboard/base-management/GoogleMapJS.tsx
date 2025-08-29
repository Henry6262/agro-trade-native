import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.config';

interface GoogleMapJSProps {
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

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const MapView = React.forwardRef<any, GoogleMapJSProps>(
  ({ style, region, onPress, showsUserLocation, children }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const markersRef = useRef<any[]>([]);
    const selectionMarkerRef = useRef<any>(null);
    const selectionCircleRef = useRef<any>(null);

    useEffect(() => {
      if (Platform.OS !== 'web') return;

      // Load Google Maps script
      const loadGoogleMaps = () => {
        // Check if already loaded
        if (window.google?.maps) {
          initializeMap();
          return;
        }

        // Create script tag
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          setLoadError('Failed to load Google Maps');
        };

        // Define callback
        window.initMap = () => {
          initializeMap();
        };

        document.head.appendChild(script);
      };

      const initializeMap = () => {
        if (!mapContainerRef.current) return;

        try {
          // Create map instance using vanilla JS API
          const map = new window.google.maps.Map(mapContainerRef.current, {
            center: {
              lat: region?.latitude || 42.7339,
              lng: region?.longitude || 25.4858,
            },
            zoom: region ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 7,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            clickableIcons: false, // Important: disable POI clicks
            gestureHandling: 'greedy', // Allow single-finger drag
          });

          mapRef.current = map;

          // Add click event listener - This is the key part!
          map.addListener('click', (mapsMouseEvent: any) => {
            console.log('Map clicked!', mapsMouseEvent); // Debug log
            
            if (onPress && mapsMouseEvent.latLng) {
              const lat = mapsMouseEvent.latLng.lat();
              const lng = mapsMouseEvent.latLng.lng();
              
              console.log('Coordinates:', lat, lng); // Debug log

              // Clear previous selection marker
              if (selectionMarkerRef.current) {
                selectionMarkerRef.current.setMap(null);
              }

              // Clear previous selection circle
              if (selectionCircleRef.current) {
                selectionCircleRef.current.setMap(null);
              }

              // Add new selection marker
              selectionMarkerRef.current = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                animation: window.google.maps.Animation.DROP,
                icon: {
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(40, 40),
                },
                title: 'Selected Location',
              });

              // Add selection circle (500m radius)
              selectionCircleRef.current = new window.google.maps.Circle({
                center: { lat, lng },
                radius: 500,
                map: map,
                strokeColor: '#10b981',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#10b981',
                fillOpacity: 0.2,
                clickable: false,
              });

              // Pan to clicked location
              map.panTo(mapsMouseEvent.latLng);

              // Call the callback
              onPress({
                nativeEvent: {
                  coordinate: {
                    latitude: lat,
                    longitude: lng,
                  },
                },
              });
            }
          });

          // Show user location if requested
          if (showsUserLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };

                // Add blue dot for user location
                new window.google.maps.Marker({
                  position: userLocation,
                  map: map,
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  },
                  title: 'Your Location',
                });
              },
              (error) => {
                console.error('Geolocation error:', error);
              }
            );
          }

          // Expose map methods
          if (mapContainerRef.current) {
            (mapContainerRef.current as any).animateToRegion = (newRegion: any, duration: number) => {
              if (map) {
                const center = {
                  lat: newRegion.latitude,
                  lng: newRegion.longitude,
                };
                map.panTo(center);
                
                const zoom = Math.round(Math.log(360 / newRegion.latitudeDelta) / Math.LN2);
                setTimeout(() => {
                  map.setZoom(zoom);
                }, duration / 2);
              }
            };
          }

          setIsLoaded(true);
        } catch (error) {
          console.error('Map initialization error:', error);
          setLoadError('Failed to initialize map');
        }
      };

      loadGoogleMaps();

      // Cleanup
      return () => {
        // Clear markers
        markersRef.current.forEach(marker => {
          if (marker?.setMap) {
            marker.setMap(null);
          }
        });
        if (selectionMarkerRef.current?.setMap) {
          selectionMarkerRef.current.setMap(null);
        }
        if (selectionCircleRef.current?.setMap) {
          selectionCircleRef.current.setMap(null);
        }
      };
    }, []); // Only run once on mount

    // Update map when region changes
    useEffect(() => {
      if (mapRef.current && region) {
        mapRef.current.setCenter({
          lat: region.latitude,
          lng: region.longitude,
        });
        mapRef.current.setZoom(Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2));
      }
    }, [region]);

    // Handle children markers
    useEffect(() => {
      if (!mapRef.current || !isLoaded) return;

      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker?.setMap) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];

      // Add markers from children
      React.Children.forEach(children, (child: any) => {
        if (child?.props?.coordinate) {
          const marker = new window.google.maps.Marker({
            position: {
              lat: child.props.coordinate.latitude,
              lng: child.props.coordinate.longitude,
            },
            map: mapRef.current,
            title: child.props.title,
            animation: window.google.maps.Animation.DROP,
          });

          // Add info window if description exists
          if (child.props.description) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: child.props.description,
            });

            marker.addListener('click', () => {
              infoWindow.open(mapRef.current, marker);
            });
          }

          markersRef.current.push(marker);
        }
      });
    }, [children, isLoaded]);

    // Forward ref
    useEffect(() => {
      if (ref && mapContainerRef.current) {
        (ref as any).current = mapContainerRef.current;
      }
    }, [ref]);

    if (Platform.OS !== 'web') {
      return (
        <View style={[styles.container, style]}>
          <Text>Map is only available on web</Text>
        </View>
      );
    }

    return (
      <View style={[styles.container, style]}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 400,
          }}
        />
        {!isLoaded && !loadError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        {loadError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        )}
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
    position: 'relative' as any,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(254, 242, 242, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
});

export default MapView;