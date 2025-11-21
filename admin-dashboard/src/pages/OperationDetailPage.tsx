import React from 'react';
import { AppLayout } from '../components/layout';
import { TradeOperationDetail } from '../features/operations/components/TradeOperationDetail';

export const OperationDetailPage: React.FC = () => {
  return (
    <AppLayout fullWidth>
      <TradeOperationDetail />
    </AppLayout>
  );
};

export default OperationDetailPage;
