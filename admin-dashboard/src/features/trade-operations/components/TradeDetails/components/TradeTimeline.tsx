import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import * as Types from '../../../../../types';
import { Badge } from '@/components/ui/badge';

interface TradeTimelineProps {
  operation: Types.TradeOperation;
  inspections: Types.InspectionRequest[];
  transport?: Types.TransportSummary;
  negotiations: Types.Negotiation[];
}

 type TimelineStatus = 'done' | 'active' | 'blocked' | 'pending';

interface TimelineItem {
  title: string;
  description: string;
  status: TimelineStatus;
  timestamp?: string;
  badge?: string;
}

const statusStyles: Record<TimelineStatus, string> = {
  done: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  active: 'border-blue-200 bg-blue-50 text-blue-800',
  pending: 'border-slate-200 bg-white text-slate-600',
  blocked: 'border-rose-200 bg-rose-50 text-rose-800',
};

const getStatusColor = (status: TimelineStatus) => {
  switch (status) {
    case 'done':
      return 'bg-emerald-500';
    case 'active':
      return 'bg-blue-500';
    case 'blocked':
      return 'bg-rose-500';
    default:
      return 'bg-slate-300';
  }
};

export const TradeTimeline: React.FC<TradeTimelineProps> = ({
  operation,
  inspections,
  transport,
  negotiations,
}) => {
  const items = useMemo<TimelineItem[]>(() => {
    const offers = operation.offers || [];
    const acceptedOffers = offers.filter((offer) => offer.status === 'accepted');
    const pendingOffers = offers.filter((offer) => offer.status === 'pending');

    const offersStatus: TimelineStatus = acceptedOffers.length
      ? 'done'
      : pendingOffers.length
      ? 'active'
      : offers.length > 0
      ? 'blocked'
      : 'pending';

    const inspectionsCompleted = inspections.filter((inspection) => inspection.status === 'COMPLETED');
    const inspectionsStatus: TimelineStatus = inspections.length === 0
      ? 'pending'
      : inspectionsCompleted.length === inspections.length
      ? 'done'
      : inspectionsCompleted.length > 0
      ? 'active'
      : 'blocked';

    const transportRequest = transport?.request;
    const transportJob = transportRequest?.job;
    let transportStatus: TimelineStatus = 'pending';
    if (!transportRequest) {
      transportStatus = 'blocked';
    } else if (transportJob?.status === 'COMPLETED') {
      transportStatus = 'done';
    } else if (transportJob || transportRequest.status === 'ASSIGNED' || transportRequest.status === 'IN_TRANSIT') {
      transportStatus = 'active';
    } else {
      transportStatus = 'pending';
    }

    const deliveryStatus: TimelineStatus =
      transportJob?.status === 'COMPLETED'
        ? 'done'
        : transportJob
        ? 'active'
        : 'pending';

    const paymentStatus: TimelineStatus =
      operation.status === Types.TradeStatus.COMPLETED || operation.phase === Types.TradePhase.PAYMENT
        ? 'done'
        : 'pending';

    const timeline: TimelineItem[] = [
      {
        title: 'Seller Offers',
        description: acceptedOffers.length
          ? `${acceptedOffers.length} offer${acceptedOffers.length === 1 ? '' : 's'} accepted`
          : offers.length
          ? `${pendingOffers.length} pending response`
          : 'Send offers to start collecting grain',
        status: offersStatus,
        timestamp: acceptedOffers[0]?.updatedAt,
      },
      {
        title: 'Inspections',
        description:
          inspections.length === 0
            ? 'Awaiting inspection requests'
            : `${inspectionsCompleted.length}/${inspections.length} completed`,
        status: inspectionsStatus,
        timestamp: inspectionsCompleted[inspectionsCompleted.length - 1]?.completedDate,
        badge:
          inspections.length > 0 && inspectionsCompleted.length !== inspections.length
            ? `${inspections.length - inspectionsCompleted.length} pending`
            : undefined,
      },
      {
        title: 'Transport',
        description: transportRequest
          ? `Status: ${transportRequest.status}`
          : 'Transport request not created yet',
        status: transportStatus,
        timestamp: transportRequest?.biddingDeadline,
        badge:
          transportRequest && (transportRequest.bids?.length ?? 0) === 0 && transportRequest.status === 'OPEN'
            ? 'Awaiting bids'
            : undefined,
      },
      {
        title: 'Delivery',
        description:
          transportJob?.status === 'COMPLETED'
            ? 'Delivery confirmed'
            : transportJob?.status
            ? `Job ${transportJob.status.toLowerCase()}`
            : 'Pending transport assignment',
        status: deliveryStatus,
        timestamp: transportJob?.actualDelivery,
      },
      {
        title: 'Payment & Finalization',
        description:
          operation.status === Types.TradeStatus.COMPLETED
            ? 'Trade finalized'
            : 'Awaiting delivery confirmation & payment',
        status: paymentStatus,
        timestamp: operation.status === Types.TradeStatus.COMPLETED ? operation.updatedAt : undefined,
      },
    ];

    return timeline;
  }, [operation, inspections, transport, negotiations]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold mb-4">Workflow Timeline</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
              {index < items.length - 1 && <div className="flex-1 w-px bg-slate-200"></div>}
            </div>
            <div className={`flex-1 border rounded-lg px-4 py-3 ${statusStyles[item.status]}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{item.title}</h4>
                {item.timestamp && (
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-sm mt-1">{item.description}</p>
              {item.badge && (
                <Badge className="mt-2 text-xs bg-amber-100 text-amber-800 border border-amber-200">
                  {item.badge}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeTimeline;
