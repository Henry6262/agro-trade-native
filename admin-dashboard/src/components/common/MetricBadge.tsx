import React from 'react';

export interface MetricBadgeProps {
  icon: string;
  value: string | number;
  unit?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

/**
 * MetricBadge - Reusable badge component for displaying metrics
 *
 * Used across buyer/seller cards for quantity, price, quality grade, etc.
 */
export const MetricBadge: React.FC<MetricBadgeProps> = ({
  icon,
  value,
  unit,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-gray-100 text-text-primary',
    primary: 'bg-primary text-text-primary',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  const styles = variantStyles[variant];

  return (
    <span
      className={`text-xs font-semibold ${styles} px-2 py-1 rounded inline-flex items-center gap-1 ${className}`}
    >
      <span>{icon}</span>
      <span>
        {value}
        {unit && ` ${unit}`}
      </span>
    </span>
  );
};

export default MetricBadge;
