import React from 'react';
import type { TransporterDashboardSectionProps } from './types';
import TransporterOffersFeature from './features/Offers';
import { TransporterActiveJobsTab as TransporterJobsFeature } from './features/Jobs';
import TransporterTransfersFeature from './features/Transfers';
import { TransporterFleetTab as TransporterFleetFeature } from './features/Fleet';
import { TransporterBiddingTab as TransporterBiddingFeature } from './features/Bidding';

export function TransporterDashboardSection({
  activeTab = 'offers',
}: TransporterDashboardSectionProps) {
  if (activeTab === 'jobs') {
    return <TransporterJobsFeature />;
  }

  if (activeTab === 'transfers') {
    return <TransporterTransfersFeature />;
  }

  if (activeTab === 'fleet') {
    return <TransporterFleetFeature />;
  }

  if (activeTab === 'bidding') {
    return <TransporterBiddingFeature />;
  }

  return <TransporterOffersFeature />;
}

export default TransporterDashboardSection;
