import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { handleApiError } from '../../../../utils/errorHandler';
import type { TransportCostResult } from '../../../../types';
import type { SaleListing, BuyListing } from '../../../../types/listings';
import api, { tradeOperationService } from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import { getBuyerTargetPrice, getSellerUnitPrice } from '../../../../utils/pricing';

interface OfferData {
  sellerId: string;
  saleListingId: string;
  requestedQuantity: number;
}

interface PricingModalProps {
  open: boolean;
  selectedSellers: SaleListing[];
  buyerOrder: BuyListing;
  onClose: () => void;
  onSubmit: (offers: OfferData[]) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  open,
  selectedSellers,
  buyerOrder,
  onClose,
  onSubmit,
}) => {
  const [offerPrices, setOfferPrices] = useState<Record<string, number>>({});
  const [transportData, setTransportData] = useState<TransportCostResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingOffers, setIsSendingOffers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buyerTargetPrice = getBuyerTargetPrice(buyerOrder);

  // Fetch transport costs on mount
  useEffect(() => {
    fetchTransportCosts();
  }, []);

  const fetchTransportCosts = async () => {
    try {
      setLoading(true);
      const buyerAddressId =
        buyerOrder.deliveryAddressId ?? buyerOrder.deliveryAddress?.id;

      if (!buyerAddressId) {
        setTransportData([]);
        setError('Buyer delivery address is missing coordinates.');
        return;
      }

      const transportResponse = await tradeOperationService.calculateTransport({
        sellerIds: selectedSellers.map((s) => s.sellerId),
        buyerAddressId,
      });

      setTransportData(transportResponse.results || []);

      // Initialize offer prices with seller's original price
      const initialPrices: Record<string, number> = {};
      selectedSellers.forEach((seller) => {
        const unitPrice = getSellerUnitPrice(seller);
        if (unitPrice !== null) {
          initialPrices[seller.id] = unitPrice;
        }
      });
      setOfferPrices(initialPrices);

      setError(null);
    } catch (err) {
      console.error('Error fetching transport costs:', err);
      setError('Failed to calculate transport costs');
      handleApiError(err, 'Failed to calculate transport costs');
    } finally {
      setLoading(false);
    }
  };

  // Calculate profit metrics
  const profitMetrics = useMemo(() => {
    const buyerPrice = buyerTargetPrice ?? 0;
    const sellerData = selectedSellers.map((seller) => {
      const transport = transportData.find((t) => t.sellerId === seller.sellerId);
      const fallbackPrice = getSellerUnitPrice(seller) ?? 0;
      const offerPrice = offerPrices[seller.id] ?? fallbackPrice;

      const sellerRevenue = offerPrice * seller.quantity;
      const buyerRevenue = buyerPrice * seller.quantity;
      const transportCost = transport?.transportCost || 0;
      const profit = buyerRevenue - sellerRevenue - transportCost;

      return {
        seller,
        transport,
        offerPrice,
        sellerRevenue,
        transportCost,
        profit,
      };
    });

    const totalTransport = sellerData.reduce((sum, s) => sum + s.transportCost, 0);
    const totalProfit = sellerData.reduce((sum, s) => sum + s.profit, 0);

    return {
      sellerData,
      totalTransport,
      totalProfit,
    };
  }, [selectedSellers, transportData, offerPrices, buyerTargetPrice]);

  const handleOfferPriceChange = (sellerId: string, price: string) => {
    const parsedPrice = parseFloat(price);
    if (!isNaN(parsedPrice) && parsedPrice > 0) {
      setOfferPrices((prev) => ({ ...prev, [sellerId]: parsedPrice }));
    }
  };

  const handleSendOffers = async () => {
    try {
      setIsSendingOffers(true);
      setError(null);

      // Prepare sellers data for the trade operation
      const sellers = profitMetrics.sellerData.map((data) => ({
        sellerId: data.seller.sellerId,
        saleListingId: data.seller.id,
        requestedQuantity: data.seller.quantity,
      }));

      // Create trade operation with sellers
      const response = await api.post(API_ENDPOINTS.tradeOperations.base, {
        buyListingId: buyerOrder.id,
        targetProfitMargin: 7, // Default 7% margin
        qualityPreference: 'ANY',
        notes: `Created from matching dashboard. Total expected profit: €${profitMetrics.totalProfit.toFixed(2)}`,
      });

      const tradeOperationId = response.data.id;

      // Add sellers to the trade operation
      await api.post(API_ENDPOINTS.tradeOperations.addSellers(tradeOperationId), {
        sellers,
      });

      // Success feedback with toast
      toast.success('Trade operation created successfully!', {
        description: `Operation ID: ${tradeOperationId.substring(0, 8)}... | Expected profit: €${profitMetrics.totalProfit.toFixed(2)}`,
      });

      onSubmit(sellers);
      onClose();
    } catch (err: any) {
      console.error('Error creating trade operation:', err);
      setError(err.response?.data?.message || 'Failed to create trade operation. Please try again.');
      handleApiError(err, 'Failed to create trade operation');
    } finally {
      setIsSendingOffers(false);
    }
  };

  const isProfitLow = !loading && profitMetrics.totalProfit < 10;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <DialogTitle>Calculating transport costs...</DialogTitle>
            <DialogDescription className="mt-2">This may take a few moments</DialogDescription>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create Offers</DialogTitle>
              <DialogDescription>
                <span className="font-medium text-foreground">{buyerOrder.buyer?.company?.legalName || buyerOrder.buyer?.name}</span>
                {' • '}
                <span>{buyerOrder.product?.name}</span>
                {' • '}
                <span>
                  {buyerOrder.quantity}t @{' '}
                  {buyerTargetPrice !== null
                    ? `€${buyerTargetPrice.toFixed(
                        buyerTargetPrice % 1 === 0 ? 0 : 2,
                      )}/t`
                    : 'Price TBD'}
                </span>
              </DialogDescription>
            </DialogHeader>

        {/* Table */}
        <div className="overflow-x-auto mb-4 border border-gray-300 rounded">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="text-left p-3 text-sm font-semibold text-text-primary">Seller</th>
                <th className="text-right p-3 text-sm font-semibold text-text-primary">Quantity</th>
                <th className="text-right p-3 text-sm font-semibold text-text-primary">Distance</th>
                <th className="text-right p-3 text-sm font-semibold text-text-primary">Transport</th>
                <th className="text-right p-3 text-sm font-semibold text-text-primary">Offer Price</th>
                <th className="text-right p-3 text-sm font-semibold text-text-primary">Profit</th>
              </tr>
            </thead>
            <tbody>
              {profitMetrics.sellerData.map((data) => (
                <tr key={data.seller.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-sm text-text-primary">{data.seller.seller?.company?.legalName || data.seller.seller?.name}</p>
                      {data.seller.seller?.company && (
                        <span className="text-xs bg-primary text-text-primary px-2 py-0.5 rounded font-semibold mt-1 inline-block">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-3 text-sm text-text-primary">{data.seller.quantity}t</td>
                  <td className="text-right p-3 text-sm text-text-secondary">
                    {data.transport?.distance ? `${data.transport.distance}km` : 'N/A'}
                  </td>
                  <td className="text-right p-3 text-sm text-text-primary font-medium">
                    €{data.transportCost.toFixed(2)}
                  </td>
                  <td className="text-right p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        value={data.offerPrice}
                        onChange={(e) => handleOfferPriceChange(data.seller.id, e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-24 text-right h-8"
                      />
                      <span className="text-sm text-text-secondary">/t</span>
                    </div>
                  </td>
                  <td className="text-right p-3">
                    <span
                      className={`font-semibold text-sm ${
                        data.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      €{data.profit.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                <td colSpan={3} className="p-3 text-right text-sm text-text-primary">Total:</td>
                <td className="text-right p-3 text-sm text-text-primary">€{profitMetrics.totalTransport.toFixed(2)}</td>
                <td className="text-right p-3 text-sm text-text-secondary">-</td>
                <td className="text-right p-3">
                  <span
                    className={`text-base font-bold ${
                      profitMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    €{profitMetrics.totalProfit.toFixed(2)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

            {/* Warning */}
            {isProfitLow && (
              <Alert className="bg-yellow-50 border-yellow-300 text-yellow-800">
                <AlertDescription>
                  <p className="font-semibold mb-1">
                    ⚠️ Warning: Profit below €10 target (Current: €{profitMetrics.totalProfit.toFixed(2)})
                  </p>
                  <p className="text-xs text-yellow-700">
                    Consider adjusting offer prices to increase profit margin.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button onClick={onClose} variant="secondary">
                Cancel
              </Button>
              <Button
                onClick={handleSendOffers}
                disabled={isSendingOffers}
                aria-label="Send offers to selected sellers"
                variant={profitMetrics.totalProfit >= 0 ? "default" : "destructive"}
                className="gap-2"
              >
                {isSendingOffers && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSendingOffers ? 'Creating Offers...' : 'Send Offers'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;
