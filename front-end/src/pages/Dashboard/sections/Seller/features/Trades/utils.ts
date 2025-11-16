import { Calendar, Truck, MapPin, CheckCircle, Package, Clock } from 'lucide-react-native';
import type { EarningsSummary, SellerTrade, TradeStage } from './types';

export const mockEarningsSummary: EarningsSummary = {
  totalEarnings: 156750,
  monthlyEarnings: 28500,
  completedTrades: 47,
  averagePerTrade: 3335,
  topProduct: 'Premium Wheat',
  growthRate: 23.5,
};

export const mockTraderTrades: SellerTrade[] = [
  {
    id: 'T001',
    product: 'Premium Wheat',
    quantity: 25,
    agreedPricePerTon: 280,
    buyer: 'GrainCorp Ltd',
    buyerLocation: 'Chicago, IL',
    buyerFlag: '🇺🇸',
    transporter: 'FastHaul Logistics',
    transporterTrucks: 3,
    licensePlate: 'TRK-4521',
    status: 'Awaiting Departure',
    pickupDate: '2025-01-25',
    estimatedDeparture: '2025-01-24 08:00',
    price: 7000,
    currentStage: 1,
  },
  {
    id: 'T002',
    product: 'Corn Grain',
    quantity: 40,
    agreedPricePerTon: 220,
    buyer: 'FeedMaster Co',
    buyerLocation: 'Kansas City, MO',
    buyerFlag: '🇺🇸',
    transporter: 'AgriTransport',
    transporterTrucks: 2,
    licensePlate: 'AGR-7834',
    status: 'Traveling',
    pickupDate: '2025-01-22',
    estimatedDeparture: '2025-01-22 10:00',
    price: 8800,
    currentStage: 2,
  },
];

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
