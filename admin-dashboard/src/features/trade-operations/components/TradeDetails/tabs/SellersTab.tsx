import React from 'react';
import * as Types from '../../../../../types';
import { Send, Shield, AlertTriangle, Search } from 'lucide-react';

interface SellersTabProps {
  operation: Types.TradeOperation;
  onSendBulkOffers: () => void;
  onFindReplacement: (seller: Types.TradeSeller) => void;
}

export const SellersTab: React.FC<SellersTabProps> = ({
  operation,
  onSendBulkOffers,
  onFindReplacement,
}) => {
  const failedSellers = operation.sellers?.filter((s) => s.status === 'FAILED_INSPECTION') || [];
  const hasFailedInspections = failedSellers.length > 0;

  return (
    <div className="space-y-4">
      {/* Warning banner for failed inspections */}
      {hasFailedInspections && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Inspection Failures Detected</p>
                <p className="text-sm text-red-700">
                  {failedSellers.length} seller(s) failed quality inspection and need replacement
                </p>
              </div>
            </div>
            <button
              onClick={() => onFindReplacement(failedSellers[0])}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Find Replacement
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Sellers ({operation.sellers?.length || 0})</h3>
        <button
          onClick={onSendBulkOffers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send Bulk Offers
        </button>
      </div>

      {operation.sellers?.map((seller) => (
        <div
          key={seller.id}
          className={`bg-white p-4 rounded-lg border ${
            seller.status === 'FAILED_INSPECTION'
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{seller.seller?.name}</h4>
              <p className="text-sm text-gray-600">
                {seller.requestedQuantity} {seller.unit} • Status: {seller.status}
              </p>
              {seller.finalPrice && (
                <p className="text-sm font-semibold text-green-600 mt-1">
                  Agreed Price: €{seller.finalPrice}/unit
                </p>
              )}
              {seller.status === 'FAILED_INSPECTION' && (
                <p className="text-sm text-red-600 mt-1 font-semibold">
                  ⚠️ Failed quality inspection - replacement needed
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {seller.isVerified && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  seller.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : seller.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {seller.status}
              </span>
            </div>
          </div>
        </div>
      ))}

      {(!operation.sellers || operation.sellers.length === 0) && (
        <div className="text-center py-8 text-gray-500">No sellers added yet</div>
      )}
    </div>
  );
};
