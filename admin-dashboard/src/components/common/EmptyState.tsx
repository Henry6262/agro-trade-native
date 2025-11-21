import React from 'react';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Consistent empty state display across the app
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action,
}) => {
  return (
    <div className="text-center py-12 px-6">
      <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
        <span className="text-5xl opacity-50">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-6 py-2 bg-primary hover:bg-primary-hover text-text-primary rounded font-medium transition"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
