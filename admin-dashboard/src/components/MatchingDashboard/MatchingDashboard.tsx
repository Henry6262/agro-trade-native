import React, { useState, useMemo } from 'react';
import BulgariaMap from './BulgariaMap';
import OrderInfoBar from './OrderInfoBar';
import BuyerOrdersPanel from './BuyerOrdersPanel';
import SellerCardsPanel from './SellerCardsPanel';
import PricingModal from './PricingModal';

interface BuyListing {
  id: string;
  buyerId: string;
  productId: string;
  quantity: number;
  unit: string;
  targetPrice: number;
  deliveryAddressId: string;
  status: string;
  createdAt: string;
  buyer?: {
    id: string;
    businessName: string;
  };
  product?: {
    id: string;
    name: string;
  };
  deliveryAddress?: {
    id: string;
    city: string;
    region: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
}

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
    latitude?: number;
    longitude?: number;
  };
}

export const MatchingDashboard: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<BuyListing | null>(null);
  const [selectedSellers, setSelectedSellers] = useState<SaleListing[]>([]);
  const [highlightedSellerId, setHighlightedSellerId] = useState<string | undefined>();
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Calculate total selected quantity
  const selectedQuantity = useMemo(() => {
    return selectedSellers.reduce((sum, seller) => sum + seller.quantity, 0);
  }, [selectedSellers]);

  // Handle buyer order selection
  const handleOrderSelect = (order: BuyListing) => {
    setSelectedOrder(order);
    setSelectedSellers([]); // Clear seller selections when changing order
  };

  // Handle seller toggle
  const handleSellerToggle = (seller: SaleListing) => {
    setSelectedSellers((prev) => {
      const isSelected = prev.some((s) => s.id === seller.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== seller.id);
      } else {
        return [...prev, seller];
      }
    });
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedOrder(null);
    setSelectedSellers([]);
  };

  // Map markers for buyers
  const buyerMarkers = selectedOrder
    ? [
        {
          id: selectedOrder.id,
          name: selectedOrder.buyer?.businessName || 'Unknown Buyer',
          lat: selectedOrder.deliveryAddress?.latitude || 42.7,
          lng: selectedOrder.deliveryAddress?.longitude || 25.5,
          product: selectedOrder.product?.name,
          quantity: selectedOrder.quantity,
        },
      ]
    : [];

  // Map markers for sellers (only when order is selected)
  const sellerMarkers = selectedOrder
    ? selectedSellers.map((seller) => ({
        id: seller.id,
        name: seller.seller?.businessName || 'Unknown Seller',
        lat: seller.address?.latitude || 42.7,
        lng: seller.address?.longitude || 25.5,
        product: seller.product?.name,
        quantity: seller.quantity,
        verified: seller.seller?.verificationStatus === 'VERIFIED',
      }))
    : [];

  // Determine if Create Offers button should be enabled
  const canCreateOffers =
    selectedOrder && selectedQuantity > 0 && selectedQuantity >= selectedOrder.quantity;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Map-Based Matching System</h1>
        <p className="text-sm text-gray-600">
          Select a buyer order, match with sellers, and create offers
        </p>
      </div>

      {/* Map Section (50% height) */}
      <div className="flex-1 relative border-b-4 border-gray-300">
        <BulgariaMap
          buyers={buyerMarkers}
          sellers={sellerMarkers}
          selectedBuyerId={selectedOrder?.id}
          selectedSellerId={highlightedSellerId}
          selectedSellerIds={selectedSellers.map((s) => s.id)}
          onBuyerClick={(id) => {
            // Optionally handle buyer pin click
          }}
          onSellerClick={(id) => {
            setHighlightedSellerId(id);
          }}
        />
      </div>

      {/* Order Info Bar */}
      <OrderInfoBar
        selectedOrder={
          selectedOrder
            ? {
                id: selectedOrder.id,
                corporation: selectedOrder.buyer?.businessName || 'Unknown',
                product: selectedOrder.product?.name || 'Unknown',
                quantity: selectedOrder.quantity,
                deliveryLocation: `${selectedOrder.deliveryAddress?.city || 'Unknown'}, ${
                  selectedOrder.deliveryAddress?.region || 'Unknown'
                }`,
              }
            : null
        }
        selectedQuantity={selectedQuantity}
        onClearSelection={handleClearSelection}
      />

      {/* Bottom Panels (50% height) */}
      <div className="flex-1 flex">
        {/* Left Panel: Buyer Orders */}
        <div className="w-1/2 border-r border-gray-200 overflow-hidden">
          <BuyerOrdersPanel
            selectedOrderId={selectedOrder?.id}
            onOrderSelect={handleOrderSelect}
          />
        </div>

        {/* Right Panel: Seller Cards */}
        <div className="w-1/2 overflow-hidden">
          <SellerCardsPanel
            filterProduct={selectedOrder?.product?.name}
            selectedSellerIds={selectedSellers.map((s) => s.id)}
            onSellerToggle={handleSellerToggle}
            highlightedSellerId={highlightedSellerId}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedOrder ? (
              <>
                <span className="font-semibold">{selectedSellers.length}</span> seller(s) selected •{' '}
                <span className="font-semibold">{selectedQuantity}t</span> of{' '}
                <span className="font-semibold">{selectedOrder.quantity}t</span> allocated
              </>
            ) : (
              'Select a buyer order to begin'
            )}
          </div>
          <button
            disabled={!canCreateOffers}
            onClick={() => setShowPricingModal(true)}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all
              ${
                canCreateOffers
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Create Offers
          </button>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && selectedOrder && selectedSellers.length > 0 && (
        <PricingModal
          selectedSellers={selectedSellers}
          buyerOrder={selectedOrder}
          onClose={() => setShowPricingModal(false)}
          onSubmit={(offers) => {
            console.log('Offers submitted:', offers);
            setShowPricingModal(false);
            // Week 2: Implement actual API call
          }}
        />
      )}
    </div>
  );
};

export default MatchingDashboard;
