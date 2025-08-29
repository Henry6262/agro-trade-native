import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.config';

interface GoogleMapWebProps {
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

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
}

// Store markers globally to add them after map loads
let pendingMarkers: { props: MarkerProps; map: any }[] = [];

export const MapView = ({ style, region, onPress, showsUserLocation, children }: GoogleMapWebProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Check if Google Maps script is already loaded
    if ((window as any).google?.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeMap();
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !(window as any).google) return;

    const googleMap = new (window as any).google.maps.Map(mapRef.current, {
      center: {
        lat: region?.latitude || 42.7339,
        lng: region?.longitude || 25.4858,
      },
      zoom: region ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 7,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    // Add click listener with proper click detection (not drag)
    if (onPress) {
      let isDragging = false;
      let dragTimeout: any;

      googleMap.addListener('dragstart', () => {
        isDragging = true;
        clearTimeout(dragTimeout);
      });

      googleMap.addListener('dragend', () => {
        // Reset drag flag after a short delay
        dragTimeout = setTimeout(() => {
          isDragging = false;
        }, 200);
      });

      googleMap.addListener('click', (e: any) => {
        // Only trigger if not dragging
        if (!isDragging) {
          // Add a marker at clicked location
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          
          // Clear previous selection marker if exists
          markersRef.current.forEach(marker => {
            if (marker.isSelectionMarker) {
              marker.setMap(null);
            }
          });
          
          // Add new selection marker
          const selectionMarker = new (window as any).google.maps.Marker({
            position: { lat: clickedLat, lng: clickedLng },
            map: googleMap,
            animation: (window as any).google.maps.Animation.DROP,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          });
          (selectionMarker as any).isSelectionMarker = true;
          markersRef.current.push(selectionMarker);

          onPress({
            nativeEvent: {
              coordinate: {
                latitude: clickedLat,
                longitude: clickedLng,
              },
            },
          });
        }
      });
    }

    // Get user location if requested
    if (showsUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Add user location marker
          new (window as any).google.maps.Marker({
            position: userLocation,
            map: googleMap,
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: 'Your Location',
          });
        }
      );
    }

    setMap(googleMap);
    setIsLoaded(true);

    // Add any pending markers
    pendingMarkers.forEach(({ props, map: pendingMap }) => {
      if (pendingMap === googleMap) {
        addMarker(props, googleMap);
      }
    });
    pendingMarkers = [];
  };

  const addMarker = (markerProps: MarkerProps, googleMap: any) => {
    if (!googleMap || !(window as any).google) return;

    const marker = new (window as any).google.maps.Marker({
      position: {
        lat: markerProps.coordinate.latitude,
        lng: markerProps.coordinate.longitude,
      },
      map: googleMap,
      title: markerProps.title,
    });

    if (markerProps.description) {
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `<div><strong>${markerProps.title || ''}</strong><br/>${markerProps.description}</div>`,
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMap, marker);
      });
    }

    markersRef.current.push(marker);
  };

  // Update map region when props change
  useEffect(() => {
    if (map && region) {
      map.setCenter({
        lat: region.latitude,
        lng: region.longitude,
      });
      map.setZoom(Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2));
    }
  }, [map, region]);

  // Handle child markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers from children
    React.Children.forEach(children, (child: any) => {
      if (child?.type?.name === 'Marker' || child?.props?.coordinate) {
        addMarker(child.props, map);
      }
    });
  }, [map, children]);

  // Also expose animateToRegion method
  useEffect(() => {
    if (mapRef.current) {
      (mapRef.current as any).animateToRegion = (newRegion: any, duration: number) => {
        if (map) {
          map.panTo({
            lat: newRegion.latitude,
            lng: newRegion.longitude,
          });
          setTimeout(() => {
            map.setZoom(Math.round(Math.log(360 / newRegion.latitudeDelta) / Math.LN2));
          }, duration / 2);
        }
      };
    }
  }, [map]);

  return (
    <View style={[styles.container, style]}>
      <div 
        ref={mapRef} 
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
};

export const Marker = ({ coordinate, title, description }: MarkerProps) => {
  // Marker is handled by parent MapView
  return null;
};

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});

export default MapView;