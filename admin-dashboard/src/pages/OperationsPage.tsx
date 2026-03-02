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
          onSuccess={(tradeOpId?: string) => {
            setShowCreation(false);
            handleRefresh();
            // tradeOpId is available here for navigation to the newly created operation
            if (tradeOpId) {
              // Refresh will show the new operation in the list; it can be selected from there.
              // Future: navigate directly via router to /operations/:tradeOpId
              console.info('Created trade operation:', tradeOpId);
            }
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
