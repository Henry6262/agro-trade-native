import React, { useState } from 'react';
import { toast } from 'sonner';
import { transportRequestService } from '../../../../services/transportApi';

interface CreateTransportModalProps {
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export const CreateTransportModal: React.FC<CreateTransportModalProps> = ({ onClose, onCreated }) => {
  const [tradeOperationId, setTradeOperationId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!tradeOperationId.trim()) {
      toast.error('Please enter a Trade Operation ID');
      return;
    }
    try {
      setLoading(true);
      await transportRequestService.create({ tradeOperationId: tradeOperationId.trim() });
      toast.success('Transport request created successfully');
      await onCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create transport request:', err);
      toast.error(err?.response?.data?.message || 'Failed to create transport request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Create Transport Request</h2>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trade Operation ID
        </label>
        <input
          type="text"
          value={tradeOperationId}
          onChange={(e) => setTradeOperationId(e.target.value)}
          placeholder="Enter trade operation ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <p className="text-xs text-gray-500 mb-4">
          The trade operation must be in TRANSPORT_MATCHING phase.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};
