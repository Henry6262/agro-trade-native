import { useSellerOffers } from '../../../../../../shared/hooks/useSellerOffers';
import { useMemo } from 'react';
import { Clock, CheckCircle, DollarSign } from 'lucide-react-native';
import type { OfferStatCard } from '../types';

export const useSellerOffersFeature = () => {
  const data = useSellerOffers();

  const statsCards: OfferStatCard[] = useMemo(
    () => [
      {
        id: 'pending',
        label: 'Pending',
        value: String(data.stats.pendingOffers ?? 0),
        Icon: Clock,
        iconColor: '#fb923c',
        subLabel: 'Awaiting action',
      },
      {
        id: 'accepted',
        label: 'Accepted',
        value: String(data.stats.acceptedThisMonth ?? 0),
        Icon: CheckCircle,
        iconColor: '#60a5fa',
        subLabel: 'This month',
      },
      {
        id: 'avg',
        label: 'Avg Value',
        value: `$${((data.stats.averageOfferValue ?? 0) / 1000).toFixed(1)}k`,
        Icon: DollarSign,
        iconColor: '#8b5cf6',
        subLabel: 'Per offer',
      },
    ],
    [data.stats.acceptedThisMonth, data.stats.averageOfferValue, data.stats.pendingOffers]
  );

  return {
    ...data,
    statsCards,
  };
};
