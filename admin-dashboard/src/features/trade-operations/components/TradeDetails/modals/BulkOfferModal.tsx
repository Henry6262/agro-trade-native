import React, { useState } from 'react';
import * as Types from '../../../../../types';

interface BulkOfferModalProps {
  sellers: any[];
  onSubmit: (offers: Types.CreateNegotiationDto[]) => void;
  onClose: () => void;
}

export const BulkOfferModal: React.FC<BulkOfferModalProps> = ({ sellers, onSubmit, onClose }) => {
  const [offers, setOffers] = useState<Map<string, Types.CreateNegotiationDto>>(new Map());

  const handleSubmit = () => {
    const offerArray = Array.from(offers.values());
    if (offerArray.length > 0) {
      onSubmit(offerArray);
    }
  };

  const updateOffer = (sellerId: string, price: number, quantity: number) => {
    const newOffers = new Map(offers);
    newOffers.set(sellerId, {
      tradeSellerId: sellerId,
      price,
      quantity,
      expiresInHours: 48,
    });
    setOffers(newOffers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Send Bulk Offers</h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sellers
            .filter((s) => s.status === 'INVITED')
            .map((seller) => (
              <div key={seller.id} className="p-3 border rounded-lg">
                <h4 className="font-medium mb-2">{seller.seller?.name}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Price per unit (€)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      onChange={(e) =>
                        updateOffer(seller.id, Number(e.target.value), seller.requestedQuantity)
                      }
                      className="w-full px-3 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Quantity</label>
                    <input
                      type="number"
                      defaultValue={seller.requestedQuantity}
                      onChange={(e) => {
                        const offer = offers.get(seller.id);
                        updateOffer(seller.id, offer?.price || 0, Number(e.target.value));
                      }}
                      className="w-full px-3 py-1 border rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
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
            Send {offers.size} Offers
          </button>
        </div>
      </div>
    </div>
  );
};
