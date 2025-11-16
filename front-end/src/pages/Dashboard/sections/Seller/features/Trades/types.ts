import type { LucideIcon } from 'lucide-react-native';

export interface SellerTrade {
  id: string;
  product: string;
  quantity: number;
  agreedPricePerTon: number;
  buyer: string;
  buyerLocation: string;
  buyerFlag: string;
  transporter: string;
  transporterTrucks: number;
  licensePlate: string;
  status: string;
  pickupDate: string;
  estimatedDeparture: string;
  price: number;
  currentStage: number;
}

export interface EarningsSummary {
  totalEarnings: number;
  monthlyEarnings: number;
  completedTrades: number;
  averagePerTrade: number;
  topProduct: string;
  growthRate: number;
}

export interface TradeStage {
  name: string;
  description: string;
  icon: LucideIcon;
}
