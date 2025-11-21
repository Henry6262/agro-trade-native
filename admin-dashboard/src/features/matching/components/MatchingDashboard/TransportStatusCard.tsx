import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { TransportSummary } from '../../../../types';

interface TransportStatusCardProps {
  transport?: TransportSummary;
  onCreateRequest?: () => Promise<void> | void;
  creating?: boolean;
}

const statusBadgeMap: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 border border-blue-200',
  IN_PROGRESS: 'bg-orange-100 text-orange-800 border border-orange-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

const bidBadgeMap: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200',
  DECLINED: 'bg-rose-100 text-rose-800 border border-rose-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border border-blue-200',
};

export const TransportStatusCard: React.FC<TransportStatusCardProps> = ({
  transport,
  onCreateRequest,
  creating,
}) => {
  const request = transport?.request;
  const bids = request?.bids ?? [];
  const job = request?.job;
  const pickupCount = request?.pickupPoints?.length ?? 0;

  if (!request) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transport coordination</CardTitle>
              <CardDescription>
                All verified sellers are ready. Create a transport request to notify carriers.
              </CardDescription>
            </div>
            {onCreateRequest && (
              <Button onClick={onCreateRequest} disabled={creating} size="sm">
                {creating ? 'Creating…' : 'Create request'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            No transport request has been generated for this trade operation yet. Once you create it,
            transporters will be able to submit bids directly from their portal.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pendingBids = bids.filter((bid) => bid.status === 'PENDING');
  const acceptedBid = bids.find((bid) => bid.status === 'ACCEPTED');
  const deadlineLabel = request.biddingDeadline
    ? formatDistanceToNow(new Date(request.biddingDeadline), { addSuffix: true })
    : '—';

  const warnings: string[] = [];

  if (request?.status === 'OPEN' && bids.length === 0) {
    warnings.push('No bids yet');
  }
  if (request?.status === 'OPEN' && request.biddingDeadline) {
    const diffHours =
      (new Date(request.biddingDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHours > 0 && diffHours <= 24) {
      warnings.push('Bidding deadline within 24h');
    }
  }
  if (request?.status === 'ASSIGNED' && !job) {
    warnings.push('Bid accepted but job not started');
  }
  if (
    job &&
    job.status !== 'COMPLETED' &&
    job.estimatedArrival &&
    new Date(job.estimatedArrival).getTime() < Date.now()
  ) {
    warnings.push('Transport overdue');
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transport request #{request.requestNumber}</CardTitle>
            <CardDescription>
              {request.totalWeight}t • {pickupCount} pickup point{pickupCount === 1 ? '' : 's'}
            </CardDescription>
          </div>
          <Badge className={statusBadgeMap[request.status] || 'bg-slate-100 text-slate-700 border'}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {warnings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {warnings.map((warning) => (
              <Badge
                key={warning}
                className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium"
              >
                ⚠️ {warning}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-slate-500">Bids</p>
            <p className="text-lg font-semibold">
              {bids.length}
              {pendingBids.length > 0 && (
                <span className="text-xs font-normal text-amber-600 ml-2">
                  {pendingBids.length} pending
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Bidding deadline</p>
            <p className="text-lg font-semibold">{deadlineLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Urgency</p>
            <p className="text-lg font-semibold capitalize">
              {request.urgencyLevel?.toLowerCase() || 'standard'}
            </p>
          </div>
        </div>

        {job ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs uppercase text-emerald-700">Job in progress</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm font-semibold text-emerald-900">
                {job.jobNumber} • {job.status}
              </p>
              {job.progress !== undefined && (
                <span className="text-xs text-emerald-700">{job.progress}%</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs uppercase text-slate-500">Latest bids</p>
            {bids.length === 0 ? (
              <p className="text-sm text-slate-500">Awaiting bids from transporters…</p>
            ) : (
              bids.slice(0, 2).map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {bid.transportCompanyName || bid.transporterName || 'Transporter'}
                    </p>
                    <p className="text-xs text-slate-500">
                      €
                      {typeof bid.bidAmount === 'number'
                        ? bid.bidAmount.toFixed(2)
                        : bid.bidAmount ?? '—'}
                    </p>
                  </div>
                  <Badge className={bidBadgeMap[bid.status] || 'bg-slate-100 text-slate-700 border'}>
                    {bid.status}
                  </Badge>
                </div>
              ))
            )}
            {acceptedBid && (
              <p className="text-xs text-emerald-700">
                Accepted bid: {acceptedBid.transportCompanyName || acceptedBid.transporterName}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransportStatusCard;
