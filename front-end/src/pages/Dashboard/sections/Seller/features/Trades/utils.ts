import { Calendar, Truck, MapPin, CheckCircle, Package, Clock } from 'lucide-react-native';
import type { TradeStage } from './types';

export const getStatusColorClass = (status: string) => {
  switch (status) {
    case 'Deal Accepted':
    case 'Scheduled':
      return 'bg-blue-500';
    case 'Awaiting Departure':
      return 'bg-orange-500';
    case 'Traveling':
      return 'bg-purple-500';
    case 'At Location':
      return 'bg-indigo-500';
    case 'Completed':
      return 'bg-green-600';
    default:
      return 'bg-neutral-500';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Deal Accepted':
      return Package;
    case 'Awaiting Departure':
      return Clock;
    case 'Traveling':
      return Truck;
    case 'At Location':
      return MapPin;
    case 'Completed':
      return CheckCircle;
    case 'Scheduled':
      return Calendar;
    default:
      return Package;
  }
};

export const getTradeStages = (): TradeStage[] => [
  { name: 'Scheduled', description: 'Pickup scheduled', icon: Calendar },
  { name: 'Traveling', description: 'Driver en route', icon: Truck },
  { name: 'Arrived', description: 'At pickup location', icon: MapPin },
  { name: 'Completed', description: 'Goods delivered', icon: CheckCircle },
];

export const deriveStageFromStatus = (status?: string | null): number => {
  switch (status) {
    case 'Traveling':
      return 1;
    case 'Arrived':
    case 'At Location':
      return 2;
    case 'Completed':
      return 3;
    default:
      return 0;
  }
};

const FLAG_MAP: Record<string, string> = {
  'United States': '🇺🇸',
  USA: '🇺🇸',
  Canada: '🇨🇦',
  Germany: '🇩🇪',
  France: '🇫🇷',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  Singapore: '🇸🇬',
  Japan: '🇯🇵',
  China: '🇨🇳',
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Netherlands: '🇳🇱',
};

export const getBuyerFlag = (country?: string | null): string =>
  country ? (FLAG_MAP[country] ?? '🌍') : '🌍';
