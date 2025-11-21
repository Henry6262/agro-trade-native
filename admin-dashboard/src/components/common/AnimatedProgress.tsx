import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  animationDuration?: number;
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  className = '',
  showLabel = true,
  animationDuration = 1000,
  colorScheme = 'default',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const duration = animationDuration;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = percentage / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setDisplayValue((prev) => Math.min(prev + increment, percentage));

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(percentage);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [percentage, animationDuration]);

  const getColorClass = () => {
    if (colorScheme !== 'default') {
      const colors = {
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
      };
      return colors[colorScheme];
    }

    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">
            {value.toFixed(1)}/{max.toFixed(1)}
          </span>
          <span className="text-sm font-bold text-text-primary">{displayValue.toFixed(1)}%</span>
        </div>
      )}
      <div className="relative w-full h-8 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
        <div
          className={`h-full transition-all duration-300 ease-out ${getColorClass()} flex items-center justify-center text-white text-xs font-bold`}
          style={{ width: `${displayValue}%` }}
        >
          {displayValue > 10 && `${displayValue.toFixed(0)}%`}
        </div>
      </div>
    </div>
  );
};

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setDisplayValue((prev) => Math.min(prev + increment, value));

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};
