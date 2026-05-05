import React from 'react';
import { SellerDashboardSection } from './seller';

interface SellerDashboardScreenProps {
  activeTab?: string;
}

export default function SellerDashboardScreen({
  activeTab = 'products',
}: SellerDashboardScreenProps) {
  return <SellerDashboardSection activeTab={activeTab} />;
}
