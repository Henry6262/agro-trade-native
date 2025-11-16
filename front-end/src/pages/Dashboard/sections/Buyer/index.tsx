import React from 'react';
import type { BuyerDashboardSectionProps } from './types';
import BuyerOrdersFeature from './features/Orders';
import BuyerRequestsTab from '../../../features/dashboard/screens/buyer/BuyerRequestsTab';

export function BuyerDashboardSection({ activeTab = 'orders' }: BuyerDashboardSectionProps) {
  if (activeTab === 'requests') {
    return <BuyerRequestsTab />;
  }

  return <BuyerOrdersFeature />;
}

export default BuyerDashboardSection;
