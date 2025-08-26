import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

// Platform-specific imports
const MapViewNative = Platform.select({
  ios: () => require('react-native-maps').default,
  android: () => require('react-native-maps').default,
  default: () => null,
})();

const GoogleMap = Platform.select({
  web: () => require('@react-google-maps/api').GoogleMap,
  default: () => null,
})();

const useJsApiLoader = Platform.select({
  web: () => require('@react-google-maps/api').useJsApiLoader,
  default: () => null,
})();

interface MapWrapperProps {
  apiKey: string;
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    description?: string;
  }>;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onMarkerClick?: (markerId: string) => void;
  children?: React.ReactNode;
}

// Web Map Component
const WebMap: React.FC<MapWrapperProps> = ({
  apiKey,
  center,
  zoom = 10,
  markers = [],
  onMapClick,
  onMarkerClick,
  children,
}) => {
  if (!GoogleMap || !useJsApiLoader) {
    return <View style={styles.container}><Text>Map not available on web</Text></View>;
  }

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const handleMapClick = (event: any) => {
    if (onMapClick && event.latLng) {
      onMapClick({
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      });
    }
  };

  if (loadError) {
    return <View style={styles.container}><Text>Error loading map</Text></View>;
  }

  if (!isLoaded) {
    return <View style={styles.container}><Text>Loading map...</Text></View>;
  }

  const Marker = require('@react-google-maps/api').Marker;

  return (
    <GoogleMap
      mapContainerStyle={styles.webMap}
      center={center}
      zoom={zoom}
      onClick={handleMapClick}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          title={marker.title}
          onClick={() => onMarkerClick?.(marker.id)}
        />
      ))}
      {children}
    </GoogleMap>
  );
};

// Native Map Component
const NativeMap: React.FC<MapWrapperProps> = ({
  center,
  zoom = 10,
  markers = [],
  onMapClick,
  onMarkerClick,
  children,
}) => {
  if (!MapViewNative) {
    return <View style={styles.container}><Text>Map not available</Text></View>;
  }

  const Marker = require('react-native-maps').Marker;
  const PROVIDER_GOOGLE = require('react-native-maps').PROVIDER_GOOGLE;

  const handleMapPress = (event: any) => {
    if (onMapClick) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      onMapClick({ lat: latitude, lng: longitude });
    }
  };

  const region = {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: 0.5 / zoom,
    longitudeDelta: 0.5 / zoom,
  };

  return (
    <MapViewNative
      provider={PROVIDER_GOOGLE}
      style={styles.container}
      region={region}
      onPress={handleMapPress}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.position.lat,
            longitude: marker.position.lng,
          }}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerClick?.(marker.id)}
        />
      ))}
      {children}
    </MapViewNative>
  );
};

// Main Map Wrapper Component
export const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebMap {...props} />;
  }
  return <NativeMap {...props} />;
};

// Places Autocomplete Wrapper
interface PlacesAutocompleteWrapperProps {
  apiKey: string;
  placeholder?: string;
  onPlaceSelected: (place: any) => void;
  defaultCountry?: string;
}

export const PlacesAutocompleteWrapper: React.FC<PlacesAutocompleteWrapperProps> = ({
  apiKey,
  placeholder = 'Search for places...',
  onPlaceSelected,
  defaultCountry,
}) => {
  if (Platform.OS === 'web') {
    // Web implementation using Google Places Autocomplete widget
    const Autocomplete = require('@react-google-maps/api').Autocomplete;
    
    return (
      <Autocomplete
        onLoad={(autocomplete: any) => {
          if (defaultCountry) {
            autocomplete.setComponentRestrictions({ country: defaultCountry.toLowerCase() });
          }
        }}
        onPlaceChanged={(place: any) => {
          if (place) {
            onPlaceSelected(place);
          }
        }}
      >
        <input
          type="text"
          placeholder={placeholder}
          style={{
            width: '100%',
            height: 40,
            padding: '10px',
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        />
      </Autocomplete>
    );
  }

  // Native implementation
  const GooglePlacesAutocomplete = require('react-native-google-places-autocomplete').GooglePlacesAutocomplete;
  
  return (
    <GooglePlacesAutocomplete
      placeholder={placeholder}
      onPress={(data: any, details: any) => {
        if (details) {
          onPlaceSelected({
            geometry: details.geometry,
            formatted_address: details.formatted_address,
            address_components: details.address_components,
          });
        }
      }}
      query={{
        key: apiKey,
        language: 'en',
        components: defaultCountry ? `country:${defaultCountry.toLowerCase()}` : undefined,
      }}
      fetchDetails={true}
      enablePoweredByContainer={false}
      styles={{
        container: {
          flex: 0,
        },
        textInput: {
          height: 40,
          borderRadius: 8,
          paddingHorizontal: 10,
          fontSize: 16,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        },
      }}
    />
  );
};

// Location Service Wrapper
export const LocationService = {
  getCurrentPosition: async (): Promise<{ lat: number; lng: number }> => {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
    }

    // Native implementation
    const Geolocation = require('react-native-geolocation-service').default;
    
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: any) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error: any) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  },

  requestPermission: async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Web automatically requests permission when getCurrentPosition is called
      return true;
    }

    if (Platform.OS === 'ios') {
      const Geolocation = require('react-native-geolocation-service').default;
      const result = await Geolocation.requestAuthorization('whenInUse');
      return result === 'granted';
    }

    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to show nearby bases.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
  },
};

// Geocoding Service Wrapper
export const GeocodingService = {
  reverseGeocode: async (
    lat: number,
    lng: number,
    apiKey: string
  ): Promise<any> => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    // For web, use a proxy to avoid CORS issues
    const endpoint = Platform.OS === 'web' 
      ? `/api/geocode?latlng=${lat},${lng}` // Proxy through your backend
      : url;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      throw new Error('No results found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  },

  geocode: async (
    address: string,
    apiKey: string
  ): Promise<{ lat: number; lng: number }> => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const endpoint = Platform.OS === 'web'
      ? `/api/geocode?address=${encodeURIComponent(address)}`
      : url;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      throw new Error('No results found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webMap: {
    width: '100%',
    height: '100%',
  },
});

export default MapWrapper;