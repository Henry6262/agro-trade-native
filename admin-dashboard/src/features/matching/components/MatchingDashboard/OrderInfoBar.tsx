import React, { useState } from 'react';

interface SellerAllocation {
  seller: {
    id: string;
    seller?: {
      name?: string;
      company?: {
        legalName?: string;
      };
    };
    quantity: number;
  };
  allocatedQuantity: number;
}

interface OrderInfoBarProps {
  selectedOrder?: {
    id: string;
    corporation: string;
    product: string;
    quantity: number;
    deliveryLocation: string;
  } | null;
  selectedQuantity: number;
  selectedSellers?: SellerAllocation[];
  onClearSelection?: () => void;
}

export const OrderInfoBar: React.FC<OrderInfoBarProps> = ({
  selectedOrder,
  selectedQuantity,
  selectedSellers = [],
  onClearSelection,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  if (!selectedOrder) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-8 border-b-2 border-gray-300">
        <div className="flex flex-col items-center justify-center gap-3 text-text-secondary">
          <span className="text-5xl opacity-40">📋</span>
          <p className="text-base font-semibold text-text-primary">Please select a buyer to begin calculation</p>
          <p className="text-sm text-text-secondary">Choose a buyer order from the left panel to start matching with sellers</p>
        </div>
      </div>
    );
  }

  const remainingQuantity = selectedOrder.quantity - selectedQuantity;
  const progress = (selectedQuantity / selectedOrder.quantity) * 100;
  const isComplete = remainingQuantity === 0;

  return (
    <div className="bg-white px-6 py-4 border-b border-gray-300 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏢</span>
            <div>
              <h3 className="font-bold text-base text-text-primary">{selectedOrder.corporation}</h3>
              <p className="text-sm text-text-secondary flex items-center gap-1">
                <span>📦</span>
                <span>{selectedOrder.product}</span>
                <span>•</span>
                <span>📍</span>
                <span>{selectedOrder.deliveryLocation}</span>
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gray-100 px-3 py-1.5 rounded">
              <span className="text-xs font-medium text-text-secondary">Target:</span>
              <span className="ml-1 font-bold text-sm text-text-primary">{selectedOrder.quantity}t</span>
            </div>
            <div className={`px-3 py-1.5 rounded ${selectedQuantity > 0 ? 'bg-primary' : 'bg-gray-100'}`}>
              <span className="text-xs font-medium text-text-secondary">Selected:</span>
              <span className={`ml-1 font-bold text-sm ${selectedQuantity > 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                {selectedQuantity}t
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded ${isComplete ? 'bg-primary' : remainingQuantity > 0 ? 'bg-gray-100' : 'bg-gray-100'}`}>
              <span className="text-xs font-medium text-text-secondary">Remaining:</span>
              <span className={`ml-1 font-bold text-sm ${isComplete ? 'text-text-primary' : 'text-text-secondary'}`}>
                {remainingQuantity}t
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${isComplete ? 'bg-primary' : 'bg-gray-400'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute -top-0.5 right-0 text-xs font-semibold text-text-secondary">
              {progress.toFixed(0)}%
            </div>
          </div>

          {isComplete && (
            <div className="mt-2 flex items-center gap-1 text-primary">
              <span>✓</span>
              <span className="text-sm font-semibold">Order fully matched!</span>
            </div>
          )}

          {/* Seller Allocations Detail */}
          {selectedSellers.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <span>{showDetails ? '▼' : '▶'}</span>
                <span>Seller Breakdown ({selectedSellers.length} {selectedSellers.length === 1 ? 'seller' : 'sellers'})</span>
              </button>
              {showDetails && (
                <div className="mt-2 space-y-1">
                  {selectedSellers.map(({ seller, allocatedQuantity }) => (
                    <div
                      key={seller.id}
                      className="flex items-center justify-between text-xs bg-gray-50 px-3 py-1.5 rounded"
                    >
                      <span className="font-medium text-text-primary truncate max-w-[200px]">
                        {seller.seller?.company?.legalName || seller.seller?.name || 'Unknown'}
                      </span>
                      <span className="text-text-secondary flex items-center gap-2">
                        <span className="font-bold text-primary">{allocatedQuantity}t</span>
                        <span className="text-gray-400">of {seller.quantity}t available</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onClearSelection}
            className="px-4 py-2 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition text-sm font-medium text-text-primary"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderInfoBar;
