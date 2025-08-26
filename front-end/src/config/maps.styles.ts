// Google Maps Custom Styles
// Clean, modern map style that highlights important features

export const MAP_STYLES = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c8d7d4' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#93bbb5' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0e0e0' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#fff8dc' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#f0e68c' }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#e8f5e9' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#c8e6c9' }]
  },
  {
    featureType: 'poi.business',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#424242' }]
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }]
  }
];

// Custom marker icons for different base types
export const MARKER_ICONS = {
  WAREHOUSE: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
        <text x="20" y="26" font-size="20" text-anchor="middle" fill="white">🏢</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 }
  },
  SILO: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        <text x="20" y="26" font-size="20" text-anchor="middle" fill="white">🌾</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 }
  },
  DEPOT: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#6366f1" stroke="#ffffff" stroke-width="2"/>
        <text x="20" y="26" font-size="20" text-anchor="middle" fill="white">📦</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 }
  },
  PORT: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#06b6d4" stroke="#ffffff" stroke-width="2"/>
        <text x="20" y="26" font-size="20" text-anchor="middle" fill="white">⚓</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 }
  },
  SELECTED: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
        <circle cx="24" cy="24" r="6" fill="#ffffff"/>
      </svg>
    `),
    scaledSize: { width: 48, height: 48 }
  },
  USER_LOCATION: {
    path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 1.5
  }
};

// Map control positions
export const CONTROL_POSITIONS = {
  TOP_LEFT: 'TOP_LEFT',
  TOP_CENTER: 'TOP_CENTER', 
  TOP_RIGHT: 'TOP_RIGHT',
  LEFT_CENTER: 'LEFT_CENTER',
  RIGHT_CENTER: 'RIGHT_CENTER',
  BOTTOM_LEFT: 'BOTTOM_LEFT',
  BOTTOM_CENTER: 'BOTTOM_CENTER',
  BOTTOM_RIGHT: 'BOTTOM_RIGHT'
};

// Animation types
export const ANIMATION = {
  BOUNCE: 'BOUNCE',
  DROP: 'DROP'
};