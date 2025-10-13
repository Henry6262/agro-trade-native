import React from 'react';

interface OrderInfoBarProps {
  selectedOrder?: {
    id: string;
    corporation: string;
    product: string;
    quantity: number;
    deliveryLocation: string;
  } | null;
  selectedQuantity: number;
  onClearSelection?: () => void;
}

export const OrderInfoBar: React.FC<OrderInfoBarProps> = ({
  selectedOrder,
  selectedQuantity,
  onClearSelection,
}) => {
  if (!selectedOrder) {
    return (
      <div className="bg-gray-100 p-4 border-b border-gray-300">
        <p className="text-gray-600 text-sm">Select a buyer order to begin matching</p>
      </div>
    );
  }

  const remainingQuantity = selectedOrder.quantity - selectedQuantity;
  const progress = (selectedQuantity / selectedOrder.quantity) * 100;
  const isComplete = remainingQuantity === 0;

  return (
    <div className="bg-blue-50 p-4 border-b border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-bold text-lg">{selectedOrder.corporation}</h3>
              <p className="text-sm text-gray-600">
                {selectedOrder.product} • {selectedOrder.deliveryLocation}
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <span className="text-sm text-gray-600">Needed:</span>
              <span className="font-bold text-lg">{selectedOrder.quantity}t</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
              <span className="text-sm text-gray-600">Selected:</span>
              <span className="font-bold text-lg text-green-700">{selectedQuantity}t</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg">
              <span className="text-sm text-gray-600">Remaining:</span>
              <span className="font-bold text-lg text-orange-700">{remainingQuantity}t</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isComplete ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={onClearSelection}
          className="ml-4 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};

export default OrderInfoBar;
