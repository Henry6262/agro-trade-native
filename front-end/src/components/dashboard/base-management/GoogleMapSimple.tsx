import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.config';

interface GoogleMapSimpleProps {
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

// Global counter for unique map IDs
let mapIdCounter = 0;

export const MapView = React.forwardRef<any, GoogleMapSimpleProps>(
  ({ style, region, onPress, showsUserLocation, children }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const mapIdRef = useRef(`map-${++mapIdCounter}`);

    useEffect(() => {
      if (Platform.OS !== 'web') return;

      let mapInstance: any = null;
      
      const initMap = () => {
        if (!mapContainerRef.current) {
          console.error('Map container not ready');
          return;
        }

        console.log('Initializing map...');
        
        try {
          // Create map
          mapInstance = new (window as any).google.maps.Map(mapContainerRef.current, {
            center: {
              lat: region?.latitude || 42.7339,
              lng: region?.longitude || 25.4858,
            },
            zoom: region ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 8,
            disableDefaultUI: false,
            clickableIcons: false,
          });

          mapInstanceRef.current = mapInstance;
          console.log('Map created successfully');

          // Add click listener
          const clickListener = mapInstance.addListener('click', (e: any) => {
            console.log('Map clicked!', e);
            
            if (!e.latLng) {
              console.error('No latLng in click event');
              return;
            }

            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            console.log(`Clicked at: ${lat}, ${lng}`);
            
            // Add marker at clicked location
            new (window as any).google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              animation: (window as any).google.maps.Animation.DROP,
            });

            // Call callback if provided
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

          console.log('Click listener added');

          // Test that events work by logging other events
          mapInstance.addListener('zoom_changed', () => {
            console.log('Zoom changed to:', mapInstance.getZoom());
          });

          mapInstance.addListener('idle', () => {
            console.log('Map is idle');
          });

        } catch (error) {
          console.error('Error creating map:', error);
        }
      };

      // Check if Google Maps is loaded
      if ((window as any).google?.maps) {
        console.log('Google Maps already loaded');
        initMap();
      } else {
        console.log('Loading Google Maps...');
        
        // Create callback function
        const callbackName = `initMap_${mapIdRef.current.replace('-', '_')}`;
        (window as any)[callbackName] = () => {
          console.log('Google Maps loaded via callback');
          initMap();
        };

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          console.log('Script already exists, waiting for load...');
          // If script exists but Google Maps isn't loaded yet, wait
          const checkInterval = setInterval(() => {
            if ((window as any).google?.maps) {
              clearInterval(checkInterval);
              initMap();
            }
          }, 100);
        } else {
          // Create and append script
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=${callbackName}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onerror = (e) => {
            console.error('Failed to load Google Maps script:', e);
          };
          document.head.appendChild(script);
        }
      }

      // Expose ref methods
      if (mapContainerRef.current) {
        (mapContainerRef.current as any).animateToRegion = (newRegion: any, duration: number) => {
          if (mapInstanceRef.current) {
            const center = {
              lat: newRegion.latitude,
              lng: newRegion.longitude,
            };
            mapInstanceRef.current.panTo(center);
            const zoom = Math.round(Math.log(360 / newRegion.latitudeDelta) / Math.LN2);
            setTimeout(() => {
              mapInstanceRef.current.setZoom(zoom);
            }, duration / 2);
          }
        };
      }

      return () => {
        // Cleanup
        if (mapInstance) {
          (window as any).google.maps.event.clearInstanceListeners(mapInstance);
        }
      };
    }, []); // Run once

    // Update center when region changes
    useEffect(() => {
      if (mapInstanceRef.current && region) {
        console.log('Updating map region');
        mapInstanceRef.current.setCenter({
          lat: region.latitude,
          lng: region.longitude,
        });
        mapInstanceRef.current.setZoom(
          Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2)
        );
      }
    }, [region]);

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
          id={mapIdRef.current}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 400,
            backgroundColor: '#f0f0f0',
          }}
        >
          {/* Map will be rendered here */}
        </div>
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
});

export default MapView;