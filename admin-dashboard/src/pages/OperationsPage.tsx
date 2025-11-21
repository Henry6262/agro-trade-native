import { useState } from 'react';
import { AppLayout } from '../components/layout';
import { TradeOperationsTable } from '../features/trade-operations/components/TradeOperationsTable';
import { TradeCreationWizard } from '../features/trade-operations/components/TradeCreationWizard';
import { TradeDetails } from '../features/trade-operations/components/TradeDetails';
import * as Types from '../types';

export function OperationsPage() {
  const [showCreation, setShowCreation] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Types.TradeOperation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AppLayout>
      <TradeOperationsTable
        key={refreshKey}
        onSelectOperation={setSelectedOperation}
        onCreateNew={() => setShowCreation(true)}
      />

      {showCreation && (
        <TradeCreationWizard
          onClose={() => setShowCreation(false)}
          onSuccess={() => {
            setShowCreation(false);
            handleRefresh();
          }}
        />
      )}

      {selectedOperation && (
        <TradeDetails
          operation={selectedOperation}
          onClose={() => setSelectedOperation(null)}
          onUpdate={handleRefresh}
        />
      )}
    </AppLayout>
  );
}
