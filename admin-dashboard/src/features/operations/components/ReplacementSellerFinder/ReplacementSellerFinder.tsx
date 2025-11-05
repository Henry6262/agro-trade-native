import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import { ErrorState, SkeletonGrid, EnhancedTooltip } from '../../../../components/common';
import type { MatchedSeller } from '../../../../types/listings';

interface ReplacementSellerFinderProps {
  isOpen: boolean;
  onClose: () => void;
  tradeOperationId: string;
  productId: string;
  neededQuantity: number;
  unit: string;
  onSellersAdded: () => void;
}

export const ReplacementSellerFinder: React.FC<ReplacementSellerFinderProps> = ({
  isOpen,
  onClose,
  tradeOperationId,
  productId,
  neededQuantity,
  unit,
  onSellersAdded,
}) => {
  const { toast } = useToast();
  const [sellers, setSellers] = useState<MatchedSeller[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSellers, setSelectedSellers] = useState<Set<string>>(new Set());
  const [sendingOffers, setSendingOffers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'distance' | 'price' | 'quality'>('score');

  useEffect(() => {
    if (isOpen) {
      fetchMatchingSellers();
    }
  }, [isOpen, tradeOperationId]);

  const fetchMatchingSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.tradeOperations.matchingSellers(tradeOperationId));
      // Backend returns { sellers: [...], totalQuantityAvailable, averagePrice, recommendedSellers }
      setSellers(response.data.sellers || response.data);
    } catch (err) {
      console.error('Error fetching matching sellers:', err);
      setError('Failed to load matching sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeller = (saleListingId: string) => {
    const newSelected = new Set(selectedSellers);
    if (newSelected.has(saleListingId)) {
      newSelected.delete(saleListingId);
    } else {
      newSelected.add(saleListingId);
    }
    setSelectedSellers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSellers.size === sellers.length) {
      setSelectedSellers(new Set());
    } else {
      setSelectedSellers(new Set(sellers.map(s => s.saleListingId)));
    }
  };

  const calculateTotalSelected = () => {
    return sellers
      .filter(s => selectedSellers.has(s.saleListingId))
      .reduce((sum, s) => sum + s.availableQuantity, 0);
  };

  const handleSendOffers = async () => {
    if (selectedSellers.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Sellers Selected',
        description: 'Please select at least one seller',
      });
      return;
    }

    try {
      setSendingOffers(true);

      const sellersToAdd = sellers
        .filter(s => selectedSellers.has(s.saleListingId))
        .map(s => ({
          sellerId: s.sellerId,
          saleListingId: s.saleListingId,
          requestedQuantity: s.availableQuantity,
        }));

      await api.post(API_ENDPOINTS.tradeOperations.addSellers(tradeOperationId), {
        sellers: sellersToAdd,
      });

      toast({
        title: 'Offers Sent Successfully',
        description: `Sent ${sellersToAdd.length} offer(s) to replacement sellers`,
      });

      onSellersAdded();
      onClose();
    } catch (err) {
      console.error('Error sending offers:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Send Offers',
        description: 'Please try again later',
      });
    } finally {
      setSendingOffers(false);
    }
  };

  const getQualityBadge = (quality: number) => {
    if (quality > 90) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Quality: {quality}</Badge>;
    } else if (quality > 75) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Quality: {quality}</Badge>;
    } else if (quality > 60) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Quality: {quality}</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Quality: {quality}</Badge>;
    }
  };

  const getMatchScoreBadge = (score: number) => {
    if (score > 80) {
      return <Badge className="bg-green-500 text-white text-lg px-3 py-1">Match: {score}%</Badge>;
    } else if (score > 60) {
      return <Badge className="bg-yellow-500 text-white text-lg px-3 py-1">Match: {score}%</Badge>;
    } else {
      return <Badge className="bg-red-500 text-white text-lg px-3 py-1">Match: {score}%</Badge>;
    }
  };

  // Filter and sort sellers
  const filteredAndSortedSellers = useMemo(() => {
    let filtered = sellers;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (s) =>
          s.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.location.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'distance':
          return a.distance - b.distance;
        case 'price':
          return a.askingPrice - b.askingPrice;
        case 'quality':
          return b.quality - a.quality;
        default:
          return 0;
      }
    });

    return sorted;
  }, [sellers, searchQuery, sortBy]);

  const totalSelected = calculateTotalSelected();
  const hasGap = totalSelected < neededQuantity;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Find Replacement Sellers</DialogTitle>
          <DialogDescription>
            Select sellers to send offers for {neededQuantity.toFixed(1)} {unit}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8">
            <SkeletonGrid count={6} columns={3} />
          </div>
        ) : error ? (
          <div className="py-12">
            <ErrorState error={error} onRetry={fetchMatchingSellers} />
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <span className="text-6xl opacity-30 block mb-4 animate-pulse">🔍</span>
            <p className="font-semibold text-lg">No matching sellers available</p>
            <p className="text-sm mt-2">
              No sellers with matching products were found at this time. Please check back later.
            </p>
            <div className="mt-4 text-xs bg-orange-50 border border-orange-200 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-orange-800">
                💡 <span className="font-semibold">Tip:</span> Try expanding your search criteria or contacting sellers directly
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filter Controls */}
            <div className="space-y-4 py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search sellers by name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-48">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Match Score</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
                      <SelectItem value="price">Price (Low to High)</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="hover:bg-orange-50 transition-colors"
                >
                  {selectedSellers.size === filteredAndSortedSellers.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-text-secondary">
                  Selected: <span className="font-bold text-text-primary">{selectedSellers.size}</span> seller(s)
                </span>
                {filteredAndSortedSellers.length < sellers.length && (
                  <span className="text-xs text-orange-600">
                    Showing {filteredAndSortedSellers.length} of {sellers.length} sellers
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">Total Selected Quantity</p>
                <p className={`text-2xl font-bold transition-colors ${hasGap ? 'text-orange-600' : 'text-green-600'}`}>
                  {totalSelected.toFixed(1)} / {neededQuantity.toFixed(1)} {unit}
                </p>
              </div>
            </div>

            {/* Gap Warning */}
            {hasGap && selectedSellers.size > 0 && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">⚠️</span>
                  <p className="text-sm font-semibold text-orange-900">
                    Selected quantity ({totalSelected.toFixed(1)} {unit}) is less than needed ({neededQuantity.toFixed(1)} {unit})
                  </p>
                </div>
              </div>
            )}

            {/* Seller Cards */}
            {filteredAndSortedSellers.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <span className="text-5xl opacity-30 block mb-3">🔍</span>
                <p className="font-semibold">No sellers match your search</p>
                <p className="text-sm mt-1">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {filteredAndSortedSellers.map((seller) => {
                const isSelected = selectedSellers.has(seller.saleListingId);
                return (
                  <Card
                    key={seller.saleListingId}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
                      isSelected
                        ? 'ring-2 ring-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg'
                        : 'hover:border-orange-300 bg-white'
                    }`}
                    onClick={() => handleSelectSeller(seller.saleListingId)}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* Header with Checkbox and Match Score */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectSeller(seller.saleListingId)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div>
                              <h4 className="font-bold text-text-primary">{seller.sellerName}</h4>
                              <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                <span>📍</span>
                                {seller.location.city}
                              </p>
                            </div>
                          </div>
                          {getMatchScoreBadge(seller.score)}
                        </div>

                        {/* Quantity and Price */}
                        <div className="space-y-2">
                          <EnhancedTooltip content="Quantity available from this seller">
                            <div className="flex items-center justify-between text-sm hover:bg-gray-50 p-1 rounded transition-colors">
                              <span className="text-text-secondary">Available:</span>
                              <span className="font-bold text-text-primary">
                                {seller.availableQuantity.toFixed(1)} {unit}
                              </span>
                            </div>
                          </EnhancedTooltip>
                          <EnhancedTooltip content="Seller's asking price per unit">
                            <div className="flex items-center justify-between text-sm hover:bg-gray-50 p-1 rounded transition-colors">
                              <span className="text-text-secondary">Asking Price:</span>
                              <span className="font-bold text-text-primary">
                                €{seller.askingPrice.toFixed(2)}/{unit}
                              </span>
                            </div>
                          </EnhancedTooltip>
                          <EnhancedTooltip content="Distance from your delivery location">
                            <div className="flex items-center justify-between text-sm hover:bg-gray-50 p-1 rounded transition-colors">
                              <span className="text-text-secondary">Distance:</span>
                              <span className="font-bold text-text-primary">
                                {seller.distance.toFixed(1)} km
                              </span>
                            </div>
                          </EnhancedTooltip>
                        </div>

                        {/* Quality Badge */}
                        <div className="pt-2">
                          <EnhancedTooltip content={`Quality score: ${seller.quality}/100`}>
                            <div className="inline-block">
                              {getQualityBadge(seller.quality)}
                            </div>
                          </EnhancedTooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sendingOffers}>
            Cancel
          </Button>
          <Button
            onClick={handleSendOffers}
            disabled={selectedSellers.size === 0 || sendingOffers}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {sendingOffers ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Sending Offers...
              </>
            ) : (
              `Send ${selectedSellers.size} Offer(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReplacementSellerFinder;
