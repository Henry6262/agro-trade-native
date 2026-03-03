import { getApiUrl } from '../utils/environment';

// App-wide constants
export const APP_CONFIG = {
  get API_URL() {
    return getApiUrl();
  },
  APP_NAME: 'AgroTrade',
  VERSION: '1.0.0',
} as const;

export const COLORS = {
  primary: '#22C55E',
  secondary: '#16A34A',
  accent: '#F59E0B',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
