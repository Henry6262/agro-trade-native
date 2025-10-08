import React from 'react';
import { TransporterBiddingTab } from './components/TransporterBiddingTab';
import { TransporterIncomingOffersTab } from './components/TransporterIncomingOffersTab';
import { TransporterTransfersTab } from './components/TransporterTransfersTab';
import { TransporterFleetTab } from './components/TransporterFleetTab';
import { TransporterActiveJobsTab } from './components/TransporterActiveJobsTab';

interface TransporterDashboardScreenProps {
  activeTab?: string;
}

export default function TransporterDashboardScreen({ activeTab = 'offers' }: TransporterDashboardScreenProps) {
  // Render the appropriate tab based on activeTab prop
  // Note: 'intelligence' is handled separately in DashboardMainScreen
  
  if (activeTab === 'offers') {
    return <TransporterIncomingOffersTab />;
  }
  
  if (activeTab === 'jobs') {
    return <TransporterActiveJobsTab />;
  }
  
  if (activeTab === 'transfers') {
    return <TransporterTransfersTab />;
  }
  
  if (activeTab === 'fleet') {
    return <TransporterFleetTab />;
  }
  
  if (activeTab === 'bidding') {
    return <TransporterBiddingTab />;
  }
  
  // Default to offers tab
  return <TransporterIncomingOffersTab />;
}