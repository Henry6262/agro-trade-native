import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface SaleListing {
  id: string;
  sellerId: string;
  productId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  qualityGrade?: string;
  status: string;
  createdAt: string;
  seller?: {
    id: string;
    businessName: string;
    verificationStatus: string;
  };
  product?: {
    id: string;
    name: string;
  };
  address?: {
    id: string;
    city: string;
    region: string;
    address: string;
  };
}

interface SellerCardsPanelProps {
  filterProduct?: string;
  selectedSellerIds: string[];
  onSellerToggle: (seller: SaleListing) => void;
  highlightedSellerId?: string;
}

export const SellerCardsPanel: React.FC<SellerCardsPanelProps> = ({
  filterProduct,
  selectedSellerIds,
  onSellerToggle,
  highlightedSellerId,
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
      const response = await api.get('/seller/listings');
      let filteredSellers = response.data;

      // Filter by product if specified
      if (filterProduct) {
        filteredSellers = filteredSellers.filter(
          (s: SaleListing) => s.product?.name === filterProduct
        );
      }

      setSellers(filteredSellers);
      setError(null);
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setError('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredSellers = sellers.filter((seller) => {
    // Verified filter
    if (filterVerified === 'verified' && seller.seller?.verificationStatus !== 'VERIFIED') {
      return false;
    }

    // Region filter
    if (filterRegion !== 'all' && seller.address?.region !== filterRegion) {
      return false;
    }

    // Minimum quantity filter
    if (seller.quantity < minQuantity) {
      return false;
    }

    return true;
  });

  // Extract unique regions
  const regions = Array.from(new Set(sellers.map((s) => s.address?.region).filter(Boolean)));

  // Sort sellers (verified first, then by quantity)
  const sortedSellers = [...filteredSellers].sort((a, b) => {
    // Always prioritize verified sellers first
    const aVerified = a.seller?.verificationStatus === 'VERIFIED' ? 1 : 0;
    const bVerified = b.seller?.verificationStatus === 'VERIFIED' ? 1 : 0;
    if (aVerified !== bVerified) {
      return bVerified - aVerified;
    }

    // Then apply secondary sort
    if (sortBy === 'quantity') {
      return b.quantity - a.quantity;
    } else if (sortBy === 'price') {
      return a.pricePerUnit - b.pricePerUnit;
    } else {
      // Default: by quantity desc
      return b.quantity - a.quantity;
    }
  });

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Loading sellers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchSellers}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Available Sellers</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="verified">Verified First</option>
            <option value="quantity">Highest Quantity</option>
            <option value="price">Lowest Price</option>
          </select>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Verification Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterVerified('all')}
              className={`text-xs px-3 py-1 rounded-full transition ${
                filterVerified === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterVerified('verified')}
              className={`text-xs px-3 py-1 rounded-full transition ${
                filterVerified === 'verified'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Verified Only
            </button>
          </div>

          {/* Region Filter */}
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          {/* Min Quantity Slider */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Min Quantity:</label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={minQuantity}
              onChange={(e) => setMinQuantity(parseInt(e.target.value))}
              className="w-20"
            />
            <span className="text-xs font-semibold text-gray-700">{minQuantity}t</span>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>{sortedSellers.length} sellers</span>
          {filterProduct && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Product: {filterProduct}
            </span>
          )}
          {selectedSellerIds.length > 0 && (
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
              {selectedSellerIds.length} selected
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {sortedSellers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {filterProduct
                ? `No sellers found for ${filterProduct}`
                : 'No sellers available'}
            </p>
          </div>
        ) : (
          sortedSellers.map((seller) => {
            const isSelected = selectedSellerIds.includes(seller.id);
            const isHighlighted = highlightedSellerId === seller.id;
            const isVerified = seller.seller?.verificationStatus === 'VERIFIED';

            return (
              <div
                key={seller.id}
                onClick={() => onSellerToggle(seller)}
                className={`
                  border-2 rounded-lg p-3 cursor-pointer transition-all
                  ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}
                  ${isHighlighted ? 'ring-4 ring-blue-300' : ''}
                  hover:shadow-md
                `}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">
                            {seller.seller?.businessName || 'Unknown Seller'}
                          </h4>
                          {/* Badges */}
                          {isVerified && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                              ✓ Verified
                            </span>
                          )}
                          {!isVerified && (
                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                              ⚠️ Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {seller.product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {seller.address?.city || 'Unknown'}, {seller.address?.region || 'Unknown'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // View details modal (placeholder)
                          alert(`View details for ${seller.seller?.businessName}`);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {seller.quantity} {seller.unit}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        €{seller.pricePerUnit}/{seller.unit}
                      </span>
                      {seller.qualityGrade && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          Grade: {seller.qualityGrade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SellerCardsPanel;
