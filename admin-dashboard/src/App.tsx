import React, { useState } from 'react';
import { TradeOperationsTable } from './components/TradeOperationsTable';
import { TradeCreationWizard } from './components/TradeCreationWizard';
import { TradeDetails } from './components/TradeDetails';
import { ScenarioOrchestrator } from './components/ScenarioOrchestrator';
import * as Types from './types';
import { Package, FlaskConical } from 'lucide-react';

type View = 'operations' | 'scenarios';

function App() {
  const [currentView, setCurrentView] = useState<View>('operations');
  const [showCreation, setShowCreation] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Types.TradeOperation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Agro-Trade Admin
              </h1>
              <div className="ml-4 flex gap-2">
                <button
                  onClick={() => setCurrentView('operations')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    currentView === 'operations'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Trade Operations
                </button>
                <button
                  onClick={() => setCurrentView('scenarios')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                    currentView === 'scenarios'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FlaskConical className="w-3 h-3" />
                  Scenarios
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Admin Dashboard v1.0
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'operations' ? (
          <TradeOperationsTable
            key={refreshKey}
            onSelectOperation={setSelectedOperation}
            onCreateNew={() => setShowCreation(true)}
          />
        ) : (
          <ScenarioOrchestrator />
        )}
      </main>

      {/* Modals */}
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
    </div>
  );
}

export default App;