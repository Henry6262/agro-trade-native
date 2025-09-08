import React from 'react';
import BuyerOrdersTab from './BuyerOrdersTab';
import BuyerRequestsTab from './BuyerRequestsTab';

interface BuyerDashboardScreenProps {
  activeTab?: string;
}

export default function BuyerDashboardScreen({ activeTab = 'orders' }: BuyerDashboardScreenProps) {
  // Render the appropriate tab based on activeTab prop
  // Note: 'intelligence' is handled separately in DashboardMainScreen
  
  if (activeTab === 'requests') {
    return <BuyerRequestsTab />;
  }
  
  // Default to orders tab
  return <BuyerOrdersTab />;
}