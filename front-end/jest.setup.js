// Test setup for React Native Testing Library
// Mocks for native modules that break in Jest/jsdom environment

// ─── Expo Modules Core ───
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  EventEmitter: class EventEmitter {
    addListener() {
      return { remove: jest.fn() };
    }
    removeAllListeners() {}
  },
  requireNativeModule: jest.fn(() => ({})),
  requireOptionalNativeModule: jest.fn(() => ({})),
}));

// ─── Expo Linear Gradient ───
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// ─── Async Storage ───
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// ─── Expo Status Bar ───
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// ─── Expo Secure Store ───
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// ─── Expo Notifications ───
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
}));

// ─── Expo Location ───
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestBackgroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 0, longitude: 0 } })
  ),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
}));

// ─── Expo Image Picker ───
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
}));

// ─── Expo Camera ───
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: { back: 'back', front: 'front' },
  FlashMode: { on: 'on', off: 'off', auto: 'auto' },
}));

// ─── Expo Web Browser ───
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'dismiss' })),
  maybeCompleteAuthSession: jest.fn(),
}));

// ─── Expo Localization ───
jest.mock('expo-localization', () => ({
  locale: 'en-US',
  locales: ['en-US'],
}));

// ─── React Native Gesture Handler ───
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
  State: {},
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
}));

// ─── React Native Safe Area Context ───
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// ─── React Native NetInfo ───
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// ─── Sentry ───
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (component) => component,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// ─── Privy ───
jest.mock('@privy-io/expo', () => ({
  PrivyProvider: 'PrivyProvider',
  usePrivy: jest.fn(() => ({
    user: null,
    isReady: true,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

jest.mock('@privy-io/expo/ui', () => ({
  PrivyElements: 'PrivyElements',
}));

// ─── React Native Reanimated ───
jest.mock('react-native-reanimated', () => ({
  default: {
    call: jest.fn(),
    createAnimatedComponent: (component) => component,
    Value: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    eq: jest.fn(),
    set: jest.fn(),
    cond: jest.fn(),
    interpolate: jest.fn(),
    Extrapolate: { CLAMP: 'clamp' },
  },
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((val) => val),
  withTiming: jest.fn((val) => val),
  Easing: {
    in: jest.fn(),
    out: jest.fn(),
    inOut: jest.fn(),
  },
}));

// ─── React Native Maps ───
jest.mock('react-native-maps', () => ({
  default: 'MapView',
  Marker: 'Marker',
  Polyline: 'Polyline',
  Circle: 'Circle',
}));

// ─── Global mocks ───
global.mockFleetData = {
  transporterId: 'transporter-001',
  trucks: [
    {
      id: 'truck-001',
      registrationNumber: 'QTR-1234',
      capacity: 40,
      currentLocation: {
        coordinates: { latitude: 25.2654, longitude: 51.52 },
        address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
        type: 'truck_location',
      },
      status: 'available',
      lastUpdated: new Date(),
    },
    {
      id: 'truck-002',
      registrationNumber: 'QTR-5678',
      capacity: 40,
      currentLocation: {
        coordinates: { latitude: 25.2754, longitude: 51.515 },
        address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
        type: 'truck_location',
      },
      status: 'available',
      lastUpdated: new Date(),
    },
    {
      id: 'truck-003',
      registrationNumber: 'QTR-9012',
      capacity: 40,
      currentLocation: {
        coordinates: { latitude: 25.2554, longitude: 51.525 },
        address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
        type: 'truck_location',
      },
      status: 'available',
      lastUpdated: new Date(),
    },
  ],
  totalCapacity: 120,
  availableCapacity: 120,
  stats: {
    totalTrucks: 3,
    availableTrucks: 3,
    inTransitTrucks: 0,
    maintenanceTrucks: 0,
  },
};
