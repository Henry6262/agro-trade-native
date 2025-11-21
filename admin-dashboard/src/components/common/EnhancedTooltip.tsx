import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EnhancedTooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className = '',
}) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className={className}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
