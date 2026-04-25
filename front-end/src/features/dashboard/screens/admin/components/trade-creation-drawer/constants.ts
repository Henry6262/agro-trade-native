import { Package, Users, Truck, TrendingUp, Send } from 'lucide-react-native';
import { Dimensions } from 'react-native';

export const { height: screenHeight } = Dimensions.get('window');

export const DIVIDER = {
  height: 1,
  backgroundColor: 'rgba(255,255,255,0.08)',
  marginVertical: 10,
} as const;

export const STEPS = [
  { id: 1, title: 'Review Order', icon: Package },
  { id: 2, title: 'Find Sellers', icon: Users },
  { id: 3, title: 'Plan Transport', icon: Truck },
  { id: 4, title: 'Calculate Profit', icon: TrendingUp },
  { id: 5, title: 'Send Offers', icon: Send },
] as const;
