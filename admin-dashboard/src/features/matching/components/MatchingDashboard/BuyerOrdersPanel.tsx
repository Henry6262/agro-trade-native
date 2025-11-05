import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import type { BuyListing } from '../../../../types/listings';
import { formatLocation } from '../../../../utils/locationHelpers';
import { LoadingState, ErrorState, MetricBadge } from '../../../../components/common';
import SpecificationBadge from './SpecificationBadge';
import { getProductTheme } from '../../../../styles/designSystem';
import { API_ENDPOINTS } from '../../../../config/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBuyerTargetPrice } from '../../../../utils/pricing';

interface AutoOfferSummaryProps {
  hasBuyerPrice: boolean;
  readyCount: number;
  canSend: boolean;
  sending: boolean;
  statusMessage: string;
}

interface BuyerOrdersPanelProps {
  selectedOrderId?: string;
  onOrderSelect: (order: BuyListing) => void;
  autoOfferSummary?: AutoOfferSummaryProps | null;
  onSendAutoOffers?: () => void;
}

export const BuyerOrdersPanel: React.FC<BuyerOrdersPanelProps> = ({
  selectedOrderId,
  onOrderSelect,
  autoOfferSummary,
  onSendAutoOffers,
}) => {
  const [orders, setOrders] = useState<BuyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.buyer.listings);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching buyer orders:', err);
      setError('Failed to load buyer orders');
    } finally {
      setLoading(false);
    }
  };

  // Group orders by corporation
  const groupedOrders = orders.reduce((acc, order) => {
    const corp = order.buyer?.company?.legalName || order.buyer?.name || 'Unknown Corporation';
    if (!acc[corp]) {
      acc[corp] = [];
    }
    acc[corp].push(order);
    return acc;
  }, {} as Record<string, BuyListing[]>);

  if (loading) {
    return <LoadingState message="Loading buyer orders..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchOrders} />;
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-[4rem] leading-none">🏢</span>
          <div>
            <h3 className="font-bold text-lg text-text-primary">Buyer Orders</h3>
            <p className="text-sm text-text-secondary mt-0.5">{orders.length} active orders</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {Object.entries(groupedOrders).map(([corporation, corpOrders]) => (
          <Card key={corporation} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <div>
                    <CardTitle className="text-base">{corporation}</CardTitle>
                    <CardDescription className="text-xs">
                      {corpOrders.length} {corpOrders.length === 1 ? 'order' : 'orders'}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline">
                  {corpOrders.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {corpOrders.map((order, index) => {
                const productTheme = getProductTheme(order.product?.name || '');
                const isSelected = selectedOrderId === order.id;
                const buyerTargetPrice = getBuyerTargetPrice(order);
                const showAutoOfferControls = isSelected && autoOfferSummary;

                return (
                  <div
                    key={order.id}
                    onClick={() => onOrderSelect(order)}
                    className={`
                      relative cursor-pointer transition p-4
                      ${index > 0 ? 'border-t border-gray-200' : ''}
                      ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    {/* Selected Indicator Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                    )}

                    <div className={`flex gap-3 ${isSelected ? 'pl-3' : ''}`}>
                      {/* Product Image - Square, Full Height */}
                      <div className="flex-shrink-0">
                        {order.product?.image ? (
                          <img
                            src={order.product.image}
                            alt={order.product.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-4xl">{productTheme.emoji}</span>
                          </div>
                        )}
                      </div>

                      {/* Content on Right */}
                      <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                        <div className="flex-1">
                          {/* Product Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-bold text-base text-text-primary">
                              {order.product?.name || 'Unknown Product'}
                            </h5>
                            {isSelected && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold border border-blue-300">
                                SELECTED
                              </span>
                            )}
                          </div>

                          {/* Location */}
                          <p className="text-sm text-text-secondary flex items-center gap-1 mb-2">
                            <span>📍</span>
                            {(() => {
                              const { city, region } = formatLocation(order.deliveryAddress);
                              return (
                                <>
                                  <span className="font-medium">{city}</span>
                                  <span>•</span>
                                  <span>{region}</span>
                                </>
                              );
                            })()}
                          </p>

                          {/* Metrics */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <MetricBadge icon="📦" value={order.quantity} unit={order.unit} />
                            <MetricBadge
                              icon="💵"
                              value={
                                buyerTargetPrice !== null
                                  ? `Max €${buyerTargetPrice.toFixed(
                                      buyerTargetPrice % 1 === 0 ? 0 : 2,
                                    )}`
                                  : 'Max €—'
                              }
                              unit={`/${order.unit}`}
                            />
                          </div>

                          {/* Specifications */}
                          {order.specifications && order.specifications.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {order.specifications.map((spec) => (
                                <SpecificationBadge key={spec.id} spec={spec} variant="compact" />
                              ))}
                            </div>
                          )}

                          {showAutoOfferControls && (
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span className="text-xs text-blue-700">
                                {autoOfferSummary?.statusMessage}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!autoOfferSummary?.canSend}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (autoOfferSummary?.canSend && onSendAutoOffers) {
                                    onSendAutoOffers();
                                  }
                                }}
                              >
                                {autoOfferSummary?.sending ? 'Sending…' : 'Send Auto Offers'}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <span className="text-primary text-xl">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BuyerOrdersPanel;
