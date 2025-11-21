import React from 'react';
import { View, Text } from 'react-native';
import type { SellerDashboardSectionProps } from './types';
// Temporary bridge: reuse legacy seller tabs for offers/trades until full migration lands
import SellerProductsFeature from './features/Products';
import SellerOffersTab from '../../../../features/dashboard/screens/seller/SellerOffersTab';
import SellerTradesTab from '../../../../features/dashboard/screens/seller/SellerTradesTab';

export function SellerDashboardSection({ activeTab = 'products' }: SellerDashboardSectionProps) {
  if (activeTab === 'offers') {
    return <SellerOffersTab />;
  }

  if (activeTab === 'trades') {
    return <SellerTradesTab />;
  }

  if (activeTab === 'products') {
    return <SellerProductsFeature />;
  }

  return (
    <View>
      <Text>Seller dashboard section placeholder</Text>
    </View>
  );
}

export default SellerDashboardSection;
