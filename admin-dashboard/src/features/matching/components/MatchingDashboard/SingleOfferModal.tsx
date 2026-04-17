import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, AlertCircle, MapPin, Package, TrendingUp, Truck, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getBuyerTargetPrice, getSellerUnitPrice } from '../../../../utils/pricing';
import type { BuyListing, SaleListing, TradeOperation } from '../../../../types/listings';
import type { TransportCostResult } from '../../../../types';
import { negotiationService, tradeOperationService } from '../../../../services/api';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import GlobalTradeMap from './GlobalTradeMap';

interface SingleOfferModalProps {
  open: boolean;
  onClose: () => void;
  buyerOrder: BuyListing;
  seller: SaleListing;
  tradeOperationId: string | null;
  existingTradeSeller?: TradeOperation['sellers'][number] | null;
  sellerStatus?: { status: string; source: 'tradeSeller' | 'negotiation'; negotiationId?: string };
  onOfferSent: () => void;
}

const SingleOfferModal: React.FC<SingleOfferModalProps> = ({
  open,
  onClose,
  buyerOrder,
  seller,
  tradeOperationId,
  existingTradeSeller,
  sellerStatus,
  onOfferSent,
}) => {
  const buyerTargetPrice = getBuyerTargetPrice(buyerOrder);
  const defaultQuantity = useMemo(() => {
    return Math.min(seller.quantity, buyerOrder.quantity);
  }, [seller.quantity, buyerOrder.quantity]);

  const defaultPrice = useMemo(() => {
    const sellerPrice = getSellerUnitPrice(seller);
    if (sellerPrice !== null) return sellerPrice;
    if (buyerTargetPrice !== null) return Math.max(0, buyerTargetPrice - 15);
    return 0;
  }, [seller, buyerTargetPrice]);

  const [price, setPrice] = useState<number>(defaultPrice);
  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [terms, setTerms] = useState<string>('Payment: Net 30 days\nQuality inspection upon delivery\nDelivery terms as per contract');
  const [transportEstimate, setTransportEstimate] = useState<TransportCostResult | null>(null);
  const [loadingTransport, setLoadingTransport] = useState(false);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const buyerAddressId = buyerOrder.deliveryAddressId ?? buyerOrder.deliveryAddress?.id ?? null;

  useEffect(() => {
    if (!open) return;
    setPrice(defaultPrice);
    setQuantity(defaultQuantity);
    setTerms('Payment: Net 30 days\nQuality inspection upon delivery\nDelivery terms as per contract');
    fetchTransportEstimate();
  }, [open, defaultPrice, defaultQuantity]);

  const fetchTransportEstimate = async () => {
    if (!buyerAddressId) {
      setTransportEstimate(null);
      setTransportError('Buyer delivery address is missing.');
      return;
    }

    try {
      setLoadingTransport(true);
      setTransportError(null);
      const response = await tradeOperationService.calculateTransport({
        buyerAddressId,
        sellerIds: [seller.sellerId],
      });
      const match = response.results?.find((res) => res.sellerId === seller.sellerId) || null;
      setTransportEstimate(match);
    } catch (error) {
      console.error('Failed to calculate transport cost:', error);
      setTransportEstimate(null);
      setTransportError('Unable to calculate transport cost.');
    } finally {
      setLoadingTransport(false);
    }
  };

  const calculations = useMemo(() => {
    const productCost = price * quantity;
    const transportCost = transportEstimate?.transportCost || 0;
    const totalCost = productCost + transportCost;

    let marginPerTon = null;
    let totalMargin = null;
    let meetsTarget = true;

    if (buyerTargetPrice && quantity > 0) {
      const transportPerTon = transportCost / quantity;
      marginPerTon = buyerTargetPrice - price - transportPerTon;
      totalMargin = marginPerTon * quantity;
      meetsTarget = marginPerTon >= 10;
    }

    return {
      productCost,
      transportCost,
      totalCost,
      marginPerTon,
      totalMargin,
      meetsTarget,
    };
  }, [price, quantity, transportEstimate, buyerTargetPrice]);

  const handleSendOffer = async () => {
    if (!tradeOperationId) {
      toast.error('Create a trade operation before sending offers.');
      return;
    }

    if (quantity <= 0 || price <= 0) {
      toast.error('Enter a valid price and quantity.');
      return;
    }

    if (!calculations.meetsTarget && calculations.marginPerTon !== null) {
      toast.warning('Margin is below €10/t target. Proceed with caution.');
    }

    try {
      setSubmitting(true);

      let tradeSellerId = existingTradeSeller?.id;

      if (!tradeSellerId) {
        await api.post(API_ENDPOINTS.tradeOperations.addSellers(tradeOperationId), {
          sellers: [
            {
              sellerId: seller.sellerId,
              saleListingId: seller.id,
              requestedQuantity: quantity,
            },
          ],
        });

        const updated = await tradeOperationService.getById(tradeOperationId);
        const newTradeSeller = updated.sellers?.find((ts: { id?: string; saleListingId?: string; saleListing?: { id?: string; saleListingId?: string } }) => {
          const saleListingId =
            ts?.saleListingId || ts?.saleListing?.id || ts?.saleListing?.saleListingId;
          return saleListingId === seller.id;
        });

        if (!newTradeSeller) {
          throw new Error('Failed to add seller to trade operation.');
        }

        tradeSellerId = newTradeSeller.id;
      }

      await negotiationService.create(tradeOperationId, {
        tradeSellerId,
        price,
        quantity,
        terms,
      });

      toast.success('Offer sent successfully!');
      onOfferSent();
    } catch (error) {
      console.error('Failed to send offer:', error);
      toast.error('Failed to send offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const buyerMarkers = useMemo(() => {
    const lat = buyerOrder.deliveryAddress?.latitude || 42.7;
    const lng = buyerOrder.deliveryAddress?.longitude || 25.5;
    return [
      {
        id: buyerOrder.id,
        name: buyerOrder.buyer?.company?.legalName || buyerOrder.buyer?.name || 'Buyer',
        lat,
        lng,
        product: buyerOrder.product?.name,
        quantity: buyerOrder.quantity,
      },
    ];
  }, [buyerOrder]);

  const sellerMarkers = useMemo(() => {
    const lat = seller.address?.latitude || 42.7;
    const lng = seller.address?.longitude || 25.5;
    return [
      {
        id: seller.id,
        name: seller.seller?.company?.legalName || seller.seller?.name || 'Seller',
        lat,
        lng,
        product: seller.product?.name,
        quantity,
        verified: false,
      },
    ];
  }, [seller, quantity]);

  const disableSubmit = submitting || price <= 0 || quantity <= 0 || !tradeOperationId;

  const formatLocationString = (address: { city?: string; region?: string } | null | undefined) => {
    if (!address) return 'Unknown location';
    return [address.city, address.region].filter(Boolean).join(', ');
  };

  const sellerAskingPrice = getSellerUnitPrice(seller);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            {sellerStatus ? 'Update Offer' : 'Send Offer'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Configure and send a custom offer to this seller
          </DialogDescription>
        </DialogHeader>

        {/* Map Section */}
        <div className="w-full h-64 rounded-lg overflow-hidden border bg-muted">
          <GlobalTradeMap
            buyers={buyerMarkers}
            sellers={sellerMarkers}
            selectedBuyerId={buyerOrder.id}
            selectedSellerIds={[seller.id]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Trade Parties */}
          <div className="space-y-4">
            {/* Buyer Info */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Buyer</h3>
              </div>
              <div className="flex items-start gap-3">
                {buyerOrder.product?.image ? (
                  <img
                    src={buyerOrder.product.image}
                    alt={buyerOrder.product?.name}
                    className="w-12 h-12 object-cover rounded border"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center border">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {buyerOrder.buyer?.company?.legalName || buyerOrder.buyer?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{buyerOrder.product?.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{formatLocationString(buyerOrder.deliveryAddress)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-medium">{buyerOrder.quantity} {buyerOrder.unit}</span>
                    {buyerTargetPrice !== null && (
                      <span className="text-muted-foreground">
                        Target: €{buyerTargetPrice.toFixed(2)}/{buyerOrder.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Seller</h3>
              </div>
              <div className="flex items-start gap-3">
                {seller.product?.image ? (
                  <img
                    src={seller.product.image}
                    alt={seller.product?.name}
                    className="w-12 h-12 object-cover rounded border"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center border">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {seller.seller?.company?.legalName || seller.seller?.name || 'Unknown Seller'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{seller.product?.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{formatLocationString(seller.address)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-medium">{seller.quantity} {seller.unit} available</span>
                    {sellerAskingPrice !== null && (
                      <span className="text-muted-foreground">
                        Asking: €{sellerAskingPrice.toFixed(2)}/{seller.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {sellerStatus && (
                <Alert className="mt-3 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800">
                    Current status: <strong>{sellerStatus.status}</strong>. Sending a new offer will create an additional negotiation.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Right Column - Offer Configuration */}
          <div className="space-y-4">
            {/* Offer Inputs */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-4">Offer Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-xs">Quantity ({buyerOrder.unit})</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={seller.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">Max: {seller.quantity} {seller.unit}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs">Price (€/{buyerOrder.unit})</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step={0.01}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="h-9"
                    />
                    {buyerTargetPrice !== null && (
                      <p className="text-xs text-muted-foreground">
                        Target: €{buyerTargetPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-xs">Terms & Notes</Label>
                  <Textarea
                    id="terms"
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Cost Breakdown</h3>
              </div>

              <div className="space-y-3">
                {/* Transport */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Transport</span>
                  </div>
                  {loadingTransport ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : transportEstimate ? (
                    <div className="text-right">
                      <p className="font-medium">€{transportEstimate.transportCost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{transportEstimate.distance.toFixed(0)} km</p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>

                {transportError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{transportError}</AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Product Cost */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">€{calculations.productCost.toFixed(2)}</span>
                </div>

                {/* Total Cost */}
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total Cost</span>
                  <span>€{calculations.totalCost.toFixed(2)}</span>
                </div>

                <Separator />

                {/* Margin */}
                {calculations.marginPerTon !== null ? (
                  <div className="rounded-md bg-muted p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className={`w-4 h-4 ${calculations.meetsTarget ? 'text-green-600' : 'text-red-600'}`} />
                      <span className="text-sm font-medium">Profit Margin</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Per {buyerOrder.unit}</p>
                        <p className={`font-semibold ${calculations.meetsTarget ? 'text-green-600' : 'text-red-600'}`}>
                          €{calculations.marginPerTon.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className={`font-semibold ${calculations.meetsTarget ? 'text-green-600' : 'text-red-600'}`}>
                          €{calculations.totalMargin!.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${calculations.meetsTarget ? 'text-green-600' : 'text-red-600'}`}>
                      {calculations.meetsTarget ? '✓ Meets €10/t target' : '⚠ Below €10/t target'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Set buyer target price to see margin</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSendOffer} disabled={disableSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sellerStatus ? 'Update Offer' : 'Send Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SingleOfferModal;
