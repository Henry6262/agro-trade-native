import React from 'react';
import * as Types from '../../../../../types';
import { Users, MessageSquare, TrendingUp, ChevronRight } from 'lucide-react';

interface ProfitData {
  estimatedProfit?: number;
  profitMargin?: number;
  [key: string]: string | number | boolean | undefined;
}

interface OverviewTabProps {
  operation: Types.TradeOperation;
  negotiations: Types.Negotiation[];
  profitData: ProfitData | null;
  loading: boolean;
  onPhaseChange: (newPhase: Types.TradePhase) => void;
  getPhaseColor: (phase: Types.TradePhase) => string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  operation,
  negotiations,
  profitData,
  loading,
  onPhaseChange,
  getPhaseColor,
}) => {
  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold">{operation.sellers?.length || 0}</span>
          </div>
          <p className="text-sm text-gray-600">Total Sellers</p>
          <p className="text-xs text-green-600 mt-1">
            {operation.sellers?.filter((s) => s.isVerified).length || 0} verified
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold">{negotiations.length}</span>
          </div>
          <p className="text-sm text-gray-600">Negotiations</p>
          <p className="text-xs text-blue-600 mt-1">
            {negotiations.filter((n) => n.status === Types.NegotiationStatus.PENDING).length}{' '}
            pending
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold">
              €
              {profitData?.estimatedProfit?.toFixed(0) ||
                operation.estimatedProfit?.toFixed(0) ||
                '0'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Est. Profit</p>
          <p className="text-xs text-green-600 mt-1">
            {profitData?.profitMargin?.toFixed(1) || operation.profitMargin?.toFixed(1) || '0'}%
            margin
          </p>
        </div>
      </div>

      {/* Phase Progression */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-4">Phase Progression</h3>
        <div className="flex items-center justify-between mb-4">
          {Object.values(Types.TradePhase).map((phase, index) => (
            <div key={phase} className="flex items-center">
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  phase === operation.phase
                    ? getPhaseColor(phase)
                    : Object.values(Types.TradePhase).indexOf(phase) <
                      Object.values(Types.TradePhase).indexOf(operation.phase)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {phase.replace(/_/g, ' ')}
              </div>
              {index < Object.values(Types.TradePhase).length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              )}
            </div>
          ))}
        </div>

        {operation.phase !== Types.TradePhase.COMPLETED && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const phases = Object.values(Types.TradePhase);
                const currentIndex = phases.indexOf(operation.phase);
                if (currentIndex < phases.length - 1) {
                  onPhaseChange(phases[currentIndex + 1]);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              Move to Next Phase
            </button>
          </div>
        )}
      </div>

      {/* Buy Listing Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-4">Buy Listing Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Product</p>
            <p className="font-semibold">{operation.buyListing?.product?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Buyer</p>
            <p className="font-semibold">{operation.buyListing?.buyer?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Quantity</p>
            <p className="font-semibold">
              {operation.buyListing?.quantity} {operation.buyListing?.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Max Price</p>
            <p className="font-semibold">€{operation.buyListing?.maxPricePerUnit}/unit</p>
          </div>
        </div>
      </div>
    </div>
  );
};
