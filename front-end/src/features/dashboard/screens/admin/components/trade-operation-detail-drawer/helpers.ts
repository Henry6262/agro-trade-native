import { COLORS } from '@design-system';
import type { TradePhase, TradeStatus } from '../../../../../../types/trade-operations';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

export const getStatusBadgeVariant = (status: TradeStatus): StatusBadgeVariant => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PAUSED':
      return 'warning';
    case 'COMPLETED':
      return 'info';
    case 'CANCELLED':
    case 'FAILED':
      return 'danger';
    default:
      return 'muted';
  }
};

export const getSellerStatusVariant = (status: string): StatusBadgeVariant => {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    default:
      return 'warning';
  }
};

export const getInspectionStatusVariant = (status: string): StatusBadgeVariant => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'SCHEDULED':
      return 'gold';
    default:
      return 'warning';
  }
};

export const getNegotiationStatusVariant = (status: string): StatusBadgeVariant => {
  switch (status) {
    case 'ACCEPTED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'EXPIRED':
      return 'muted';
    default:
      return 'warning';
  }
};

export const getPhaseColor = (phase: TradePhase): string => {
  switch (phase) {
    case 'COMPLETED':
      return COLORS.accentGreen;
    case 'CANCELLED':
      return COLORS.danger;
    case 'IN_PROGRESS':
    case 'TRANSPORT_MATCHING':
      return COLORS.info;
    default:
      return '#F97316';
  }
};
