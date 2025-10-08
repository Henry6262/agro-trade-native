import React from 'react';

interface ScenarioStep {
  step: number;
  description: string;
  actor: string;
  action: string;
  payload?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
}

interface EnhancedStepCardProps {
  step: ScenarioStep;
  index: number;
}

export const EnhancedStepCard: React.FC<EnhancedStepCardProps> = ({ step, index }) => {
  const getStatusColor = () => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-50 border-green-300';
      case 'in_progress':
        return 'bg-blue-50 border-blue-300 animate-pulse';
      case 'failed':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  const getStatusBadge = () => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-200 text-green-800';
      case 'in_progress':
        return 'bg-blue-200 text-blue-800';
      case 'failed':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getActorBadgeColor = () => {
    switch (step.actor) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'BUYER':
        return 'bg-blue-100 text-blue-700';
      case 'FARMER':
        return 'bg-green-100 text-green-700';
      case 'TRANSPORTER':
        return 'bg-orange-100 text-orange-700';
      case 'INSPECTOR':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`p-4 rounded-md border ${getStatusColor()}`}>
      {/* Header Row */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-600">#{step.step}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActorBadgeColor()}`}>
            {step.actor}
          </span>
          <span className="text-xs text-gray-500">{step.action}</span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge()}`}>
          {step.status.replace('_', ' ')}
        </span>
      </div>

      {/* Description */}
      <div className="text-sm text-gray-800 mb-2">{step.description}</div>

      {/* Metrics Row */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        {step.duration !== undefined && (
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{(step.duration / 1000).toFixed(2)}s</span>
          </div>
        )}

        {step.result && (
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-green-600">Result available</span>
          </div>
        )}

        {step.error && (
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-600">Error</span>
          </div>
        )}
      </div>

      {/* Expandable Result/Error */}
      {step.result && step.status === 'completed' && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
            View result
          </summary>
          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto border border-gray-200">
            {JSON.stringify(step.result, null, 2)}
          </pre>
        </details>
      )}

      {step.error && (
        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
          <div className="text-xs font-medium text-red-800 mb-1">Error:</div>
          <div className="text-xs text-red-700">{step.error}</div>
        </div>
      )}

      {/* Payload Preview */}
      {step.payload && step.status === 'pending' && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
            View payload
          </summary>
          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto border border-gray-200">
            {JSON.stringify(step.payload, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
