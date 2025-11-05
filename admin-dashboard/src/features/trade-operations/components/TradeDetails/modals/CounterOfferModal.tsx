import React, { useState } from 'react';
import * as Types from '../../../../../types';

interface CounterOfferModalProps {
  negotiation: Types.Negotiation;
  onSubmit: (response: Types.RespondToNegotiationDto) => void;
  onClose: () => void;
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
  negotiation,
  onSubmit,
  onClose,
}) => {
  const [response, setResponse] = useState<'ACCEPTED' | 'REJECTED' | 'COUNTERED'>('ACCEPTED');
  const [counterPrice, setCounterPrice] = useState(negotiation.offeredPrice);
  const [counterQuantity, setCounterQuantity] = useState(negotiation.offeredQuantity);

  const handleSubmit = () => {
    if (response === 'COUNTERED') {
      onSubmit({
        status: response,
        counterPrice,
        counterQuantity,
      });
    } else {
      onSubmit({ status: response });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Respond to Counter Offer</h3>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Seller's Offer:</p>
          <p className="font-semibold">
            €{negotiation.offeredPrice}/unit × {negotiation.offeredQuantity} units
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="ACCEPTED"
              checked={response === 'ACCEPTED'}
              onChange={(e) => setResponse(e.target.value as any)}
            />
            <span>Accept Offer</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="REJECTED"
              checked={response === 'REJECTED'}
              onChange={(e) => setResponse(e.target.value as any)}
            />
            <span>Reject Offer</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="COUNTERED"
              checked={response === 'COUNTERED'}
              onChange={(e) => setResponse(e.target.value as any)}
            />
            <span>Counter Offer</span>
          </label>
        </div>

        {response === 'COUNTERED' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-gray-600">Counter Price (€/unit)</label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Counter Quantity</label>
              <input
                type="number"
                value={counterQuantity}
                onChange={(e) => setCounterQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit Response
          </button>
        </div>
      </div>
    </div>
  );
};
