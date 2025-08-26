import { Platform } from 'react-native';

// Use Google Maps JavaScript API on web
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS === 'web') {
  // Use fixed Google Maps JavaScript API with proper loading
  const GoogleMapFixed = require('./GoogleMapFixed');
  MapView = GoogleMapFixed.MapView;
  Marker = GoogleMapFixed.Marker;
  PROVIDER_GOOGLE = GoogleMapFixed.PROVIDER_GOOGLE;
} else {
  // Use react-native-maps on mobile
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
  } catch (e) {
    console.error('react-native-maps not available:', e);
    // Fallback to web version
    const GoogleMapWeb = require('./GoogleMapWeb');
    MapView = GoogleMapWeb.MapView;
    Marker = GoogleMapWeb.Marker;
    PROVIDER_GOOGLE = GoogleMapWeb.PROVIDER_GOOGLE;
  }
}

export { MapView, Marker, PROVIDER_GOOGLE };

// Also export as default for metro resolver
export default MapView;