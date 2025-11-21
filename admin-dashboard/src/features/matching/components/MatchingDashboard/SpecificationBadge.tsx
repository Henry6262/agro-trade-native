import React from 'react';
import type { Specification } from '../../../../utils/specificationHelpers';
import { formatSpecValue, getSpecDisplayName, getSpecCode, getSpecTooltip } from '../../../../utils/specificationHelpers';
import { getSpecTheme } from '../../../../styles/designSystem';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpecificationBadgeProps {
  spec: Specification;
  variant?: 'compact' | 'detailed';
}

export const SpecificationBadge: React.FC<SpecificationBadgeProps> = ({
  spec,
  variant = 'compact'
}) => {
  const displayName = getSpecDisplayName(spec);
  const value = formatSpecValue(spec);
  const code = getSpecCode(spec);
  const theme = getSpecTheme(code);
  const tooltip = getSpecTooltip(code, value);

  if (variant === 'compact') {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-300 transition-all hover:bg-gray-200 cursor-help">
              <span className="text-sm">{theme.emoji}</span>
              <span>{value}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3" side="top">
            <div className="space-y-2">
              <p className="font-bold text-sm">{tooltip.title}</p>
              <p className="text-xs text-gray-700">{tooltip.description}</p>
              {tooltip.ranges && tooltip.ranges.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Quality Ranges:</p>
                  <ul className="space-y-0.5">
                    {tooltip.ranges.map((range, idx) => (
                      <li key={idx} className="text-xs text-gray-600">• {range}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex flex-col bg-gray-100 text-gray-800 text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition-all hover:bg-gray-200 cursor-help">
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <span className="text-base">{theme.emoji}</span>
              <span>{theme.label}</span>
            </div>
            <div className="text-sm font-semibold">{value}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3" side="top">
          <div className="space-y-2">
            <p className="font-bold text-sm">{tooltip.title}</p>
            <p className="text-xs text-gray-700">{tooltip.description}</p>
            {tooltip.ranges && tooltip.ranges.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-1">Quality Ranges:</p>
                <ul className="space-y-0.5">
                  {tooltip.ranges.map((range, idx) => (
                    <li key={idx} className="text-xs text-gray-600">• {range}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SpecificationBadge;
