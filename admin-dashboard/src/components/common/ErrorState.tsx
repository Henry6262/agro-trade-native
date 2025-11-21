import React from 'react';

export interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * ErrorState - Consistent error display with optional retry button
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  retryLabel = 'Retry',
}) => {
  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-red-600 text-sm font-medium mb-2">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 text-sm text-red-700 underline hover:text-red-900 font-medium transition"
              >
                {retryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
