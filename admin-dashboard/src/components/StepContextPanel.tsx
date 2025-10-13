import React from 'react';
import type { ScenarioStep } from '../types/scenario';
import { BusinessDataExtractor, type BusinessContext } from '../services/businessDataExtractor';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

interface StepContextPanelProps {
  step: ScenarioStep | null;
  stepNumber: number;
  totalSteps: number;
  isComplete: boolean;
}

export const StepContextPanel: React.FC<StepContextPanelProps> = ({
  step,
  stepNumber,
  totalSteps,
  isComplete,
}) => {
  if (!step && !isComplete) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-gray-700">Ready to Start</h3>
          <p className="text-gray-500 mt-2">Select a scenario and click Start to begin</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-600">Scenario Complete!</h3>
          <p className="text-gray-600 mt-2">All {totalSteps} steps executed successfully</p>
          <div className="mt-6 space-y-2 text-left inline-block">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-gray-700">Users created and verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-gray-700">Trade negotiations completed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-gray-700">Quality inspections passed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-gray-700">Goods delivered successfully</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  const context: BusinessContext = BusinessDataExtractor.extractContext(step, step.result);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'in_progress':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDetailValue = (detail: any) => {
    switch (detail.type) {
      case 'currency':
        return <span className="font-mono font-semibold text-green-600">{detail.value}</span>;
      case 'quantity':
        return <span className="font-semibold text-blue-600">{detail.value}</span>;
      case 'location':
        return <span className="text-purple-600">{detail.value}</span>;
      case 'quality':
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold">{detail.value}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${parseInt(detail.value)}%` }}
              />
            </div>
          </div>
        );
      case 'status':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {detail.value}
          </span>
        );
      default:
        return <span>{detail.value}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Step Progress Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(step.status)}
            <span className="text-sm font-medium text-gray-500">
              Step {stepNumber} of {totalSteps}
            </span>
          </div>
          {step.duration && (
            <span className="text-xs text-gray-400">{step.duration}ms</span>
          )}
        </div>
        <div className="bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Primary Actor/Action */}
      <div className="mb-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl flex-shrink-0">{context.primary.icon}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{context.primary.title}</h2>
            <p className="text-sm text-gray-500">{context.primary.subtitle}</p>
            {context.primary.role && (
              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                {context.primary.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {context.details.map((detail, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {detail.icon && <span className="text-xl">{detail.icon}</span>}
            <div className="flex-1">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                {detail.label}
              </div>
              <div className="text-sm text-gray-800">{formatDetailValue(detail)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Message */}
      {context.status && (
        <div className={`mt-4 p-3 rounded-lg border ${getStatusBadgeColor(context.status.type)}`}>
          <div className="flex items-center gap-2">
            {context.status.type === 'success' && <CheckCircle size={16} />}
            {context.status.type === 'warning' && <AlertCircle size={16} />}
            {context.status.type === 'error' && <XCircle size={16} />}
            {context.status.type === 'info' && <Info size={16} />}
            <span className="text-sm font-medium">{context.status.message}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {step.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <XCircle className="text-red-500 flex-shrink-0" size={20} />
            <div>
              <div className="text-sm font-medium text-red-800">Execution Failed</div>
              <div className="text-xs text-red-600 mt-1">{step.error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};