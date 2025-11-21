import React from 'react';
import { ProgressDashboard } from '../../shared/ProgressDashboard';
import { EnhancedStepCard } from '../../shared/EnhancedStepCard';
import { MetricsSidebar } from '../../shared/MetricsSidebar';
import type { ScenarioStep } from '../../../../../types/scenario';

interface ExecutionPanelProps {
  selectedScenario: string;
  scenarioSteps: ScenarioStep[];
  currentStep: number;
  isRunning: boolean;
  totalDuration: number;
  executionMode: 'step' | 'auto';
  breakpoints: Set<number>;
  onExecuteNextStep: () => void;
  onAutoRunScenario: () => void;
  onToggleBreakpoint: (stepIndex: number) => void;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  selectedScenario,
  scenarioSteps,
  currentStep,
  isRunning,
  totalDuration,
  executionMode,
  breakpoints,
  onExecuteNextStep,
  onAutoRunScenario,
  onToggleBreakpoint,
}) => {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left Column - Steps */}
      <div className="col-span-2 space-y-6">
        {/* Progress Dashboard */}
        <ProgressDashboard
          scenarioName={selectedScenario
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())}
          steps={scenarioSteps}
          currentStepIndex={currentStep}
          isRunning={isRunning}
          totalDuration={totalDuration}
        />

        {/* Scenario Steps */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Scenario Steps ({currentStep}/{scenarioSteps.length})
            </h2>
            <div className="flex gap-2">
              {executionMode === 'step' ? (
                <button
                  onClick={onExecuteNextStep}
                  disabled={currentStep >= scenarioSteps.length || isRunning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Execute Next Step
                </button>
              ) : (
                <button
                  onClick={onAutoRunScenario}
                  disabled={isRunning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isRunning ? 'Running...' : 'Auto-Run All Steps'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scenarioSteps.map((step, index) => (
              <div key={index} className="relative">
                {/* Breakpoint indicator */}
                <button
                  onClick={() => onToggleBreakpoint(index)}
                  className={`absolute -left-6 top-3 w-4 h-4 rounded-full border-2 ${
                    breakpoints.has(index)
                      ? 'bg-red-500 border-red-600'
                      : 'bg-white border-gray-300 hover:border-red-400'
                  }`}
                  title={
                    breakpoints.has(index) ? 'Remove breakpoint' : 'Add breakpoint'
                  }
                />
                <EnhancedStepCard step={step} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Metrics Sidebar */}
      <div className="col-span-1">
        <MetricsSidebar steps={scenarioSteps} totalDuration={totalDuration} />
      </div>
    </div>
  );
};
