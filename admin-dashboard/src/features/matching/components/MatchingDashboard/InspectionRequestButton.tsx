import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ClipboardCheck, Loader2, AlertCircle } from 'lucide-react';
import type { TradeSeller } from '../../../../types';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';

interface InspectionRequestButtonProps {
  tradeOperationId: string;
  sellers: TradeSeller[];
  onInspectionRequested?: () => void;
  disabled?: boolean;
}

interface InspectionRequest {
  sellerId: string;
  saleListingId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

export const InspectionRequestButton: React.FC<InspectionRequestButtonProps> = ({
  tradeOperationId,
  sellers,
  onInspectionRequested,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedSellers, setSelectedSellers] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter sellers that can be inspected (not already verified and not rejected)
  const inspectableSellers = sellers.filter(
    seller => !seller.isVerified && seller.status !== 'REJECTED' && seller.status !== 'FAILED_INSPECTION'
  );

  const handleOpen = () => {
    // Pre-select all inspectable sellers
    const allSellerIds = new Set(inspectableSellers.map(s => s.id));
    setSelectedSellers(allSellerIds);
    setError(null);
    setOpen(true);
  };

  const handleToggleSeller = (sellerId: string) => {
    const newSelection = new Set(selectedSellers);
    if (newSelection.has(sellerId)) {
      newSelection.delete(sellerId);
    } else {
      newSelection.add(sellerId);
    }
    setSelectedSellers(newSelection);
  };

  const handleSelectAll = () => {
    const allSellerIds = new Set(inspectableSellers.map(s => s.id));
    setSelectedSellers(allSellerIds);
  };

  const handleDeselectAll = () => {
    setSelectedSellers(new Set());
  };

  const handleSubmit = async () => {
    if (selectedSellers.size === 0) {
      setError('Please select at least one seller for inspection');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Build inspection requests
      const inspectionRequests: InspectionRequest[] = Array.from(selectedSellers).map(sellerId => {
        const seller = inspectableSellers.find(s => s.id === sellerId);
        return {
          sellerId: seller?.sellerId || '',
          saleListingId: seller?.saleListingId || '',
          priority,
          notes: `Inspection request for trade operation ${tradeOperationId}`,
        };
      });

      // Submit batch inspection request
      const response = await api.post(API_ENDPOINTS.inspections.batch, {
        tradeOperationId,
        inspections: inspectionRequests,
      });

      toast.success('Inspection requests created', {
        description: `Successfully created ${selectedSellers.size} inspection request(s)`,
      });

      // Close dialog and notify parent
      setOpen(false);
      onInspectionRequested?.();
    } catch (err: any) {
      console.error('Error creating inspection requests:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create inspection requests';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSellerStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'NEGOTIATING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'INVITED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (inspectableSellers.length === 0) {
    return (
      <Button disabled variant="outline" size="sm">
        <ClipboardCheck className="w-4 h-4 mr-2" />
        No Sellers to Inspect
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={disabled}
        variant="default"
        size="sm"
        className="bg-purple-600 hover:bg-purple-700"
      >
        <ClipboardCheck className="w-4 h-4 mr-2" />
        Request Inspections ({inspectableSellers.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Batch Inspections</DialogTitle>
            <DialogDescription>
              Select sellers to request quality inspections for trade operation{' '}
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tradeOperationId.substring(0, 8)}...</code>
            </DialogDescription>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Priority Selection */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <Label className="text-sm font-semibold mb-3 block">Inspection Priority</Label>
              <div className="flex gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                  <Button
                    key={p}
                    onClick={() => setPriority(p)}
                    variant={priority === p ? 'default' : 'outline'}
                    size="sm"
                    className={priority === p ? getPriorityColor(p) : ''}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedSellers.size} of {inspectableSellers.length} seller(s) selected
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={handleDeselectAll} variant="outline" size="sm">
                Deselect All
              </Button>
            </div>
          </div>

          {/* Sellers List */}
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {inspectableSellers.map((seller) => (
              <Card
                key={seller.id}
                className={`cursor-pointer transition-all ${
                  selectedSellers.has(seller.id) ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleToggleSeller(seller.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSellers.has(seller.id)}
                      onCheckedChange={() => handleToggleSeller(seller.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {seller.seller?.name || 'Unknown Seller'}
                          </p>
                          <code className="text-xs text-gray-500">{seller.id.substring(0, 8)}...</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSellerStatusColor(seller.status)}>
                            {seller.status}
                          </Badge>
                          {seller.isVerified && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              VERIFIED
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold">Quantity:</span> {seller.requestedQuantity} {seller.unit}
                        </div>
                        {seller.agreedPrice && (
                          <div>
                            <span className="font-semibold">Price:</span> €{seller.agreedPrice.toFixed(2)}/{seller.unit}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedSellers.size === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Requests...
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Create {selectedSellers.size} Request{selectedSellers.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InspectionRequestButton;
