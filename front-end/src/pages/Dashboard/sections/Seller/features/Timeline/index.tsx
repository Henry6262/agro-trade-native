import React from 'react';
import { SellerTimeline } from './components';
import { useSellerTimeline } from './hooks';

export default function SellerTimelineFeature() {
  const { events, isLoading, refresh } = useSellerTimeline();

  return <SellerTimeline events={events} isLoading={isLoading} onRefresh={refresh} />;
}
