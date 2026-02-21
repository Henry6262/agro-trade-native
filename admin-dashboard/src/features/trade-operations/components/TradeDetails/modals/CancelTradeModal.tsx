import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CancelTradeModalProps {
  operationNumber: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const CancelTradeModal: React.FC<CancelTradeModalProps> = ({
  operationNumber,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (error) {
      console.error('Failed to cancel trade operation:', error);
      alert(`Failed to cancel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Trade Operation</h3>
              <p className="text-sm text-gray-500 mt-1">Operation #{operationNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This action will:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc space-y-1">
              <li>Cancel all active negotiations</li>
              <li>Release the buy listing for other trades</li>
              <li>Mark this operation as cancelled (cannot be undone)</li>
            </ul>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Cancellation <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            placeholder="Please explain why this trade operation is being cancelled..."
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Keep Trade
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel Trade'}
          </button>
        </div>
      </div>
    </div>
  );
};
