import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../../services/api';
import type { SaleListing } from '../../../../types/listings';
import type { Negotiation } from '../../../../types';
import { formatLocation } from '../../../../utils/locationHelpers';
import { LoadingState, ErrorState, EmptyState, MetricBadge } from '../../../../components/common';
import SpecificationBadge from './SpecificationBadge';
import { getProductTheme, qualityGradeThemes } from '../../../../styles/designSystem';
import { API_ENDPOINTS } from '../../../../config/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { getSellerUnitPrice } from '../../../../utils/pricing';
import type { TransportCostResult } from '../../../../types';
import type { AutoOfferPlanOffer, AutoOfferSkip } from '../../utils/autoOffer';

interface SellerCardsPanelProps {
  filterProduct?: string;
  selectedSellerIds: string[];
  onSellerToggle: (seller: SaleListing) => void;
  highlightedSellerId?: string;
  onSellersLoaded?: (sellers: SaleListing[]) => void;
  transportCosts?: Record<string, TransportCostResult>;
  transportLoading?: boolean;
  transportError?: string | null;
  transportWarnings?: string[];
  recommendedSellerIds?: string[];
  recommendationDetails?: Record<string, AutoOfferPlanOffer>;
  recommendationReasons?: Record<string, AutoOfferSkip>;
  negotiationBySaleListingId?: Map<string, Negotiation>;
}

const SellerCardsPanel: React.FC<SellerCardsPanelProps> = ({
  filterProduct,
  selectedSellerIds,
  onSellerToggle,
  highlightedSellerId,
  onSellersLoaded,
  transportCosts = {},
  transportLoading = false,
  transportError = null,
  transportWarnings = [],
  recommendedSellerIds,
  recommendationDetails = {},
  recommendationReasons = {},
  negotiationBySaleListingId,
}) => {
  const [sellers, setSellers] = useState<SaleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'verified' | 'quantity' | 'price'>('verified');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified'>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [minQuantity, setMinQuantity] = useState<number>(0);

  useEffect(() => {
    fetchSellers();
  }, [filterProduct]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.seller.listings);
      let filtered = response.data;

      if (filterProduct) {
        filtered = filtered.filter((s: SaleListing) => s.product?.name === filterProduct);
      }

      setSellers(filtered);
      setError(null);
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setError('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      if (filterRegion !== 'all') {
        const { region } = formatLocation(seller.address);
        if (region !== filterRegion) {
          return false;
        }
      }

      if (seller.quantity < minQuantity) {
        return false;
      }

      return true;
    });
  }, [sellers, filterRegion, minQuantity]);

  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          sellers
            .map((s) => formatLocation(s.address).region)
            .filter((region) => region && region !== 'Unknown'),
        ),
      ),
    [sellers],
  );

  const sortedSellers = useMemo(() => {
    const clone = [...filteredSellers];

    clone.sort((a, b) => {
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }

      if (sortBy === 'price') {
        const priceA = getSellerUnitPrice(a);
        const priceB = getSellerUnitPrice(b);

        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1;
        if (priceB === null) return -1;

        return priceA - priceB;
      }

      return b.quantity - a.quantity;
    });

    return clone;
  }, [filteredSellers, sortBy]);

  const recommendedSet = useMemo(
    () => new Set(recommendedSellerIds ?? []),
    [recommendedSellerIds],
  );

  const goldenSellers = useMemo(
    () => sortedSellers.filter((seller) => recommendedSet.has(seller.id)),
    [sortedSellers, recommendedSet],
  );

  const manualSellers = useMemo(
    () => sortedSellers.filter((seller) => !recommendedSet.has(seller.id)),
    [sortedSellers, recommendedSet],
  );

  useEffect(() => {
    if (onSellersLoaded) {
      onSellersLoaded(filteredSellers);
    }
  }, [filteredSellers, onSellersLoaded]);

  if (loading) {
    return <LoadingState message="Loading sellers..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchSellers} />;
  }

  const totalRecommended = goldenSellers.length;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[4rem] leading-none">🧑‍🌾</span>
            <div>
              <h3 className="font-bold text-lg text-text-primary">Available Sellers</h3>
              <p className="text-sm text-text-secondary mt-0.5">
                {sortedSellers.length} suppliers ready
              </p>
            </div>
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verified">Verified First</SelectItem>
              <SelectItem value="quantity">Highest Quantity</SelectItem>
              <SelectItem value="price">Lowest Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setFilterVerified('all')}
              variant={filterVerified === 'all' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs"
            >
              All
            </Button>
            <Button
              onClick={() => setFilterVerified('verified')}
              variant={filterVerified === 'verified' ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs"
            >
              ✓ Verified
            </Button>
          </div>

          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-[150px] text-xs h-8">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-3 bg-gray-50 rounded px-3 py-1.5 border border-gray-200">
            <label className="text-xs text-text-secondary font-medium">Min:</label>
            <Slider
              value={[minQuantity]}
              onValueChange={(value) => setMinQuantity(value[0])}
              min={0}
              max={100}
              step={10}
              className="w-24"
            />
            <span className="text-xs font-semibold text-text-primary min-w-[2.5rem]">{minQuantity}t</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
          <span>{sortedSellers.length} sellers</span>
          {filterProduct && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium border border-blue-300">
              {filterProduct}
            </span>
          )}
          {selectedSellerIds.length > 0 && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium border border-green-300">
              {selectedSellerIds.length} selected
            </span>
          )}
          {transportLoading && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium border border-purple-200">
              Calculating transport...
            </span>
          )}
          {transportError && !transportLoading && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-medium border border-red-200">
              Transport unavailable
            </span>
          )}
          {!transportError && !transportLoading && transportWarnings.length > 0 && (
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium border border-amber-200">
              {transportWarnings[0]}
            </span>
          )}
          {totalRecommended > 0 && (
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium border border-emerald-200">
              {totalRecommended} golden match{totalRecommended === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {sortedSellers.length === 0 ? (
          <EmptyState
            icon="🌾"
            title={filterProduct ? `No sellers found for ${filterProduct}` : 'No sellers available'}
            description={filterProduct ? 'Try adjusting your filters or selecting a different product' : 'Sellers will appear here once they list their products'}
          />
        ) : (
          <>
            {goldenSellers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  <span>✅ Golden Matches</span>
                  <span className="text-emerald-600">{goldenSellers.length}</span>
                </div>
                {goldenSellers.map((seller) => (
                  <SellerCard
                    key={seller.id}
                    seller={seller}
                    isSelected={selectedSellerIds.includes(seller.id)}
                    isHighlighted={highlightedSellerId === seller.id}
                    onToggle={onSellerToggle}
                    transportEstimate={transportCosts[seller.sellerId]}
                    recommendation={recommendationDetails[seller.id]}
                    negotiation={negotiationBySaleListingId?.get(seller.id)}
                  />
                ))}
              </div>
            )}

            {manualSellers.length > 0 && goldenSellers.length > 0 && (
              <div className="border-t border-dashed border-gray-300 pt-4 mt-6" />
            )}

            {manualSellers.length > 0 && (
              <div className="space-y-3">
                {goldenSellers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    <span>Manual Review</span>
                    <span className="text-amber-600">{manualSellers.length}</span>
                  </div>
                )}
                {manualSellers.map((seller) => (
                  <SellerCard
                    key={seller.id}
                    seller={seller}
                    isSelected={selectedSellerIds.includes(seller.id)}
                    isHighlighted={highlightedSellerId === seller.id}
                    onToggle={onSellerToggle}
                    transportEstimate={transportCosts[seller.sellerId]}
                    reason={recommendationReasons[seller.id]}
                    negotiation={negotiationBySaleListingId?.get(seller.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface SellerCardProps {
  seller: SaleListing;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggle: (seller: SaleListing) => void;
  transportEstimate?: TransportCostResult;
  recommendation?: AutoOfferPlanOffer;
  reason?: AutoOfferSkip;
  negotiation?: Negotiation;
}

const SellerCard: React.FC<SellerCardProps> = ({
  seller,
  isSelected,
  isHighlighted,
  onToggle,
  transportEstimate,
  recommendation,
  negotiation,
  reason,
}) => {
  const productTheme = getProductTheme(seller.product?.name || '');
  const gradeTheme = seller.qualityGrade
    ? qualityGradeThemes[seller.qualityGrade as keyof typeof qualityGradeThemes]
    : null;
  const unitPrice = getSellerUnitPrice(seller);
  const isGolden = Boolean(recommendation);

  return (
    <Card
      onClick={() => onToggle(seller)}
      className={`
        relative cursor-pointer transition-all
        ${
          negotiation?.status === 'PENDING'
            ? 'bg-yellow-50/50 border-yellow-400 border-2 shadow-md'
            : negotiation?.status === 'ACCEPTED'
            ? 'bg-green-50/50 border-green-400 border-2 shadow-md'
            : negotiation?.status === 'REJECTED'
            ? 'bg-red-50/30 border-red-300 border-2 opacity-70'
            : negotiation?.status === 'COUNTERED'
            ? 'bg-orange-50/50 border-orange-400 border-2 shadow-md'
            : isSelected
            ? 'border-primary shadow-md'
            : 'hover:border-gray-400 hover:shadow'
        }
        ${isHighlighted ? 'ring-2 ring-primary' : ''}
      `}
    >
      <CardContent className="p-4">
        <div className="absolute top-3 right-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => {}}
            className="w-5 h-5 bg-white"
          />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {seller.product?.image ? (
              <img
                src={seller.product.image}
                alt={seller.product.name}
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-3xl">{productTheme.emoji}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h4 className="font-bold text-base text-text-primary">
                  {seller.seller?.company?.legalName || seller.seller?.name || 'Unknown Seller'} - {seller.product?.name || 'Unknown Product'}
                </h4>
                {isGolden && recommendation && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    100% Match
                  </span>
                )}
                {negotiation && (
                  <>
                    {negotiation.status === 'PENDING' && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-semibold border border-yellow-300">
                        🕐 Offer Pending
                      </span>
                    )}
                    {negotiation.status === 'ACCEPTED' && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold border border-green-300">
                        ✓ Offer Accepted
                      </span>
                    )}
                    {negotiation.status === 'REJECTED' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold border border-red-300">
                        ✗ Offer Declined
                      </span>
                    )}
                    {negotiation.status === 'COUNTERED' && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-semibold border border-orange-300">
                        ⇄ Counter Offer
                      </span>
                    )}
                  </>
                )}
              </div>

              <p className="text-sm text-text-secondary flex items-center gap-1 mb-3">
                <span>📍</span>
                {(() => {
                  const { city, region } = formatLocation(seller.address);
                  return (
                    <>
                      <span>{city}</span>
                      <span>•</span>
                      <span>{region}</span>
                    </>
                  );
                })()}
              </p>

              <div className="flex items-center gap-2 flex-wrap mb-2">
                <MetricBadge icon="📦" value={seller.quantity} unit={seller.unit} />
                <MetricBadge
                  icon="💰"
                  value={unitPrice !== null ? `€${unitPrice.toFixed(unitPrice % 1 === 0 ? 0 : 2)}` : '—'}
                  unit={unitPrice !== null ? `/${seller.unit}` : undefined}
                />
                <MetricBadge
                  icon="🚚"
                  value={
                    transportEstimate
                      ? `€${transportEstimate.transportCost.toFixed(0)}`
                      : 'Transport TBD'
                  }
                  unit={
                    transportEstimate
                      ? `(${transportEstimate.distance.toFixed(0)}km)`
                      : undefined
                  }
                />
                {isGolden && recommendation && (
                  <MetricBadge
                    icon="🧮"
                    value={`€${recommendation.totalCostPerTon.toFixed(2)}`}
                    unit={`/${seller.unit}`}
                    variant="success"
                  />
                )}
                {gradeTheme && (
                  <MetricBadge
                    icon={gradeTheme.emoji}
                    value={gradeTheme.label}
                    variant="primary"
                  />
                )}
              </div>

              {seller.specifications && seller.specifications.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {seller.specifications.map((spec) => (
                    <SpecificationBadge key={spec.id} spec={spec} variant="compact" />
                  ))}
                </div>
              )}

              {isGolden && recommendation && (
                <p className="text-[0.65rem] text-emerald-700 font-semibold mt-1">
                  Budget slack €{recommendation.budgetSlackPerTon.toFixed(2)}/t
                </p>
              )}

              {!isGolden && reason && (
                <p className="text-[0.65rem] text-amber-700 font-semibold mt-1">
                  ⚠️ {reason.reason}
                </p>
              )}
            </div>

            {isSelected && (
              <div className="flex-shrink-0">
                <span className="text-primary text-xl">✓</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerCardsPanel;
