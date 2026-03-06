import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MapPin, Edit2, CheckCircle } from 'lucide-react-native';
import { useOnboardingStore } from '@stores/onboarding.store';
import * as Location from 'expo-location';

const GREEN = '#4ADE80';
const GREEN_BG = 'rgba(74,222,128,0.12)';
const GREEN_BORDER = 'rgba(74,222,128,0.4)';
const GLASS_BG = 'rgba(255,255,255,0.05)';
const GLASS_BORDER = 'rgba(255,255,255,0.09)';

export function LocationInformation() {
  const { transportData, setFleetInfo } = useOnboardingStore();

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCity, setManualCity] = useState('');

  const baseLocation = transportData?.fleetInfo?.baseLocation;
  const hasLocation = !!(baseLocation?.city || baseLocation?.address);

  useEffect(
    () => {
      if (!hasLocation) {
        requestLocationPermission();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const requestLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (reverseGeocode && reverseGeocode[0]) {
          const loc = reverseGeocode[0];
          const detected = {
            city: loc.city || '',
            state: loc.region || '',
            country: loc.country || '',
            address:
              `${loc.street || ''} ${loc.city || ''} ${loc.region || ''} ${loc.country || ''}`.trim(),
          };

          if (detected.city || detected.address) {
            setFleetInfo({
              ...transportData?.fleetInfo,
              baseLocation: {
                id: 'base-1',
                address: detected.address,
                city: detected.city,
                state: detected.state,
                country: detected.country,
                zipCode: '',
              },
              vehicleCount: transportData?.fleetInfo?.vehicleCount || 0,
              vehicleTypes: transportData?.fleetInfo?.vehicleTypes || [],
              capacity: transportData?.fleetInfo?.capacity || { total: 0, unit: 'tons' },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleManualLocation = () => {
    if (!manualCity.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }

    setFleetInfo({
      ...transportData?.fleetInfo,
      baseLocation: {
        id: 'base-1',
        address: manualCity,
        city: manualCity.split(',')[0]?.trim() || manualCity,
        state: '',
        country: '',
        zipCode: '',
      },
      vehicleCount: transportData?.fleetInfo?.vehicleCount || 0,
      vehicleTypes: transportData?.fleetInfo?.vehicleTypes || [],
      capacity: transportData?.fleetInfo?.capacity || { total: 0, unit: 'tons' },
    });
    setShowManualInput(false);
    setManualCity('');
  };

  return (
    <View style={styles.container}>
      {/* Main Location Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <MapPin size={16} color={GREEN} />
          </View>
          <Text style={styles.cardTitle}>Main Base Location</Text>
          {hasLocation && <CheckCircle size={16} color={GREEN} style={styles.checkIcon} />}
        </View>

        {loadingLocation ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={GREEN} />
            <Text style={styles.loadingText}>Detecting your location...</Text>
          </View>
        ) : !showManualInput && hasLocation ? (
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => setShowManualInput(true)}
            activeOpacity={0.75}
          >
            <View style={styles.locationContent}>
              <Text style={styles.locationCity}>
                {baseLocation?.city || baseLocation?.address || 'Location set'}
              </Text>
              {baseLocation?.state ? (
                <Text style={styles.locationRegion}>
                  {baseLocation.state}
                  {baseLocation.country ? `, ${baseLocation.country}` : ''}
                </Text>
              ) : null}
            </View>
            <View style={styles.editBadge}>
              <Edit2 size={13} color={GREEN} />
            </View>
          </TouchableOpacity>
        ) : (
          <View>
            <TextInput
              value={manualCity}
              onChangeText={setManualCity}
              placeholder="City or region..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.textInput}
              autoFocus={showManualInput}
            />
            <View style={styles.manualBtns}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setShowManualInput(false);
                  setManualCity('');
                }}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleManualLocation}>
                <Text style={styles.btnConfirmText}>Set Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {!hasLocation && !loadingLocation && (
        <TouchableOpacity
          style={styles.manualFallback}
          onPress={() => setShowManualInput(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.manualFallbackText}>Enter location manually</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btnCancel: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
  },
  btnCancelText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnConfirm: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  btnConfirmText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    backgroundColor: GLASS_BG,
    borderColor: GLASS_BORDER,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  container: {
    flex: 1,
  },
  editBadge: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 8,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    marginLeft: 10,
  },
  locationCity: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  locationContent: {
    flex: 1,
  },
  locationRegion: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 2,
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(74,222,128,0.05)',
    borderColor: 'rgba(74,222,128,0.2)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  manualBtns: {
    flexDirection: 'row',
    marginTop: 10,
  },
  manualFallback: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  manualFallbackText: {
    color: 'rgba(74,222,128,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: GLASS_BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
});
