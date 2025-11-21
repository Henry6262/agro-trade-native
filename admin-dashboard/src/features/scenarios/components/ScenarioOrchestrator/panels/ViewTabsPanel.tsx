import React from 'react';

type ViewType = 'execution' | 'flow' | 'database' | 'builder';

interface ViewTabsPanelProps {
  activeView: ViewType;
  onChangeView: (view: ViewType) => void;
  hasScenarioSteps: boolean;
}

export const ViewTabsPanel: React.FC<ViewTabsPanelProps> = ({
  activeView,
  onChangeView,
  hasScenarioSteps,
}) => {
  if (!hasScenarioSteps) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => onChangeView('execution')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeView === 'execution'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Execution
        </button>
        <button
          onClick={() => onChangeView('flow')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeView === 'flow'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🔄 Flow Diagram
        </button>
        <button
          onClick={() => onChangeView('database')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeView === 'database'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🗄️ Database
        </button>
        <button
          onClick={() => onChangeView('builder')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeView === 'builder'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🛠️ Builder
        </button>
      </div>
    </div>
  );
};
