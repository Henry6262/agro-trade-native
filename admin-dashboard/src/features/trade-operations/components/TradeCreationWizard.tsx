import React, { useState, useEffect } from 'react';
import * as Types from '../../../types';
import { 
  buyListingService, 
  saleListingService, 
  tradeOperationService 
} from '../../../services/api';
import {
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: (tradeOpId?: string) => void;
}

export const TradeCreationWizard: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Buy Listing
  const [buyListings, setBuyListings] = useState<Types.BuyListing[]>([]);
  const [selectedBuyListing, setSelectedBuyListing] = useState<Types.BuyListing | null>(null);
  
  // Step 2 & 3: Sellers
  const [availableSellers, setAvailableSellers] = useState<Types.SaleListing[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<Map<string, {
    listing: Types.SaleListing;
    quantity: number;
  }>>(new Map());

  // Load buy listings
  useEffect(() => {
    loadBuyListings();
  }, []);

  const loadBuyListings = async () => {
    setLoading(true);
    try {
      const data = await buyListingService.getAll();
      setBuyListings(data);
    } catch (error) {
      console.error('Failed to load buy listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchSellers = async () => {
    if (!selectedBuyListing) return;
    
    setLoading(true);
    try {
      const data = await saleListingService.search({
        productId: selectedBuyListing.productId,
        maxPrice: selectedBuyListing.maxPricePerUnit,
      });
      setAvailableSellers(data);
    } catch (error) {
      console.error('Failed to search sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && selectedBuyListing) {
      searchSellers();
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedSellers.size > 0) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSellerSelection = (listing: Types.SaleListing) => {
    const newSelected = new Map(selectedSellers);
    if (newSelected.has(listing.id)) {
      newSelected.delete(listing.id);
    } else {
      newSelected.set(listing.id, {
        listing,
        quantity: Math.min(listing.quantity, selectedBuyListing?.quantity || 0)
      });
    }
    setSelectedSellers(newSelected);
  };

  const updateSellerQuantity = (listingId: string, quantity: number) => {
    const newSelected = new Map(selectedSellers);
    const seller = newSelected.get(listingId);
    if (seller) {
      seller.quantity = quantity;
      newSelected.set(listingId, seller);
      setSelectedSellers(newSelected);
    }
  };

  const getTotalQuantity = () => {
    let total = 0;
    selectedSellers.forEach(seller => {
      total += seller.quantity;
    });
    return total;
  };

  const getEstimatedCost = () => {
    let total = 0;
    selectedSellers.forEach(seller => {
      total += seller.quantity * seller.listing.pricePerUnit;
    });
    return total;
  };

  const getEstimatedProfit = () => {
    if (!selectedBuyListing) return 0;
    const revenue = getTotalQuantity() * selectedBuyListing.maxPricePerUnit;
    const cost = getEstimatedCost();
    return revenue - cost;
  };

  const handleCreateOperation = async () => {
    if (!selectedBuyListing || selectedSellers.size === 0) return;
    
    setLoading(true);
    try {
      const sellers: Types.CreateTradeSellerInput[] = [];
      selectedSellers.forEach((seller, listingId) => {
        const basePrice =
          seller.listing.pricePerUnit ??
          seller.listing.askingPrice ??
          selectedBuyListing?.maxPricePerUnit ??
          0;

        sellers.push({
          sellerId: seller.listing.sellerId,
          saleListingId: listingId,
          quantity: seller.quantity,
          offerPrice: Number(basePrice),
        });
      });

      const dto: Types.CreateTradeOperationDto = {
        buyListingId: selectedBuyListing.id,
        sellers,
      };

      const result = await tradeOperationService.create(dto);
      onSuccess(result?.tradeOperationId);
    } catch (error) {
      console.error('Failed to create operation:', error);
      alert('Failed to create trade operation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {currentStep > step ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 4 && (
            <div className={`w-20 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select Buy Listing</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {buyListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => setSelectedBuyListing(listing)}
              className={`p-4 border rounded-lg cursor-pointer transition ${
                selectedBuyListing?.id === listing.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{listing.product?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {listing.buyer?.name} • {listing.quantity} {listing.unit}
                  </p>
                  <p className="text-sm text-gray-600">
                    Max price: €{listing.maxPricePerUnit}/unit
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Required by: {new Date(listing.requiredByDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedBuyListing?.id === listing.id && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Find & Select Sellers</h3>
      {loading ? (
        <p>Loading sellers...</p>
      ) : (
        <div>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Found {availableSellers.length} sellers for {selectedBuyListing?.product?.name}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Select multiple sellers to fulfill the order of {selectedBuyListing?.quantity} {selectedBuyListing?.unit}
            </p>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableSellers.map((listing) => (
              <div
                key={listing.id}
                onClick={() => toggleSellerSelection(listing)}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedSellers.has(listing.id)
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{listing.seller?.name}</h4>
                    <p className="text-sm text-gray-600">
                      {listing.quantity} {listing.unit} available
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      €{listing.pricePerUnit}/unit
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {listing.seller?.city || 'Unknown location'}
                      </p>
                    </div>
                  </div>
                  {selectedSellers.has(listing.id) ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Set Quantities</h3>
      <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          Total needed: {selectedBuyListing?.quantity} {selectedBuyListing?.unit}
        </p>
        <p className="text-sm text-yellow-800">
          Currently selected: {getTotalQuantity()} {selectedBuyListing?.unit}
        </p>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Array.from(selectedSellers).map(([id, seller]) => (
          <div key={id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">{seller.listing.seller?.name}</h4>
              <span className="text-sm text-gray-600">
                Max: {seller.listing.quantity} {seller.listing.unit}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={seller.quantity}
                onChange={(e) => updateSellerQuantity(id, Number(e.target.value))}
                min="0"
                max={seller.listing.quantity}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <span className="text-sm text-gray-600">{seller.listing.unit}</span>
              <span className="text-sm font-semibold">
                €{(seller.quantity * seller.listing.pricePerUnit).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Review & Create</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Buy Listing</h4>
          <p className="text-sm text-gray-600">
            Product: {selectedBuyListing?.product?.name}
          </p>
          <p className="text-sm text-gray-600">
            Buyer: {selectedBuyListing?.buyer?.name}
          </p>
          <p className="text-sm text-gray-600">
            Quantity: {selectedBuyListing?.quantity} {selectedBuyListing?.unit}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Selected Sellers ({selectedSellers.size})</h4>
          {Array.from(selectedSellers).map(([id, seller]) => (
            <div key={id} className="text-sm text-gray-600 mb-1">
              • {seller.listing.seller?.name}: {seller.quantity} {seller.listing.unit} @ €{seller.listing.pricePerUnit}/unit
            </div>
          ))}
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Estimated Profit
          </h4>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Total Cost: €{getEstimatedCost().toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Expected Revenue: €{(getTotalQuantity() * (selectedBuyListing?.maxPricePerUnit || 0)).toFixed(2)}
            </p>
            <p className="text-lg font-semibold text-green-600">
              Estimated Profit: €{getEstimatedProfit().toFixed(2)}
            </p>
          </div>
        </div>

        {getTotalQuantity() < (selectedBuyListing?.quantity || 0) && (
          <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Partial Fulfillment</p>
              <p className="text-xs text-amber-600">
                Selected quantity ({getTotalQuantity()}) is less than requested ({selectedBuyListing?.quantity})
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create Trade Operation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !selectedBuyListing) ||
                (currentStep === 2 && selectedSellers.size === 0)
              }
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                ((currentStep === 1 && !selectedBuyListing) ||
                 (currentStep === 2 && selectedSellers.size === 0))
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreateOperation}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Operation'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
