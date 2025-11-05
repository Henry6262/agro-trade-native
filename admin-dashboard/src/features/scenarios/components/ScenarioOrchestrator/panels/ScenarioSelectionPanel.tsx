import React from 'react';

interface ScenarioSelectionPanelProps {
  selectedScenario: string;
  executionMode: 'step' | 'auto';
  autoRunSpeed: number;
  scenarioSteps: any[];
  totalDuration: number;
  onLoadHappyPath: () => void;
  onLoadInspectionFailure: () => void;
  onLoadMultiCounter: () => void;
  onLoadPartialRejection: () => void;
  onLoadTransportBidding: () => void;
  onLoadRushOrder: () => void;
  onLoadQualityDispute: () => void;
  onLoadMultiBuyer: () => void;
  onSetExecutionMode: (mode: 'step' | 'auto') => void;
  onSetAutoRunSpeed: (speed: number) => void;
}

export const ScenarioSelectionPanel: React.FC<ScenarioSelectionPanelProps> = ({
  selectedScenario,
  executionMode,
  autoRunSpeed,
  scenarioSteps,
  totalDuration,
  onLoadHappyPath,
  onLoadInspectionFailure,
  onLoadMultiCounter,
  onLoadPartialRejection,
  onLoadTransportBidding,
  onLoadRushOrder,
  onLoadQualityDispute,
  onLoadMultiBuyer,
  onSetExecutionMode,
  onSetAutoRunSpeed,
}) => {
  const handleExportJSON = () => {
    const json = JSON.stringify(
      { scenarioName: selectedScenario, steps: scenarioSteps, totalDuration },
      null,
      2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedScenario}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const completedSteps = scenarioSteps.filter((s) => s.status === 'completed');
    const csv = [
      'Step,Actor,Action,Duration (ms),Status',
      ...completedSteps.map(
        (s) => `${s.step},"${s.actor}","${s.action}",${s.duration || 0},"${s.status}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedScenario}-metrics-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetScenario = () => {
    // This will be handled by parent component
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Select Scenario</h2>

      {/* Scenario Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={onLoadHappyPath}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'happy-path' ? 'bg-green-700' : 'bg-green-600'
          }`}
        >
          Happy Path (22 steps)
        </button>
        <button
          onClick={onLoadInspectionFailure}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'inspection-failure' ? 'bg-orange-700' : 'bg-orange-600'
          }`}
        >
          Inspection Failure (27 steps)
        </button>
        <button
          onClick={onLoadMultiCounter}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'multi-counter' ? 'bg-purple-700' : 'bg-purple-600'
          }`}
        >
          Multi Counter-Offer (21 steps)
        </button>
        <button
          onClick={onLoadPartialRejection}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'partial-rejection' ? 'bg-red-700' : 'bg-red-600'
          }`}
        >
          Partial Rejection (26 steps)
        </button>
        <button
          onClick={onLoadTransportBidding}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'transport-bidding' ? 'bg-blue-700' : 'bg-blue-600'
          }`}
        >
          Transport Bidding (26 steps)
        </button>
        <button
          onClick={onLoadRushOrder}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'rush-order' ? 'bg-yellow-700' : 'bg-yellow-600'
          }`}
        >
          Rush Order (19 steps)
        </button>
        <button
          onClick={onLoadQualityDispute}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'quality-dispute' ? 'bg-pink-700' : 'bg-pink-600'
          }`}
        >
          Quality Dispute (28 steps)
        </button>
        <button
          onClick={onLoadMultiBuyer}
          className={`px-4 py-2 text-white rounded-md hover:opacity-90 ${
            selectedScenario === 'multi-buyer' ? 'bg-indigo-700' : 'bg-indigo-600'
          }`}
        >
          Multi-Buyer (32 steps)
        </button>
      </div>

      {/* Execution Mode and Controls */}
      {selectedScenario && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Execution Mode
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => onSetExecutionMode('step')}
                className={`px-4 py-2 rounded-md ${
                  executionMode === 'step'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                Step-by-Step
              </button>
              <button
                onClick={() => onSetExecutionMode('auto')}
                className={`px-4 py-2 rounded-md ${
                  executionMode === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                Auto-Run
              </button>
            </div>
          </div>

          {/* Auto-Run Speed Control */}
          {executionMode === 'auto' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Run Speed
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="200"
                  value={autoRunSpeed}
                  onChange={(e) => onSetAutoRunSpeed(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600">
                  {(autoRunSpeed / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          )}

          {/* Advanced Controls */}
          <div className="flex gap-3 items-center flex-wrap">
            <button
              onClick={handleExportJSON}
              disabled={scenarioSteps.length === 0}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
            >
              Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              disabled={scenarioSteps.filter((s) => s.status === 'completed').length === 0}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              Export CSV
            </button>
            <button
              onClick={handleResetScenario}
              disabled={scenarioSteps.filter((s) => s.status !== 'pending').length === 0}
              className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
            >
              Reset Scenario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
