import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { InspectionCompletionMode } from '../../../inspections/types';

export interface InspectionQueueItem {
  inspectionId: string;
  tradeSellerId: string;
  sellerName: string;
  productName?: string;
  status: string;
  priority: string;
  inspectorName?: string | null;
  requestedDate?: string;
  city?: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
  quantity?: number;
  unit?: string;
  address?: string;
}

interface InspectionQueuePanelProps {
  items: InspectionQueueItem[];
  loading?: boolean;
  onAssignClick: (item: InspectionQueueItem) => void;
  onCompleteRequest?: (item: InspectionQueueItem, mode: InspectionCompletionMode) => void;
}

const statusChipStyles: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Pending assignment',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  IN_PROGRESS: {
    label: 'In progress',
    className: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

const priorityChipStyles: Record<string, string> = {
  URGENT: 'bg-rose-100 text-rose-800 border border-rose-200',
  HIGH: 'bg-orange-100 text-orange-800 border border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  LOW: 'bg-slate-100 text-slate-700 border border-slate-200',
};

export const InspectionQueuePanel: React.FC<InspectionQueuePanelProps> = ({
  items,
  loading,
  onAssignClick,
  onCompleteRequest,
}) => {
  const pendingCount = items.filter((item) => item.status === 'PENDING').length;
  const scheduledCount = items.filter((item) => item.status === 'SCHEDULED').length;
  const inProgressCount = items.filter((item) => item.status === 'IN_PROGRESS').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Inspection queue</h3>
          <p className="text-xs text-slate-500">
            Track which sellers still need verification before transport.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Badge className="bg-amber-50 text-amber-800 border border-amber-200">
            Pending {pendingCount}
          </Badge>
          <Badge className="bg-blue-50 text-blue-800 border border-blue-200">
            Scheduled {scheduledCount}
          </Badge>
          <Badge className="bg-indigo-50 text-indigo-800 border border-indigo-200">
            Active {inProgressCount}
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-slate-500">Loading inspections…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-sm text-slate-500">
          No inspections required yet. Accept offers to begin verification.
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {items.map((item) => {
            const statusMeta = statusChipStyles[item.status] ?? {
              label: item.status,
              className: 'bg-slate-100 text-slate-700 border border-slate-200',
            };
            const priorityClass =
              priorityChipStyles[item.priority] ?? 'bg-slate-100 text-slate-700 border';

            return (
              <div
                key={item.inspectionId}
                className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.sellerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.productName || 'Unknown product'}
                      {item.city ? ` • ${item.city}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Badge className={priorityClass}>{item.priority}</Badge>
                    <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div>
                    {item.inspectorName ? (
                      <span className="font-medium text-slate-700">
                        Assigned to {item.inspectorName}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">
                        Awaiting inspector assignment
                      </span>
                    )}
                    {item.requestedDate && (
                      <span className="ml-2 text-slate-400">
                        Requested{' '}
                        {formatDistanceToNow(new Date(item.requestedDate), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                  {item.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAssignClick(item)}
                    >
                      Assign inspector
                    </Button>
                  )}
                  {onCompleteRequest &&
                    (item.status === 'SCHEDULED' || item.status === 'IN_PROGRESS') && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCompleteRequest(item, 'FAIL')}
                          className="text-rose-700"
                        >
                          Fail
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onCompleteRequest(item, 'PASS')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Pass
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InspectionQueuePanel;
