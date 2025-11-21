import type { SellerOffer } from './types';

export const getStatusColorClass = (status: SellerOffer['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-orange-500';
    case 'accepted':
      return 'bg-green-500';
    case 'rejected':
      return 'bg-red-500';
    case 'countered':
      return 'bg-blue-500';
    case 'expired':
      return 'bg-gray-500';
    default:
      return 'bg-neutral-500';
  }
};
