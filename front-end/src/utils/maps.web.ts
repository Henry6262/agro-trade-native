// Web shim for react-native-maps
// This prevents native-only module imports on web platform

export default {
  MapView: () => null,
  Marker: () => null,
  Callout: () => null,
  Polygon: () => null,
  Polyline: () => null,
  Circle: () => null,
  Overlay: () => null,
  Heatmap: () => null,
  Geojson: () => null,
  PROVIDER_GOOGLE: null,
  PROVIDER_DEFAULT: null,
};

export const MapView = () => null;
export const Marker = () => null;
export const Callout = () => null;
export const Polygon = () => null;
export const Polyline = () => null;
export const Circle = () => null;
export const Overlay = () => null;
export const Heatmap = () => null;
export const Geojson = () => null;
export const PROVIDER_GOOGLE = null;
export const PROVIDER_DEFAULT = null;
