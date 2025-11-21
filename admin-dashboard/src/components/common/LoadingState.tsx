import React from 'react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * LoadingState - Consistent loading indicator across the app
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`${sizeClasses[size]} text-center`}>
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
