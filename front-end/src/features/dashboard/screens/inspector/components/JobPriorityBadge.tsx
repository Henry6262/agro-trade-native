import React from 'react';
import { View } from 'react-native';
import { GlassBadge } from '@design-system';
import { JobPriorityBadgeProps } from '../types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

const PRIORITY_TO_VARIANT: Record<string, BadgeVariant> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'muted',
  URGENT: 'danger',
};

export const JobPriorityBadge: React.FC<JobPriorityBadgeProps> = ({
  priority,
  size = 'medium',
}) => {
  const variant: BadgeVariant = PRIORITY_TO_VARIANT[priority] ?? 'muted';
  const badgeSize = size === 'small' ? 'sm' : 'md';

  return (
    <View testID="priority-badge">
      <GlassBadge label={priority} variant={variant} size={badgeSize} />
    </View>
  );
};
