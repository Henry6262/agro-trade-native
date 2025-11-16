import type { LucideIcon } from 'lucide-react-native';
import type { SellerOffer, SellerOfferStats } from '../../../../../../services/sellerOfferService';

export type { SellerOffer, SellerOfferStats };

export interface OfferStatCard {
  id: string;
  label: string;
  value: string;
  Icon: LucideIcon;
  iconColor: string;
  subLabel?: string;
}
