import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { handleApiError } from '../../utils/errorHandler';

interface SaleListing {
  id: string;
  sellerId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  seller?: {
    id: string;
    businessName: string;
    verificationStatus: string;
  };
  product?: {
    id: string;
    name: string;
  };
}

interface BuyListing {
  id: string;
  quantity: number;
  targetPrice: number;
  deliveryAddressId: string;
  buyer?: {
    businessName: string;
  };
  product?: {
    name: string;
  };
}

interface TransportResult {
  sellerId: string;
  distance: number;
  transportCost: number;
}

interface PricingModalProps {
  selectedSellers: SaleListing[];
  buyerOrder: BuyListing;
  onClose: () => void;
  onSubmit: (offers: any[]) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  selectedSellers,
  buyerOrder,
  onClose,
  onSubmit,
}) => {
  const [offerPrices, setOfferPrices] = useState<Record<string, number>>({});
  const [transportData, setTransportData] = useState<TransportResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingOffers, setIsSendingOffers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transport costs on mount
  useEffect(() => {
    fetchTransportCosts();
  }, []);

  const fetchTransportCosts = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:4001/trade-operations/calculate-transport', {
        sellerIds: selectedSellers.map((s) => s.sellerId),
        buyerAddressId: buyerOrder.deliveryAddressId,
      });

      setTransportData(response.data.results);

      // Initialize offer prices with seller's original price
      const initialPrices: Record<string, number> = {};
      selectedSellers.forEach((seller) => {
        initialPrices[seller.id] = seller.pricePerUnit;
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
    const sellerData = selectedSellers.map((seller) => {
      const transport = transportData.find((t) => t.sellerId === seller.sellerId);
      const offerPrice = offerPrices[seller.id] || seller.pricePerUnit;

      const sellerRevenue = offerPrice * seller.quantity;
      const buyerRevenue = buyerOrder.targetPrice * seller.quantity;
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
  }, [selectedSellers, transportData, offerPrices, buyerOrder]);

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
      const response = await axios.post('http://localhost:4001/trade-operations', {
        buyListingId: buyerOrder.id,
        targetProfitMargin: 7, // Default 7% margin
        qualityPreference: 'ANY',
        notes: `Created from matching dashboard. Total expected profit: €${profitMetrics.totalProfit.toFixed(2)}`,
      });

      const tradeOperationId = response.data.id;

      // Add sellers to the trade operation
      await axios.post(`http://localhost:4001/trade-operations/${tradeOperationId}/sellers`, {
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold">Calculating transport costs...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isProfitLow = profitMetrics.totalProfit < 10;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full mx-4 my-8">
        {/* Header */}
        <div className="mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create Offers</h2>
          <p className="text-sm text-gray-600 mt-1">
            {buyerOrder.buyer?.businessName} - {buyerOrder.product?.name} ({buyerOrder.quantity}t @ €{buyerOrder.targetPrice}/t)
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3 text-sm font-semibold">Seller</th>
                <th className="text-right p-3 text-sm font-semibold">Quantity</th>
                <th className="text-right p-3 text-sm font-semibold">Distance</th>
                <th className="text-right p-3 text-sm font-semibold">Transport</th>
                <th className="text-right p-3 text-sm font-semibold">Offer Price</th>
                <th className="text-right p-3 text-sm font-semibold">Profit</th>
              </tr>
            </thead>
            <tbody>
              {profitMetrics.sellerData.map((data) => (
                <tr key={data.seller.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-sm">{data.seller.seller?.businessName}</p>
                      {data.seller.seller?.verificationStatus === 'VERIFIED' && (
                        <span className="text-xs text-green-600">✓ Verified</span>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-3 text-sm">{data.seller.quantity}t</td>
                  <td className="text-right p-3 text-sm">
                    {data.transport?.distance ? `${data.transport.distance}km` : 'N/A'}
                  </td>
                  <td className="text-right p-3 text-sm">
                    €{data.transportCost.toFixed(2)}
                  </td>
                  <td className="text-right p-3">
                    <input
                      type="number"
                      value={data.offerPrice}
                      onChange={(e) => handleOfferPriceChange(data.seller.id, e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                    />
                    <span className="ml-1 text-sm">/t</span>
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
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className="p-3 text-right">Total:</td>
                <td className="text-right p-3">€{profitMetrics.totalTransport.toFixed(2)}</td>
                <td className="text-right p-3">-</td>
                <td className="text-right p-3">
                  <span
                    className={`text-lg ${
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
          <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded p-4">
            <p className="text-yellow-800 text-sm font-semibold">
              ⚠️ Warning: Profit below €10 target (Current: €{profitMetrics.totalProfit.toFixed(2)})
            </p>
            <p className="text-yellow-700 text-xs mt-1">
              Consider adjusting offer prices to increase profit margin.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSendOffers}
            disabled={isSendingOffers}
            aria-label="Send offers to selected sellers"
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2
              ${
                isSendingOffers
                  ? 'bg-gray-400 text-gray-200 cursor-wait'
                  : profitMetrics.totalProfit >= 0
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-md'
              }
            `}
          >
            {isSendingOffers && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSendingOffers ? 'Creating Offers...' : 'Send Offers'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
