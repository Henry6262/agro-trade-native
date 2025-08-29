import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Search, X, MapPin, Navigation2 } from 'lucide-react-native';
import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.config';

interface PlacesSearchProps {
  onPlaceSelect: (place: any) => void;
  onGetCurrentLocation: () => void;
  isLoadingLocation?: boolean;
  defaultCountry?: string;
  placeholder?: string;
  value?: string;
}

export const PlacesSearchWeb: React.FC<PlacesSearchProps> = ({
  onPlaceSelect,
  onGetCurrentLocation,
  isLoadingLocation = false,
  defaultCountry = 'bg',
  placeholder = 'Search for an address or place...',
  value = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const searchTimeout = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Google Places services
    if ((window as any).google?.maps?.places) {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
      placesService.current = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      );
    } else {
      // Load Google Maps if not already loaded
      if (!(window as any).googleMapsLoading) {
        (window as any).googleMapsLoading = true;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
          placesService.current = new (window as any).google.maps.places.PlacesService(
            document.createElement('div')
          );
        };
        document.head.appendChild(script);
      }
    }
  }, []);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const searchPlaces = (query: string) => {
    if (!query || query.length < 3 || !autocompleteService.current) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsSearching(true);
    
    // Clear existing timeout
    clearTimeout(searchTimeout.current);
    
    // Debounce search
    searchTimeout.current = setTimeout(() => {
      const request = {
        input: query,
        componentRestrictions: { country: defaultCountry },
        types: ['establishment', 'geocode']
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (results: any, status: any) => {
          setIsSearching(false);
          
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    }, 300);
  };

  const selectPlace = (placeId: string) => {
    if (!placesService.current) return;

    const request = {
      placeId: placeId,
      fields: [
        'name',
        'formatted_address',
        'address_components',
        'geometry',
        'place_id',
        'types'
      ]
    };

    placesService.current.getDetails(request, (place: any, status: any) => {
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
        setSearchQuery(place.formatted_address || place.name);
        setShowPredictions(false);
        
        // Extract address components
        const addressComponents = place.address_components || [];
        const location = {
          address: place.formatted_address || place.name,
          city: findComponent(addressComponents, 'locality') || 
                findComponent(addressComponents, 'administrative_area_level_2') || '',
          region: findComponent(addressComponents, 'administrative_area_level_1') || '',
          country: findComponent(addressComponents, 'country') || '',
          postalCode: findComponent(addressComponents, 'postal_code'),
          coordinates: {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          }
        };

        onPlaceSelect(location);
      }
    });
  };

  const findComponent = (components: any[], type: string): string | null => {
    const component = components.find((c: any) => c.types.includes(type));
    return component ? component.long_name : null;
  };

  const handleInputChange = (text: string) => {
    setSearchQuery(text);
    searchPlaces(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPredictions([]);
    setShowPredictions(false);
  };

  if (Platform.OS !== 'web') {
    // For non-web platforms, render a simple input
    return (
      <View style={styles.container}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={searchQuery}
            onChangeText={handleInputChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onGetCurrentLocation}
            style={styles.locationButton}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#10b981" />
            ) : (
              <Navigation2 size={20} color="#10b981" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <Search size={20} color="#6b7280" />
        <input
          ref={inputRef as any}
          style={styles.searchInputWeb as any}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => searchQuery.length >= 3 && setShowPredictions(true)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
        {isSearching && (
          <ActivityIndicator size="small" color="#6b7280" style={styles.searchingIndicator} />
        )}
        <TouchableOpacity
          onPress={onGetCurrentLocation}
          style={styles.locationButton}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color="#10b981" />
          ) : (
            <Navigation2 size={20} color="#10b981" />
          )}
        </TouchableOpacity>
      </View>
      
      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <ScrollView style={styles.predictionsList} keyboardShouldPersistTaps="handled">
            {predictions.map((prediction) => (
              <TouchableOpacity
                key={prediction.place_id}
                style={styles.predictionItem}
                onPress={() => selectPlace(prediction.place_id)}
              >
                <MapPin size={16} color="#6b7280" />
                <View style={styles.predictionText}>
                  <Text style={styles.predictionMain}>
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </Text>
                  {prediction.structured_formatting?.secondary_text && (
                    <Text style={styles.predictionSecondary}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative' as any,
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      } as any,
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    paddingVertical: 8,
  },
  searchInputWeb: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  searchingIndicator: {
    marginRight: 8,
  },
  locationButton: {
    padding: 8,
  },
  predictionsContainer: {
    position: 'absolute' as any,
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      } as any,
    }),
  },
  predictionsList: {
    maxHeight: 300,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    cursor: 'pointer' as any,
  },
  predictionText: {
    flex: 1,
    marginLeft: 8,
  },
  predictionMain: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  predictionSecondary: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default PlacesSearchWeb;