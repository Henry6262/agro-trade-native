import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  UserCheck, 
  Package, 
  MapPin, 
  Star, 
  Send,
  X,
  CheckCircle,
  Info,
  TrendingUp
} from 'lucide-react';
import { tradeOperationService, saleListingService } from '../services/api';
import * as Types from '../types';

interface ReplacementSellerFinderProps {
  tradeOperation: Types.TradeOperation;
  failedSeller: Types.TradeSeller;
  requiredQuantity: number;
  onSellerAdded?: (sellerId: string) => void;
  onClose?: () => void;
}

interface PotentialSeller {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    phoneNumber: string;
    location?: string;
    rating?: number;
  };
  product: {
    id: string;
    name: string;
    category: string;
    quality: string;
  };
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  isAvailable: boolean;
  distance?: number; // km from original pickup points
  matchScore: number; // 0-100 based on various factors
}

export default function ReplacementSellerFinder({
  tradeOperation,
  failedSeller,
  requiredQuantity,
  onSellerAdded,
  onClose
}: ReplacementSellerFinderProps) {
  const [potentialSellers, setPotentialSellers] = useState<PotentialSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [sendingOffers, setSendingOffers] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    maxDistance: 100, // km
    minQuantity: requiredQuantity * 0.5, // Allow partial replacements
    minRating: 3.5,
    qualityMatch: true
  });

  useEffect(() => {
    findReplacementSellers();
  }, []);

  const findReplacementSellers = async () => {
    try {
      setLoading(true);
      
      // Get all available sale listings that match the product
      const listings = await saleListingService.getAll();
      
      // Filter and score potential replacements
      const productCategory = failedSeller.saleListing?.product?.category || 'GRAINS';
      const productQuality = failedSeller.saleListing?.product?.quality || 'GRADE_A';
      
      const scoredSellers = listings
        .filter((listing: any) => {
          // Exclude already involved sellers
          const isAlreadyInvolved = tradeOperation.sellers?.some(
            s => s.sellerId === listing.sellerId
          );
          if (isAlreadyInvolved) return false;
          
          // Match product category
          if (listing.product?.category !== productCategory) return false;
          
          // Check availability
          if (!listing.isAvailable) return false;
          
          // Check minimum quantity
          if (listing.quantity < searchFilters.minQuantity) return false;
          
          return true;
        })
        .map((listing: any) => {
          // Calculate match score based on various factors
          let score = 0;
          
          // Quality match (40 points)
          if (listing.product?.quality === productQuality) {
            score += 40;
          } else if (
            (productQuality === 'GRADE_A' && listing.product?.quality === 'GRADE_B') ||
            (productQuality === 'GRADE_B' && listing.product?.quality === 'GRADE_A')
          ) {
            score += 25;
          }
          
          // Quantity match (30 points)
          const quantityRatio = Math.min(listing.quantity / requiredQuantity, 1);
          score += quantityRatio * 30;
          
          // Price competitiveness (20 points)
          const originalPrice = failedSeller.agreedPrice || failedSeller.saleListing?.pricePerUnit;
          if (originalPrice && listing.pricePerUnit) {
            const priceDiff = Math.abs(originalPrice - listing.pricePerUnit) / originalPrice;
            score += Math.max(0, (1 - priceDiff) * 20);
          }
          
          // Seller rating (10 points)
          const rating = listing.seller?.rating || 4;
          score += (rating / 5) * 10;
          
          // Mock distance calculation (in production, use real coordinates)
          const distance = Math.round(20 + Math.random() * 80);
          
          return {
            id: listing.id,
            sellerId: listing.sellerId,
            seller: listing.seller || {
              id: listing.sellerId,
              name: `Seller ${listing.sellerId.slice(-4)}`,
              phoneNumber: 'N/A',
              rating: rating
            },
            product: listing.product,
            quantity: listing.quantity,
            unit: listing.unit || 'tons',
            pricePerUnit: listing.pricePerUnit,
            location: listing.location || 'Unknown',
            isAvailable: listing.isAvailable,
            distance,
            matchScore: Math.round(score)
          } as PotentialSeller;
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10); // Top 10 matches
      
      setPotentialSellers(scoredSellers);
    } catch (error) {
      console.error('Failed to find replacement sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendOffers = async () => {
    if (selectedSellers.length === 0) {
      alert('Please select at least one seller');
      return;
    }
    
    try {
      setSendingOffers(true);
      
      for (const sellerId of selectedSellers) {
        const seller = potentialSellers.find(s => s.id === sellerId);
        if (!seller) continue;
        
        // Create offer negotiation for this seller
        await tradeOperationService.sendOffer(tradeOperation.id, {
          sellerId: seller.sellerId,
          saleListingId: seller.id,
          requestedQuantity: Math.min(seller.quantity, requiredQuantity),
          offeredPrice: seller.pricePerUnit,
          message: `Urgent: Replacement needed for failed inspection. Original operation: ${tradeOperation.operationNumber}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
      }
      
      alert(`Offers sent to ${selectedSellers.length} seller(s)`);
      onSellerAdded?.(selectedSellers[0]);
      onClose?.();
    } catch (error) {
      console.error('Failed to send offers:', error);
      alert('Failed to send offers');
    } finally {
      setSendingOffers(false);
    }
  };

  const toggleSellerSelection = (sellerId: string) => {
    setSelectedSellers(prev => 
      prev.includes(sellerId) 
        ? prev.filter(id => id !== sellerId)
        : [...prev, sellerId]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[90%] max-w-6xl h-[90%] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                Find Replacement Seller
              </h2>
              <p className="text-gray-600 mt-1">
                Inspection failed for {failedSeller.seller?.name || 'seller'}. 
                Need to replace {requiredQuantity} {failedSeller.unit || 'tons'} of {failedSeller.saleListing?.product?.name || 'product'}.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Failed Inspection Summary */}
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <Info className="w-4 h-4" />
              <span className="font-medium">Inspection Failure Details</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
              <div>
                <span className="text-gray-600">Failed Seller:</span>
                <span className="ml-2 font-medium">{failedSeller.seller?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Quality Score:</span>
                <span className="ml-2 font-medium text-red-600">
                  {(tradeOperation.metadata as any)?.inspectionFailures?.[0]?.qualityScore || 'N/A'}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Quantity Lost:</span>
                <span className="ml-2 font-medium">{requiredQuantity} {failedSeller.unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <label className="text-sm">Max Distance:</label>
              <input
                type="number"
                value={searchFilters.maxDistance}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, maxDistance: +e.target.value }))}
                className="w-20 px-2 py-1 border rounded text-sm"
              />
              <span className="text-sm text-gray-600">km</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-600" />
              <label className="text-sm">Min Quantity:</label>
              <input
                type="number"
                value={searchFilters.minQuantity}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minQuantity: +e.target.value }))}
                className="w-20 px-2 py-1 border rounded text-sm"
              />
              <span className="text-sm text-gray-600">tons</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-600" />
              <label className="text-sm">Min Rating:</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={searchFilters.minRating}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minRating: +e.target.value }))}
                className="w-20 px-2 py-1 border rounded text-sm"
              />
            </div>
            <button
              onClick={findReplacementSellers}
              className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Again
            </button>
          </div>
        </div>

        {/* Seller List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Finding suitable replacement sellers...</p>
            </div>
          ) : potentialSellers.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No suitable replacement sellers found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {potentialSellers.map((seller) => (
                <div
                  key={seller.id}
                  className={`bg-white border rounded-lg p-4 transition-all ${
                    selectedSellers.includes(seller.id) 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedSellers.includes(seller.id)}
                        onChange={() => toggleSellerSelection(seller.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{seller.seller.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(seller.matchScore)}`}>
                            {seller.matchScore}% Match
                          </span>
                          {seller.seller.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm">{seller.seller.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="text-sm">
                            <span className="text-gray-600">Product:</span>
                            <span className="ml-2 font-medium">
                              {seller.product.name} ({seller.product.quality})
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Available:</span>
                            <span className="ml-2 font-medium">
                              {seller.quantity} {seller.unit}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Price:</span>
                            <span className="ml-2 font-medium">
                              €{seller.pricePerUnit}/{seller.unit}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Distance:</span>
                            <span className="ml-2 font-medium">
                              {seller.distance} km
                            </span>
                          </div>
                        </div>

                        {/* Match Score Breakdown */}
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">Match factors:</span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              Quality match
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-blue-500" />
                              Competitive price
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-orange-500" />
                              Good location
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedSellers.length > 0 && (
                <span>
                  Selected {selectedSellers.length} seller(s) • 
                  Total quantity: {
                    potentialSellers
                      .filter(s => selectedSellers.includes(s.id))
                      .reduce((sum, s) => sum + s.quantity, 0)
                  } tons
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={sendOffers}
                disabled={selectedSellers.length === 0 || sendingOffers}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingOffers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Offers ({selectedSellers.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}