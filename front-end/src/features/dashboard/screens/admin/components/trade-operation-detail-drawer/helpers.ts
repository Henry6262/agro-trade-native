import { COLORS } from '@design-system';
import { TradePhase, TradeStatus } from '../../../../../../types/trade-operations';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold';

export const getStatusBadgeVariant = (status: TradeStatus): StatusBadgeVariant => {
  switch (status) {
    case TradeStatus.ACTIVE:
      return 'success';
    case TradeStatus.PAUSED:
      return 'warning';
    case TradeStatus.COMPLETED:
      return 'info';
    case TradeStatus.CANCELLED:
    case TradeStatus.FAILED:
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
    case TradePhase.COMPLETED:
      return COLORS.accentGreen;
    case TradePhase.CANCELLED:
      return COLORS.danger;
    case TradePhase.IN_PROGRESS:
    case TradePhase.TRANSPORT_MATCHING:
      return COLORS.info;
    default:
      return '#F97316';
  }
};
