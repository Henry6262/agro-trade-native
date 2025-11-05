import React from 'react';
import * as Types from '../../../../../types';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface NegotiationsTabProps {
  negotiations: Types.Negotiation[];
  onRefresh: () => void;
  onRespond: (negotiation: Types.Negotiation) => void;
  getNegotiationStatusColor: (status: Types.NegotiationStatus) => string;
}

export const NegotiationsTab: React.FC<NegotiationsTabProps> = ({
  negotiations,
  onRefresh,
  onRespond,
  getNegotiationStatusColor,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Negotiations ({negotiations.length})</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {negotiations.map((negotiation) => (
        <div key={negotiation.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">
                  {negotiation.tradeSeller?.seller?.name || 'Unknown Seller'}
                </h4>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getNegotiationStatusColor(
                    negotiation.status
                  )}`}
                >
                  {negotiation.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Offered Price</p>
                  <p className="font-semibold">€{negotiation.offeredPrice}/unit</p>
                </div>
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-semibold">{negotiation.offeredQuantity} units</p>
                </div>
                {negotiation.expiresAt && (
                  <div>
                    <p className="text-gray-600">Expires</p>
                    <p className="font-semibold">
                      {format(new Date(negotiation.expiresAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {negotiation.status === Types.NegotiationStatus.COUNTERED && (
              <button
                onClick={() => onRespond(negotiation)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Respond
              </button>
            )}
          </div>
        </div>
      ))}

      {negotiations.length === 0 && (
        <div className="text-center py-8 text-gray-500">No negotiations yet</div>
      )}
    </div>
  );
};
