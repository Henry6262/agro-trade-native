import React from 'react';
import { View, Text } from 'react-native';
import type { SellerDashboardSectionProps } from './types';
import SellerProductsFeature from './features/Products';
import SellerOffersTab from './features/Offers';
import SellerTradesTab from './features/Trades';

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
