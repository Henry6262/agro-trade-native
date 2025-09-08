import React from 'react';
import { View } from 'react-native';
import SellerProductsTab from './SellerProductsTab';
import SellerTradesTab from './SellerTradesTab';
import SellerOffersTab from './SellerOffersTab';

interface SellerDashboardScreenProps {
  activeTab?: string;
}

export default function SellerDashboardScreen({ activeTab = 'products' }: SellerDashboardScreenProps) {
  // Render the appropriate tab based on activeTab prop
  // Note: 'intelligence' is handled separately in DashboardMainScreen
  
  if (activeTab === 'offers') {
    return <SellerOffersTab />;
  }
  
  if (activeTab === 'trades') {
    return <SellerTradesTab />;
  }
  
  // Default to products tab
  return <SellerProductsTab />;
}