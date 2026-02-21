import React, { useState } from 'react';
import * as Types from '../../../../../types';
import { X } from 'lucide-react';

interface EditTradeModalProps {
  operation: Types.TradeOperation;
  onClose: () => void;
  onUpdate: (updateDto: any) => Promise<void>;
}

export const EditTradeModal: React.FC<EditTradeModalProps> = ({
  operation,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sellingPrice: operation.sellingPrice || '',
    targetProfitMargin: operation.profitMargin || '',
    expectedDeliveryDate: operation.expectedDeliveryDate
      ? new Date(operation.expectedDeliveryDate).toISOString().split('T')[0]
      : '',
    adminNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateDto: any = {
        adminNotes: formData.adminNotes,
      };

      if (formData.sellingPrice) {
        updateDto.sellingPrice = parseFloat(formData.sellingPrice.toString());
      }

      if (formData.targetProfitMargin) {
        updateDto.targetProfitMargin = parseFloat(formData.targetProfitMargin.toString());
      }

      if (formData.expectedDeliveryDate) {
        updateDto.expectedDeliveryDate = new Date(formData.expectedDeliveryDate);
      }

      await onUpdate(updateDto);
      onClose();
    } catch (error) {
      console.error('Failed to update trade operation:', error);
      alert(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Edit Trade Operation</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) =>
                setFormData({ ...formData, sellingPrice: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter selling price per unit"
            />
            <p className="text-xs text-gray-500 mt-1">
              Note: Cannot update if there are active negotiations
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Profit Margin (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="5"
              max="20"
              value={formData.targetProfitMargin}
              onChange={(e) =>
                setFormData({ ...formData, targetProfitMargin: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="5-20%"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) =>
                setFormData({ ...formData, expectedDeliveryDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Notes
            </label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) =>
                setFormData({ ...formData, adminNotes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Reason for update or additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
