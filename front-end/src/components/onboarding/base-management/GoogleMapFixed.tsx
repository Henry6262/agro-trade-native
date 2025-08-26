import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Platform, ActivityIndicator } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.config';

interface GoogleMapFixedProps {
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

// Singleton loader for Google Maps
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

const loadGoogleMaps = (): Promise<void> => {
  if (isLoaded) {
    return Promise.resolve();
  }
  
  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  
  loadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).google?.maps) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          isLoaded = true;
          isLoading = false;
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!isLoaded) {
          reject(new Error('Google Maps loading timeout'));
        }
      }, 10000);
      return;
    }

    // Create and load script
    (window as any).initGoogleMaps = () => {
      console.log('Google Maps loaded successfully');
      isLoaded = true;
      isLoading = false;
      delete (window as any).initGoogleMaps;
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMaps&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const MapView = React.forwardRef<any, GoogleMapFixedProps>(
  ({ style, region, onPress, showsUserLocation, children }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [mapReady, setMapReady] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
      if (Platform.OS !== 'web') return;

      let mounted = true;
      
      const initializeMap = async () => {
        try {
          // Load Google Maps
          await loadGoogleMaps();
          
          if (!mounted || !mapContainerRef.current) return;

          console.log('Creating map instance...');

          // Create map with proper initialization
          const google = (window as any).google;
          const mapOptions = {
            center: {
              lat: region?.latitude || 42.7339,
              lng: region?.longitude || 25.4858,
            },
            zoom: region ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 8,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            clickableIcons: false,
            disableDoubleClickZoom: false,
          };

          const map = new google.maps.Map(mapContainerRef.current, mapOptions);
          mapRef.current = map;

          console.log('Map created, adding event listeners...');

          // Wait for map to be ready
          google.maps.event.addListenerOnce(map, 'idle', () => {
            console.log('Map is ready and idle');
            setMapReady(true);
          });

          // Add click listener - IMPORTANT: Use google.maps.event.addListener
          const clickListener = google.maps.event.addListener(map, 'click', (event: any) => {
            console.log('Map click event fired!', event);
            
            if (!event.latLng) {
              console.error('No latLng in event');
              return;
            }

            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            console.log(`Coordinates: ${lat}, ${lng}`);

            // Clear previous markers
            markersRef.current.forEach(marker => {
              marker.setMap(null);
            });
            markersRef.current = [];

            // Add new marker
            const marker = new google.maps.Marker({
              position: { lat, lng },
              map: map,
              animation: google.maps.Animation.DROP,
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              },
            });
            
            markersRef.current.push(marker);

            // Add circle around marker
            const circle = new google.maps.Circle({
              center: { lat, lng },
              radius: 500,
              map: map,
              strokeColor: '#10b981',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#10b981',
              fillOpacity: 0.2,
            });
            
            markersRef.current.push(circle);

            // Pan to location
            map.panTo(event.latLng);

            // Call callback
            if (onPress) {
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

          console.log('Click listener added successfully');

          // Add other event listeners for debugging
          google.maps.event.addListener(map, 'zoom_changed', () => {
            console.log('Zoom changed to:', map.getZoom());
          });

          google.maps.event.addListener(map, 'dragstart', () => {
            console.log('Map drag started');
          });

          google.maps.event.addListener(map, 'dragend', () => {
            console.log('Map drag ended');
          });

          // Show user location if requested
          if (showsUserLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userPos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                
                new google.maps.Marker({
                  position: userPos,
                  map: map,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
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
                console.warn('Geolocation error:', error);
              }
            );
          }

        } catch (error) {
          console.error('Map initialization error:', error);
          setLoadingError(error instanceof Error ? error.message : 'Failed to load map');
        }
      };

      initializeMap();

      return () => {
        mounted = false;
        // Cleanup
        if (mapRef.current) {
          (window as any).google?.maps?.event?.clearInstanceListeners(mapRef.current);
        }
        markersRef.current.forEach(marker => {
          if (marker?.setMap) {
            marker.setMap(null);
          }
        });
      };
    }, []); // Only run once

    // Update map when region changes
    useEffect(() => {
      if (mapRef.current && region && mapReady) {
        const google = (window as any).google;
        if (!google) return;

        mapRef.current.setCenter({
          lat: region.latitude,
          lng: region.longitude,
        });
        mapRef.current.setZoom(
          Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2)
        );
      }
    }, [region, mapReady]);

    // Handle children markers
    useEffect(() => {
      if (!mapRef.current || !mapReady) return;
      
      const google = (window as any).google;
      if (!google) return;

      // Clear existing child markers
      markersRef.current.forEach(marker => {
        if (marker?.setMap) {
          marker.setMap(null);
        }
      });

      const newMarkers: any[] = [];
      
      React.Children.forEach(children, (child: any) => {
        if (child?.props?.coordinate) {
          const marker = new google.maps.Marker({
            position: {
              lat: child.props.coordinate.latitude,
              lng: child.props.coordinate.longitude,
            },
            map: mapRef.current,
            title: child.props.title,
          });
          newMarkers.push(marker);
        }
      });

      markersRef.current = newMarkers;
    }, [children, mapReady]);

    // Forward ref
    useEffect(() => {
      if (ref && mapContainerRef.current) {
        (ref as any).current = mapContainerRef.current;
        
        // Add animateToRegion method
        (mapContainerRef.current as any).animateToRegion = (newRegion: any, duration: number) => {
          if (mapRef.current) {
            const center = {
              lat: newRegion.latitude,
              lng: newRegion.longitude,
            };
            mapRef.current.panTo(center);
            const zoom = Math.round(Math.log(360 / newRegion.latitudeDelta) / Math.LN2);
            setTimeout(() => {
              mapRef.current.setZoom(zoom);
            }, duration / 2);
          }
        };
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
            backgroundColor: '#e5e7eb',
            position: 'relative',
          }}
        />
        {!mapReady && !loadingError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        {loadingError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>⚠️ {loadingError}</Text>
            <Text style={styles.errorSubtext}>Please check your API key and internet connection</Text>
          </View>
        )}
      </View>
    );
  }
);

export const Marker = ({ coordinate, title, description }: any) => null;
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
    pointerEvents: 'none' as any,
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
    backgroundColor: 'rgba(254, 242, 242, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
  },
});

export default MapView;