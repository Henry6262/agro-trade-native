import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedProgress, EnhancedTooltip } from '../../../../components/common';
import type { Offer, BuyListing } from '../../../../types/listings';

interface QuantityTrackingPanelProps {
  buyListing: BuyListing;
  offers: Offer[];
  onFindReplacements?: () => void;
}

interface QuantityStatus {
  needed: number;
  accepted: number;
  pending: number;
  rejected: number;
  gap: number;
  percentFilled: number;
}

export const QuantityTrackingPanel: React.FC<QuantityTrackingPanelProps> = ({
  buyListing,
  offers,
  onFindReplacements,
}) => {
  const calculateQuantityStatus = (): QuantityStatus => {
    const needed = buyListing.quantity || 0;
    const accepted = offers
      .filter(o => o.status === 'accepted')
      .reduce((sum, o) => sum + (o.quantity || 0), 0);
    const pending = offers
      .filter(o => o.status === 'pending')
      .reduce((sum, o) => sum + (o.quantity || 0), 0);
    const rejected = offers
      .filter(o => o.status === 'rejected')
      .reduce((sum, o) => sum + (o.quantity || 0), 0);
    const gap = needed - accepted;
    const percentFilled = needed > 0 ? (accepted / needed) * 100 : 0;

    return { needed, accepted, pending, rejected, gap, percentFilled };
  };

  const status = calculateQuantityStatus();
  const hasGap = status.gap > 0;
  const isFulfilled = status.percentFilled >= 100;

  // Progress bar calculation
  const acceptedWidth = Math.min(status.percentFilled, 100);
  const pendingWidth = Math.min(((status.pending / status.needed) * 100), 100 - acceptedWidth);

  return (
    <Card>
      <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100 border-b-2 border-orange-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <CardTitle>Quantity Tracking</CardTitle>
              <CardDescription>Monitor fulfillment progress and gaps</CardDescription>
            </div>
          </div>
          {isFulfilled ? (
            <span className="px-3 py-1 rounded-lg text-sm font-bold bg-green-100 text-green-800 border border-green-300">
              ✅ FULFILLED
            </span>
          ) : hasGap ? (
            <span className="px-3 py-1 rounded-lg text-sm font-bold bg-red-100 text-red-800 border border-red-300">
              ⚠️ GAP EXISTS
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg text-sm font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
              ⏳ IN PROGRESS
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Progress Bar with Animation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-text-primary">
                {status.accepted.toFixed(1)}/{status.needed.toFixed(1)} {buyListing.unit}
              </span>
              <EnhancedTooltip content="Percentage of required quantity that has been accepted by sellers">
                <span className="text-sm font-bold text-text-primary cursor-help">
                  {status.percentFilled.toFixed(1)}%
                </span>
              </EnhancedTooltip>
            </div>
            <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm">
              <div className="h-full flex">
                {/* Accepted portion (green) with animation */}
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 ease-out flex items-center justify-center text-white text-xs font-bold shadow-inner"
                  style={{ width: `${acceptedWidth}%` }}
                >
                  {acceptedWidth > 10 && '✓ Accepted'}
                </div>
                {/* Pending portion (yellow) with animation */}
                {pendingWidth > 0 && (
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-1000 ease-out flex items-center justify-center text-white text-xs font-bold shadow-inner"
                    style={{ width: `${pendingWidth}%` }}
                  >
                    {pendingWidth > 10 && '⏳ Pending'}
                  </div>
                )}
              </div>
            </div>
            {/* Pulse animation for gap */}
            {hasGap && (
              <div className="mt-1 text-xs text-orange-600 animate-pulse font-semibold">
                ⚠️ {status.gap.toFixed(1)} {buyListing.unit} gap remaining
              </div>
            )}
          </div>

          {/* Breakdown with hover effects and tooltips */}
          <div className="grid grid-cols-4 gap-4">
            <EnhancedTooltip content="Quantity confirmed and accepted by sellers">
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-help">
                <p className="text-xs text-green-700 font-semibold mb-1">✅ ACCEPTED</p>
                <p className="text-2xl font-bold text-green-800">
                  {status.accepted.toFixed(1)}
                  <span className="text-sm font-normal ml-1">{buyListing.unit}</span>
                </p>
              </div>
            </EnhancedTooltip>

            <EnhancedTooltip content="Quantity awaiting seller confirmation">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-help">
                <p className="text-xs text-yellow-700 font-semibold mb-1">⏳ PENDING</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {status.pending.toFixed(1)}
                  <span className="text-sm font-normal ml-1">{buyListing.unit}</span>
                </p>
              </div>
            </EnhancedTooltip>

            <EnhancedTooltip content="Quantity rejected by sellers">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-help">
                <p className="text-xs text-red-700 font-semibold mb-1">❌ REJECTED</p>
                <p className="text-2xl font-bold text-red-800">
                  {status.rejected.toFixed(1)}
                  <span className="text-sm font-normal ml-1">{buyListing.unit}</span>
                </p>
              </div>
            </EnhancedTooltip>

            <EnhancedTooltip content={hasGap ? "Additional quantity needed to fulfill buyer's requirement" : "All required quantity has been secured"}>
              <div className={`border-2 rounded-lg p-3 transition-all duration-200 hover:scale-105 cursor-help ${hasGap ? 'bg-orange-50 border-orange-300 hover:shadow-md' : 'bg-gray-50 border-gray-300'}`}>
                <p className={`text-xs font-semibold mb-1 ${hasGap ? 'text-orange-700' : 'text-gray-600'}`}>
                  {hasGap ? '⚠️ GAP' : '✓ NO GAP'}
                </p>
                <p className={`text-2xl font-bold ${hasGap ? 'text-orange-800' : 'text-gray-600'}`}>
                  {status.gap.toFixed(1)}
                  <span className="text-sm font-normal ml-1">{buyListing.unit}</span>
                </p>
              </div>
            </EnhancedTooltip>
          </div>

          {/* Gap Alert with emphasis */}
          {hasGap && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 shadow-md animate-pulse-subtle">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-orange-600 text-2xl animate-bounce-slow">⚠️</span>
                  <div>
                    <p className="font-bold text-orange-900 text-sm">Quantity Gap Detected</p>
                    <p className="text-sm text-orange-800 mt-1">
                      You need <span className="font-bold">{status.gap.toFixed(1)} more {buyListing.unit}</span> to fulfill the buyer's requirement.
                      {status.pending > 0 && ` ${status.pending.toFixed(1)} ${buyListing.unit} are pending seller acceptance.`}
                    </p>
                  </div>
                </div>
                {onFindReplacements && (
                  <EnhancedTooltip content="Search for additional sellers to cover the quantity gap">
                    <Button
                      size="sm"
                      onClick={onFindReplacements}
                      className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0 hover:shadow-lg transition-all duration-200"
                      aria-label="Find replacement sellers to cover quantity gap"
                    >
                      🔍 Find Replacement Sellers
                    </Button>
                  </EnhancedTooltip>
                )}
              </div>
            </div>
          )}
          <style>{`
            @keyframes pulse-subtle {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.95; }
            }
            @keyframes bounce-slow {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            .animate-pulse-subtle {
              animation: pulse-subtle 2s ease-in-out infinite;
            }
            .animate-bounce-slow {
              animation: bounce-slow 2s ease-in-out infinite;
            }
          `}</style>

          {/* Success Message with celebration */}
          {isFulfilled && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-green-600 text-3xl animate-bounce-slow">✅</span>
                <div className="flex-1">
                  <p className="font-bold text-green-900 text-sm flex items-center gap-2">
                    Quantity Fulfilled
                    <span className="text-xs px-2 py-0.5 bg-green-200 rounded-full">100%</span>
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    All <span className="font-bold">{status.needed.toFixed(1)} {buyListing.unit}</span> have been secured from sellers. Ready to proceed!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuantityTrackingPanel;
