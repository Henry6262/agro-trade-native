import React from 'react';
import { TransporterBiddingTab } from './components/TransporterBiddingTab';
import { TransporterTransfersTab } from './components/TransporterTransfersTab';
import { TransporterFleetTab } from './components/TransporterFleetTab';

interface TransporterDashboardScreenProps {
  activeTab?: string;
}

export default function TransporterDashboardScreen({ activeTab = 'bidding' }: TransporterDashboardScreenProps) {
  // Render the appropriate tab based on activeTab prop
  // Note: 'intelligence' is handled separately in DashboardMainScreen
  
  if (activeTab === 'transfers') {
    return <TransporterTransfersTab />;
  }
  
  if (activeTab === 'fleet') {
    return <TransporterFleetTab />;
  }
  
  // Default to bidding tab
  return <TransporterBiddingTab />;
}