import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Dimensions
} from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from './MapView';

// Region type for MapView
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
import * as Location from 'expo-location';
import { PlacesSearchWeb } from './PlacesSearchWeb';
import {
  MapPin,
  Search,
  Navigation2,
  Warehouse,
  Plus,
  Check,
  X,
  ChevronDown
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Types
interface BaseLocation {
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface SmartBaseCreationProps {
  onSave: (base: any) => void;
  onCancel: () => void;
  defaultCountry?: string;
}

// Google Maps API configuration
import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.config';

export const SmartBaseCreationExpo: React.FC<SmartBaseCreationProps> = ({
  onSave,
  onCancel,
  defaultCountry = 'Bulgaria'
}) => {
  const [currentStep, setCurrentStep] = useState<'search' | 'details'>('search');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<BaseLocation | null>(null);
  const [baseDetails, setBaseDetails] = useState({
    name: '',
    type: 'WAREHOUSE' as const,
    capacity: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  });

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 42.7339, // Bulgaria center
    longitude: 25.4858,
    latitudeDelta: 8,
    longitudeDelta: 8,
  });

  const mapRef = useRef<MapView>(null);

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Update map to user's location
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      
      setMapRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      // Reverse geocode to get address
      await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        const location: BaseLocation = {
          address: result.formatted_address,
          city: findComponent(addressComponents, 'locality') || 
                findComponent(addressComponents, 'administrative_area_level_2') || '',
          region: findComponent(addressComponents, 'administrative_area_level_1') || '',
          country: findComponent(addressComponents, 'country') || '',
          postalCode: findComponent(addressComponents, 'postal_code'),
          coordinates: {
            latitude,
            longitude,
          }
        };
        
        setSelectedLocation(location);
        
        // Auto-suggest base name based on location
        if (!baseDetails.name && location.city) {
          setBaseDetails(prev => ({
            ...prev,
            name: `${location.city} ${baseDetails.type === 'WAREHOUSE' ? 'Warehouse' : 'Facility'}`
          }));
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const findComponent = (components: any[], type: string): string | null => {
    const component = components.find(c => c.types.includes(type));
    return component ? component.long_name : null;
  };


  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
    
    reverseGeocode(latitude, longitude);
  };

  const handleSave = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }
    
    if (!baseDetails.name) {
      Alert.alert('Error', 'Please enter a base name');
      return;
    }
    
    const newBase = {
      id: Date.now().toString(),
      name: baseDetails.name,
      type: baseDetails.type,
      address: selectedLocation.address,
      city: selectedLocation.city,
      region: selectedLocation.region,
      country: selectedLocation.country,
      postalCode: selectedLocation.postalCode,
      latitude: selectedLocation.coordinates.latitude,
      longitude: selectedLocation.coordinates.longitude,
      capacity: baseDetails.capacity ? parseInt(baseDetails.capacity) : undefined,
      contactPerson: baseDetails.contactPerson || undefined,
      contactPhone: baseDetails.contactPhone || undefined,
      contactEmail: baseDetails.contactEmail || undefined,
      isPrimary: false,
    };
    
    onSave(newBase);
  };

  const baseTypes = [
    { value: 'WAREHOUSE', label: 'Warehouse', icon: '🏢' },
    { value: 'SILO', label: 'Silo', icon: '🌾' },
    { value: 'DEPOT', label: 'Depot', icon: '📦' },
    { value: 'OFFICE', label: 'Office', icon: '🏤' },
    { value: 'PORT', label: 'Port', icon: '⚓' },
    { value: 'FACTORY', label: 'Factory', icon: '🏭' },
    { value: 'FARM', label: 'Farm', icon: '🚜' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Location</Text>
        <TouchableOpacity
          onPress={currentStep === 'search' && selectedLocation ? () => setCurrentStep('details') : handleSave}
          disabled={!selectedLocation}
          style={[
            styles.nextButton,
            !selectedLocation && styles.nextButtonDisabled
          ]}
        >
          {currentStep === 'search' ? (
            <Text style={styles.nextButtonText}>Next</Text>
          ) : (
            <Check size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {currentStep === 'search' ? (
        <>
          {/* Search Bar with Places Autocomplete */}
          <View style={styles.searchContainer}>
            {Platform.OS === 'web' ? (
              <PlacesSearchWeb
                onPlaceSelect={(location) => {
                  setSelectedLocation(location);
                  // Update map region to show selected place
                  const newRegion = {
                    latitude: location.coordinates.latitude,
                    longitude: location.coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  };
                  setMapRegion(newRegion);
                  mapRef.current?.animateToRegion(newRegion, 1000);
                  
                  // Auto-suggest base name
                  if (!baseDetails.name && location.city) {
                    setBaseDetails(prev => ({
                      ...prev,
                      name: `${location.city} ${baseDetails.type === 'WAREHOUSE' ? 'Warehouse' : 'Facility'}`
                    }));
                  }
                }}
                onGetCurrentLocation={getCurrentLocation}
                isLoadingLocation={isLoadingLocation}
                defaultCountry="bg"
                value={selectedLocation?.address || ''}
              />
            ) : (
              // Mobile version - simple input
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#6b7280" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tap on map to select location..."
                  value={selectedLocation?.city || ''}
                  editable={false}
                />
                <TouchableOpacity
                  onPress={getCurrentLocation}
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
            )}
          </View>

          {/* Map */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation.coordinates}
                title={baseDetails.name || 'Selected Location'}
                description={selectedLocation.address}
              />
            )}
          </MapView>

          {/* Selected Location Card */}
          {selectedLocation && (
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <MapPin size={20} color="#10b981" />
                <Text style={styles.locationCardTitle}>Selected Location</Text>
              </View>
              <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
              <Text style={styles.locationDetails}>
                {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
              </Text>
            </View>
          )}
        </>
      ) : (
        /* Details Form */
        <ScrollView style={styles.detailsForm} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sofia Main Warehouse"
                value={baseDetails.name}
                onChangeText={(text) => setBaseDetails({ ...baseDetails, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.typeSelector}
              >
                {baseTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setBaseDetails({ ...baseDetails, type: type.value as any })}
                    style={[
                      styles.typeOption,
                      baseDetails.type === type.value && styles.typeOptionSelected
                    ]}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.typeLabel,
                      baseDetails.type === type.value && styles.typeLabelSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Contact Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., John Smith"
                value={baseDetails.contactPerson}
                onChangeText={(text) => setBaseDetails({ ...baseDetails, contactPerson: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., +359 88 123 4567"
                keyboardType="phone-pad"
                value={baseDetails.contactPhone}
                onChangeText={(text) => setBaseDetails({ ...baseDetails, contactPhone: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., contact@warehouse.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={baseDetails.contactEmail}
                onChangeText={(text) => setBaseDetails({ ...baseDetails, contactEmail: text })}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Location Details</Text>
            <View style={styles.locationSummary}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.locationSummaryText}>{selectedLocation?.address}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  nextButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    zIndex: 1,
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
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  locationButton: {
    padding: 8,
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    }),
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  map: {
    flex: 1,
  },
  locationCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  locationDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsForm: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeOption: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginRight: 12,
    minWidth: 80,
  },
  typeOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  typeLabelSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  locationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  locationSummaryText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default SmartBaseCreationExpo;