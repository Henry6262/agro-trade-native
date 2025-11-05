import React from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Zap, Grid } from 'lucide-react';

interface ControlsPanelProps {
  // Scenario state
  selectedScenario: string;
  scenarioName: string;
  scenarioDescription: string;
  stepsCount: number;

  // Execution state
  isRunning: boolean;
  isComplete: boolean;
  currentStep: number;
  totalSteps: number;
  executionMode: 'manual' | 'auto';
  executionSpeed: number;
  activeView: 'flow' | 'database';

  // Handlers
  onOpenScenarioModal: () => void;
  onExecutionModeChange: (mode: 'manual' | 'auto') => void;
  onExecutionSpeedChange: (speed: number) => void;
  onActiveViewChange: (view: 'flow' | 'database') => void;
  onStart: () => void;
  onPause: () => void;
  onNext: () => void;
  onReset: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  selectedScenario,
  scenarioName,
  scenarioDescription,
  stepsCount,
  isRunning,
  isComplete,
  currentStep,
  totalSteps,
  executionMode,
  executionSpeed,
  activeView,
  onOpenScenarioModal,
  onExecutionModeChange,
  onExecutionSpeedChange,
  onActiveViewChange,
  onStart,
  onPause,
  onNext,
  onReset,
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-800">Scenario Testing</h1>

            {/* Scenario Selection Button */}
            <button
              onClick={onOpenScenarioModal}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Grid size={18} />
              <span className="font-semibold">{scenarioName}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {stepsCount} steps
              </span>
            </button>

            <span className="text-sm text-gray-600 italic">
              {scenarioDescription}
            </span>
          </div>

          {/* Clean Control Panel */}
          <div className="flex items-center gap-3">
            {/* Execution Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onExecutionModeChange('manual')}
                className={`px-3 py-1 text-sm font-medium rounded transition ${
                  executionMode === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => onExecutionModeChange('auto')}
                className={`px-3 py-1 text-sm font-medium rounded transition ${
                  executionMode === 'auto'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Auto
              </button>
            </div>

            {/* Speed Control (only in auto mode) */}
            {executionMode === 'auto' && (
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-gray-500" />
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="500"
                  value={executionSpeed}
                  onChange={(e) => onExecutionSpeedChange(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-gray-500 w-12">{executionSpeed / 1000}s</span>
              </div>
            )}

            {/* Action Buttons */}
            {!isRunning && !isComplete && (
              <button
                onClick={onStart}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Play size={16} />
                <span className="text-sm font-medium">Start</span>
              </button>
            )}

            {isRunning && executionMode === 'auto' && (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-4 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                <Pause size={16} />
                <span className="text-sm font-medium">Pause</span>
              </button>
            )}

            {!isRunning && executionMode === 'manual' && currentStep < totalSteps && (
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <ChevronRight size={16} />
                <span className="text-sm font-medium">Next Step</span>
              </button>
            )}

            <button
              onClick={onReset}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition"
            >
              <RotateCcw size={16} />
              <span className="text-sm font-medium">Reset</span>
            </button>

            {/* View Toggle Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onActiveViewChange('flow')}
                className={`px-3 py-1 text-sm font-medium rounded transition ${
                  activeView === 'flow'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🔄 Flow
              </button>
              <button
                onClick={() => onActiveViewChange('database')}
                className={`px-3 py-1 text-sm font-medium rounded transition ${
                  activeView === 'database'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🗄️ Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
