import React from 'react';
import * as Types from '../../../../../types';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import ExpiryBadge from '../../../../../components/common/ExpiryBadge';

interface NegotiationsTabProps {
  negotiations: Types.Negotiation[];
  onRefresh: () => void;
  onRespond: (negotiation: Types.Negotiation) => void;
  getNegotiationStatusColor: (status: Types.NegotiationStatus) => string;
}

// ─── Price History Timeline ───────────────────────────────────────────────────

interface PriceHistoryTimelineProps {
  rounds: Types.Negotiation[];
  agreedPrice?: number;
}

interface RoundEntry {
  label: string;
  price: number;
  quantity: number;
  isFinal: boolean;
  isRejected: boolean;
  dotClass: string;
  labelClass: string;
}

const PriceHistoryTimeline: React.FC<PriceHistoryTimelineProps> = ({ rounds, agreedPrice }) => {
  if (rounds.length === 0) return null;

  const entries: RoundEntry[] = rounds.map((round, index) => {
    const roundNumber = index + 1;
    const isLast = index === rounds.length - 1;

    let label: string;
    switch (round.type) {
      case 'BUYER_OFFER':
        label = roundNumber === 1 ? `Round ${roundNumber} — Admin offer` : `Round ${roundNumber} — Admin counter`;
        break;
      case 'SELLER_COUNTER':
        label = `Round ${roundNumber} — Seller counter`;
        break;
      case 'BUYER_COUNTER':
        label = `Round ${roundNumber} — Admin counter`;
        break;
      default:
        label = `Round ${roundNumber}`;
    }

    const isFinal =
      isLast &&
      (round.status === Types.NegotiationStatus.ACCEPTED ||
        round.status === Types.NegotiationStatus.REJECTED ||
        round.status === Types.NegotiationStatus.EXPIRED ||
        round.status === Types.NegotiationStatus.WITHDRAWN);

    const isRejected =
      isLast &&
      (round.status === Types.NegotiationStatus.REJECTED ||
        round.status === Types.NegotiationStatus.EXPIRED ||
        round.status === Types.NegotiationStatus.WITHDRAWN);

    const isAccepted = isLast && round.status === Types.NegotiationStatus.ACCEPTED;

    let dotClass = 'bg-gray-400';
    let labelClass = 'text-gray-700';

    if (isAccepted) {
      dotClass = 'bg-green-500';
      labelClass = 'text-green-700 font-semibold';
    } else if (isRejected) {
      dotClass = 'bg-red-500';
      labelClass = 'text-red-700';
    } else if (isFinal) {
      dotClass = 'bg-orange-500';
      labelClass = 'text-orange-700';
    } else if (round.type === 'SELLER_COUNTER') {
      dotClass = 'bg-blue-400';
      labelClass = 'text-blue-700';
    } else {
      dotClass = 'bg-gray-400';
      labelClass = 'text-gray-700';
    }

    return {
      label,
      price: round.offeredPrice,
      quantity: round.offeredQuantity,
      isFinal,
      isRejected,
      dotClass,
      labelClass,
    };
  });

  // Append a synthetic "Agreed" row when the latest round was accepted
  const latestRound = rounds[rounds.length - 1];
  const effectiveAgreedPrice =
    agreedPrice ?? (latestRound.status === Types.NegotiationStatus.ACCEPTED ? latestRound.offeredPrice : undefined);

  const showAgreedRow =
    latestRound.status === Types.NegotiationStatus.ACCEPTED && effectiveAgreedPrice !== undefined;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Price History</p>

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

        <ul className="space-y-2">
          {entries.map((entry, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {/* Dot */}
              <span className={`mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-white ring-1 ring-gray-200 ${entry.dotClass}`} />

              {/* Content */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-sm ${entry.labelClass}`}>{entry.label}:</span>
                <span className="text-sm font-semibold text-gray-900">
                  €{entry.price.toLocaleString()}/unit
                </span>
                <span className="text-xs text-gray-500">
                  × {entry.quantity.toLocaleString()} units
                </span>
                {entry.isRejected && (
                  <span className="text-xs text-red-600 font-medium">✗</span>
                )}
              </div>
            </li>
          ))}

          {/* Agreed price row */}
          {showAgreedRow && (
            <li className="flex items-start gap-3">
              <span className="mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-white ring-1 ring-green-300 bg-green-500" />
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm text-green-700 font-semibold">Agreed price:</span>
                <span className="text-sm font-bold text-green-800">
                  €{effectiveAgreedPrice!.toLocaleString()}/unit
                </span>
                <span className="text-xs text-green-600 font-medium">✓</span>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

// ─── Negotiations Tab ─────────────────────────────────────────────────────────

export const NegotiationsTab: React.FC<NegotiationsTabProps> = ({
  negotiations,
  onRefresh,
  onRespond,
  getNegotiationStatusColor,
}) => {
  // Group negotiation records by seller (tradeSellerId).
  // Each group represents all rounds for one seller, sorted oldest → newest.
  const groupsBySeller = React.useMemo(() => {
    const map = new Map<string, Types.Negotiation[]>();

    for (const n of negotiations) {
      const existing = map.get(n.tradeSellerId);
      if (existing) {
        existing.push(n);
      } else {
        map.set(n.tradeSellerId, [n]);
      }
    }

    // Sort rounds within each group by creation time (ascending = oldest first)
    for (const rounds of map.values()) {
      rounds.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Return as array of groups; each group is an array of rounds
    return Array.from(map.values());
  }, [negotiations]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Negotiations ({groupsBySeller.length})</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {groupsBySeller.map((rounds) => {
        // The latest round drives the card's displayed status & action button
        const latest = rounds[rounds.length - 1];
        const sellerName = latest.tradeSeller?.seller?.name ?? 'Unknown Seller';
        const agreedPrice = latest.tradeSeller?.agreedPrice;

        return (
          <div key={latest.tradeSellerId} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{sellerName}</h4>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getNegotiationStatusColor(
                      latest.status
                    )}`}
                  >
                    {latest.status}
                  </span>
                  {latest.status === Types.NegotiationStatus.PENDING && latest.expiresAt && (
                    <ExpiryBadge expiresAt={latest.expiresAt} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Current Offer</p>
                    <p className="font-semibold">€{latest.offeredPrice.toLocaleString()}/unit</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-semibold">{latest.offeredQuantity.toLocaleString()} units</p>
                  </div>
                  {latest.expiresAt && (
                    <div>
                      <p className="text-gray-600">Expires</p>
                      <p className="font-semibold">
                        {format(new Date(latest.expiresAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  )}
                  {rounds.length > 1 && (
                    <div>
                      <p className="text-gray-600">Rounds</p>
                      <p className="font-semibold">{rounds.length}</p>
                    </div>
                  )}
                </div>

                {/* Price history timeline — always shown when there is data */}
                <PriceHistoryTimeline rounds={rounds} agreedPrice={agreedPrice} />
              </div>

              {latest.status === Types.NegotiationStatus.COUNTERED && (
                <button
                  onClick={() => onRespond(latest)}
                  className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex-shrink-0"
                >
                  Respond
                </button>
              )}
            </div>
          </div>
        );
      })}

      {groupsBySeller.length === 0 && (
        <div className="text-center py-8 text-gray-500">No negotiations yet</div>
      )}
    </div>
  );
};
