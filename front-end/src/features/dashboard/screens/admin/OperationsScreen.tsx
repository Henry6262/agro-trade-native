import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Package,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  Send,
  Plus,
  ArrowRight,
  Loader2,
  Truck,
  Map,
} from 'lucide-react-native';

import { useTradeOperations } from './hooks/useTradeOperations';
import { TransportMapModal } from './components/TransportMapModal';
import type {
  BuyListing,
  SaleListing,
  TradeOperation,
  MatchingSeller,
} from '@services/tradeOperationService';

const { width: screenWidth } = Dimensions.get('window');

export default function OperationsScreen() {
  const {
    // Data
    buyListings,
    sellListings,
    tradeOperations,
    currentTradeOperation,
    matchingSellers,
    profitCalculation,
    transportEstimate,
    activeNegotiations,

    // Loading states
    isLoadingBuyListings,
    isLoadingSellListings,
    isLoadingMatchingSellers,
    isCreatingTrade,
    isCalculatingProfit,
    isEstimatingTransport,
    isSendingOffers,

    // Actions
    loadBuyListings,
    loadSellListings,
    createTradeOperation,
    findMatchingSellers,
    selectSellers,
    calculateProfit,
    sendBulkOffers,

    // Error handling
    error,
    clearError,
  } = useTradeOperations();

  // UI State
  const [activeView, setActiveView] = useState('buy-listings');
  const [selectedBuyListing, setSelectedBuyListing] = useState<BuyListing | null>(null);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);
  const [targetProfitMargin, setTargetProfitMargin] = useState('7.5');
  const [showTradeCreationModal, setShowTradeCreationModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showTransportMapModal, setShowTransportMapModal] = useState(false);
  const [negotiationPrices, setNegotiationPrices] = useState({
    buyer: '',
    sellers: {} as Record<string, string>,
  });

  // Create trade operation from selected buy listing
  const handleCreateTrade = async () => {
    if (!selectedBuyListing) {
      Alert.alert('Error', 'Please select a buy listing first');
      return;
    }

    const targetMargin = parseFloat(targetProfitMargin);
    if (isNaN(targetMargin) || targetMargin < 5 || targetMargin > 15) {
      Alert.alert('Error', 'Target profit margin must be between 5% and 15%');
      return;
    }

    const tradeOp = await createTradeOperation(selectedBuyListing.id, targetMargin);
    if (tradeOp) {
      setShowTradeCreationModal(false);
      setActiveView('current-trade');

      // Automatically find matching sellers
      await findMatchingSellers(tradeOp.id, 200); // 200km max distance
    }
  };

  // Handle seller selection
  const handleSellerToggle = (sellerId: string) => {
    setSelectedSellers((prev) =>
      prev.includes(sellerId) ? prev.filter((id) => id !== sellerId) : [...prev, sellerId]
    );
  };

  // Add selected sellers to trade
  const handleAddSellers = async () => {
    if (!currentTradeOperation || selectedSellers.length === 0) {
      Alert.alert('Error', 'Please select sellers first');
      return;
    }

    const sellersToAdd = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((s) => s.sellerId === sellerId);
        if (!seller) return null;

        return {
          sellerId: seller.sellerId,
          saleListingId: seller.saleListingId,
          requestedQuantity: Math.min(
            seller.availability,
            currentTradeOperation.buyListing.quantity
          ),
        };
      })
      .filter(Boolean) as any[];

    const success = await selectSellers(currentTradeOperation.id, sellersToAdd);
    if (success) {
      setSelectedSellers([]);
      // Calculate profit after adding sellers
      await calculateProfit(currentTradeOperation.id);
    }
  };

  // Send offers to all parties
  const handleSendOffers = async () => {
    if (!currentTradeOperation) return;

    const buyerPrice = parseFloat(negotiationPrices.buyer);
    if (isNaN(buyerPrice)) {
      Alert.alert('Error', 'Please enter a valid buyer price');
      return;
    }

    const sellerOffers = Object.entries(negotiationPrices.sellers)
      .map(([sellerId, price]) => ({
        sellerId,
        price: parseFloat(price),
        quantity:
          currentTradeOperation.selectedSellers?.find((s) => s.sellerId === sellerId)
            ?.requestedQuantity || 0,
      }))
      .filter((offer) => !isNaN(offer.price) && offer.quantity > 0);

    if (sellerOffers.length === 0) {
      Alert.alert('Error', 'Please enter prices for all selected sellers');
      return;
    }

    const success = await sendBulkOffers({
      tradeOperationId: currentTradeOperation.id,
      buyerOffer: { price: buyerPrice },
      sellerOffers,
    });

    if (success) {
      setShowNegotiationModal(false);
      setNegotiationPrices({ buyer: '', sellers: {} });
    }
  };

  // UI Components
  const renderBuyListingCard = (listing: BuyListing) => (
    <TouchableOpacity
      key={listing.id}
      className={`mb-4 p-4 rounded-lg border-2 ${
        selectedBuyListing?.id === listing.id
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
      onPress={() => setSelectedBuyListing(listing)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-bold text-gray-800">
          {listing.product?.name || 'Unknown Product'}
        </Text>
        <View className="px-2 py-1 rounded bg-blue-100">
          <Text className="text-blue-800 text-xs font-medium">{listing.status}</Text>
        </View>
      </View>

      <Text className="text-gray-600 mb-1">{listing.buyer?.name || 'Unknown Buyer'}</Text>
      <Text className="text-gray-600 mb-2">
        {listing.quantity} {listing.unit}
      </Text>

      <View className="flex-row justify-between items-center">
        <Text className="text-green-600 font-bold">
          ${listing.maxPricePerUnit}/{listing.unit}
        </Text>
        {listing.neededBy && (
          <View className="flex-row items-center">
            <Calendar size={14} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">
              {new Date(listing.neededBy).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMatchingSellerCard = (seller: MatchingSeller) => (
    <TouchableOpacity
      key={seller.sellerId}
      className={`mb-3 p-3 rounded-lg border ${
        selectedSellers.includes(seller.sellerId)
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
      onPress={() => handleSellerToggle(seller.sellerId)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="font-semibold text-gray-800">{seller.saleListing.seller.name}</Text>
        <View className="px-2 py-1 rounded bg-orange-100">
          <Text className="text-orange-800 text-xs">Match: {seller.matchScore}%</Text>
        </View>
      </View>

      <Text className="text-gray-600 mb-1">{seller.saleListing.product.name}</Text>
      <Text className="text-gray-600 mb-2">
        {seller.availability} {seller.saleListing.unit} available
      </Text>

      <View className="flex-row justify-between items-center">
        <Text className="text-green-600 font-bold">
          ${seller.askingPrice}/{seller.saleListing.unit}
        </Text>
        <View className="flex-row items-center">
          <MapPin size={12} color="#6B7280" />
          <Text className="text-gray-500 text-xs ml-1">{seller.distance}km away</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProfitSummary = () => {
    if (!profitCalculation) return null;

    return (
      <View className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <Text className="text-lg font-bold text-gray-800 mb-3">Profit Analysis</Text>

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Revenue:</Text>
          <Text className="font-semibold">
            ${profitCalculation.revenue.totalRevenue.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Total Costs:</Text>
          <Text className="font-semibold">${profitCalculation.costs.totalCosts.toFixed(2)}</Text>
        </View>

        <View className="h-px bg-gray-200 my-2" />

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-800 font-semibold">Net Profit:</Text>
          <Text className="font-bold text-green-600">
            ${profitCalculation.profit.netProfit.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-gray-800 font-semibold">Profit Margin:</Text>
          <Text
            className={`font-bold ${
              profitCalculation.profit.meetsMinimumMargin ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {profitCalculation.profit.profitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderTransportSummary = () => {
    if (!transportEstimate) return null;

    return (
      <View className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Truck size={20} color="#2563EB" />
            <Text className="text-lg font-bold text-gray-800 ml-2">Transport Estimate</Text>
          </View>
          <TouchableOpacity
            onPress={handleViewTransportMap}
            className="bg-blue-100 px-3 py-1 rounded-full flex-row items-center"
          >
            <Map size={14} color="#2563EB" />
            <Text className="text-blue-600 text-sm font-medium ml-1">View Map</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Distance:</Text>
          <Text className="font-semibold">{transportEstimate.distance} km</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Duration:</Text>
          <Text className="font-semibold">{Math.round(transportEstimate.duration / 60)} hours</Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Transport Cost:</Text>
          <Text className="font-semibold text-blue-600">
            ${transportEstimate.costs.totalCost.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-gray-600">Cost per km:</Text>
          <Text className="text-sm text-gray-500">
            ${transportEstimate.breakdown.costPerKm.toFixed(2)}/km
          </Text>
        </View>
      </View>
    );
  };

  // Estimate transport when sellers are selected
  const handleEstimateTransport = async () => {
    if (
      !currentTradeOperation ||
      !currentTradeOperation.selectedSellers ||
      !currentTradeOperation.buyListing.deliveryAddress
    ) {
      Alert.alert('Error', 'Missing seller or delivery information');
      return;
    }

    // Mock coordinates for demonstration
    // In production, these would come from real addresses
    const origin = { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' };
    const destination = {
      latitude: currentTradeOperation.buyListing.deliveryAddress.latitude || 41.8781,
      longitude: currentTradeOperation.buyListing.deliveryAddress.longitude || -87.6298,
      address: currentTradeOperation.buyListing.deliveryAddress.address || 'Chicago, IL',
    };

    const pickupLocations = currentTradeOperation.selectedSellers.map((seller, index) => ({
      latitude: 42.0 + index * 0.1, // Mock coordinates
      longitude: -93.0 + index * 0.1,
      address: seller.saleListing.address?.address || `Farm ${index + 1}`,
      quantity: seller.requestedQuantity,
    }));

    await estimateTransportCost({
      origin,
      pickupLocations,
      destination,
      quantity: currentTradeOperation.buyListing.quantity,
      vehicleType: 'TRUCK',
    });
  };

  // View transport route on map
  const handleViewTransportMap = () => {
    if (!currentTradeOperation || !transportEstimate) {
      Alert.alert('Error', 'Please estimate transport cost first');
      return;
    }
    setShowTransportMapModal(true);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Trade Operations</Text>
        <Text className="text-gray-600">Real-time trading management</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View className="bg-red-50 border-l-4 border-red-500 p-3 mx-4 mt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-red-800">{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <X size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Navigation Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        {[
          { id: 'buy-listings', label: 'Buy Orders', count: buyListings.length },
          { id: 'matching-sellers', label: 'Sellers', count: matchingSellers.length },
          { id: 'current-trade', label: 'Active Trade', count: currentTradeOperation ? 1 : 0 },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 py-3 px-4 ${
              activeView === tab.id ? 'border-b-2 border-blue-500' : ''
            }`}
            onPress={() => setActiveView(tab.id)}
          >
            <Text
              className={`text-center font-medium ${
                activeView === tab.id ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area */}
      <ScrollView className="flex-1 p-4">
        {activeView === 'buy-listings' && (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-800">Active Buy Listings</Text>
              <TouchableOpacity
                onPress={loadBuyListings}
                disabled={isLoadingBuyListings}
                className="flex-row items-center px-3 py-1 rounded-full bg-blue-100"
              >
                {isLoadingBuyListings ? (
                  <Loader2 size={16} color="#2563EB" />
                ) : (
                  <Text className="text-blue-600 font-medium">Refresh</Text>
                )}
              </TouchableOpacity>
            </View>

            {isLoadingBuyListings ? (
              <View className="flex-1 justify-center items-center py-8">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-600 mt-2">Loading buy listings...</Text>
              </View>
            ) : (
              buyListings.map(renderBuyListingCard)
            )}

            {selectedBuyListing && (
              <TouchableOpacity
                onPress={() => setShowTradeCreationModal(true)}
                className="mt-4 bg-green-600 p-4 rounded-lg flex-row items-center justify-center"
              >
                <Plus size={20} color="white" />
                <Text className="text-white font-bold ml-2">Create Trade Operation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeView === 'matching-sellers' && (
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-800">Matching Sellers</Text>
              {currentTradeOperation && (
                <TouchableOpacity
                  onPress={() => findMatchingSellers(currentTradeOperation.id, 200)}
                  disabled={isLoadingMatchingSellers}
                  className="flex-row items-center px-3 py-1 rounded-full bg-blue-100"
                >
                  {isLoadingMatchingSellers ? (
                    <Loader2 size={16} color="#2563EB" />
                  ) : (
                    <Text className="text-blue-600 font-medium">Find Sellers</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {!currentTradeOperation ? (
              <View className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <Text className="text-yellow-800">
                  Create a trade operation first to find matching sellers
                </Text>
              </View>
            ) : isLoadingMatchingSellers ? (
              <View className="flex-1 justify-center items-center py-8">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-600 mt-2">Finding matching sellers...</Text>
              </View>
            ) : (
              <>
                {matchingSellers.map(renderMatchingSellerCard)}

                {selectedSellers.length > 0 && (
                  <TouchableOpacity
                    onPress={handleAddSellers}
                    className="mt-4 bg-blue-600 p-4 rounded-lg flex-row items-center justify-center"
                  >
                    <Users size={20} color="white" />
                    <Text className="text-white font-bold ml-2">
                      Add {selectedSellers.length} Seller(s)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {activeView === 'current-trade' && (
          <View>
            {!currentTradeOperation ? (
              <View className="bg-gray-100 p-6 rounded-lg text-center">
                <Package size={48} color="#6B7280" className="mx-auto mb-3" />
                <Text className="text-gray-600 text-lg mb-2">No Active Trade</Text>
                <Text className="text-gray-500">Create a trade operation to get started</Text>
              </View>
            ) : (
              <>
                <View className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                  <Text className="text-lg font-bold text-gray-800 mb-2">
                    {currentTradeOperation.operationNumber}
                  </Text>
                  <Text className="text-gray-600 mb-1">
                    Product: {currentTradeOperation.buyListing.product.name}
                  </Text>
                  <Text className="text-gray-600 mb-1">
                    Buyer: {currentTradeOperation.buyListing.buyer.name}
                  </Text>
                  <Text className="text-gray-600 mb-3">
                    Quantity: {currentTradeOperation.buyListing.quantity}{' '}
                    {currentTradeOperation.buyListing.unit}
                  </Text>

                  <View className="flex-row justify-between items-center">
                    <Text
                      className={`font-bold px-3 py-1 rounded ${
                        currentTradeOperation.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : currentTradeOperation.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {currentTradeOperation.status}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Target Margin: {currentTradeOperation.targetProfitMargin}%
                    </Text>
                  </View>
                </View>

                {renderProfitSummary()}

                {renderTransportSummary()}

                {currentTradeOperation.selectedSellers &&
                  currentTradeOperation.selectedSellers.length > 0 && (
                    <TouchableOpacity
                      onPress={handleEstimateTransport}
                      disabled={isEstimatingTransport}
                      className="mb-4 bg-blue-600 p-3 rounded-lg flex-row items-center justify-center"
                    >
                      {isEstimatingTransport ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Truck size={18} color="white" />
                          <Text className="text-white font-medium ml-2">Estimate Transport</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                {currentTradeOperation.selectedSellers &&
                  currentTradeOperation.selectedSellers.length > 0 && (
                    <View className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                      <Text className="text-lg font-bold text-gray-800 mb-3">Selected Sellers</Text>
                      {currentTradeOperation.selectedSellers.map((seller) => (
                        <View
                          key={seller.id}
                          className="flex-row justify-between items-center py-2 border-b border-gray-100"
                        >
                          <Text className="text-gray-800">{seller.saleListing.seller.name}</Text>
                          <Text className="text-gray-600">
                            {seller.requestedQuantity} {seller.saleListing.unit}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                <TouchableOpacity
                  onPress={() => setShowNegotiationModal(true)}
                  className="bg-orange-600 p-4 rounded-lg flex-row items-center justify-center"
                  disabled={
                    !currentTradeOperation.selectedSellers ||
                    currentTradeOperation.selectedSellers.length === 0
                  }
                >
                  <Send size={20} color="white" />
                  <Text className="text-white font-bold ml-2">Send Offers</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Trade Creation Modal */}
      <Modal
        visible={showTradeCreationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTradeCreationModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Create Trade Operation</Text>
              <TouchableOpacity onPress={() => setShowTradeCreationModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedBuyListing && (
              <>
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Selected Buy Listing:</Text>
                  <Text className="font-semibold text-gray-800">
                    {selectedBuyListing.product.name} - {selectedBuyListing.buyer.name}
                  </Text>
                  <Text className="text-gray-600">
                    {selectedBuyListing.quantity} {selectedBuyListing.unit} @ $
                    {selectedBuyListing.maxPricePerUnit}/{selectedBuyListing.unit}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Target Profit Margin (%):</Text>
                  <TextInput
                    value={targetProfitMargin}
                    onChangeText={setTargetProfitMargin}
                    placeholder="7.5"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  />
                  <Text className="text-gray-500 text-sm mt-1">Minimum: 5%, Maximum: 15%</Text>
                </View>

                <TouchableOpacity
                  onPress={handleCreateTrade}
                  disabled={isCreatingTrade}
                  className="bg-green-600 p-4 rounded-lg flex-row items-center justify-center"
                >
                  {isCreatingTrade ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Plus size={20} color="white" />
                      <Text className="text-white font-bold ml-2">Create Trade</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Negotiation Modal */}
      <Modal
        visible={showNegotiationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNegotiationModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-4/5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">Send Offers</Text>
              <TouchableOpacity onPress={() => setShowNegotiationModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {currentTradeOperation && (
                <>
                  <View className="mb-4">
                    <Text className="text-gray-600 mb-2">Buyer Offer Price:</Text>
                    <TextInput
                      value={negotiationPrices.buyer}
                      onChangeText={(value) =>
                        setNegotiationPrices((prev) => ({ ...prev, buyer: value }))
                      }
                      placeholder={`${currentTradeOperation.buyListing.maxPricePerUnit}`}
                      keyboardType="numeric"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    />
                  </View>

                  {currentTradeOperation.selectedSellers?.map((seller) => (
                    <View key={seller.id} className="mb-4">
                      <Text className="text-gray-600 mb-2">
                        {seller.saleListing.seller.name} - Offer Price:
                      </Text>
                      <TextInput
                        value={negotiationPrices.sellers[seller.sellerId] || ''}
                        onChangeText={(value) =>
                          setNegotiationPrices((prev) => ({
                            ...prev,
                            sellers: { ...prev.sellers, [seller.sellerId]: value },
                          }))
                        }
                        placeholder={`${seller.saleListing.askingPrice}`}
                        keyboardType="numeric"
                        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                      />
                      <Text className="text-gray-500 text-sm mt-1">
                        Asking: ${seller.saleListing.askingPrice}/{seller.saleListing.unit}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={handleSendOffers}
                    disabled={isSendingOffers}
                    className="bg-orange-600 p-4 rounded-lg flex-row items-center justify-center mt-4"
                  >
                    {isSendingOffers ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Send size={20} color="white" />
                        <Text className="text-white font-bold ml-2">Send All Offers</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Transport Map Modal */}
      <TransportMapModal
        visible={showTransportMapModal}
        onClose={() => setShowTransportMapModal(false)}
        tradeOperation={currentTradeOperation}
        transportEstimate={transportEstimate}
        onConfirmRoute={() => {
          Alert.alert('Success', 'Transport route confirmed');
          setShowTransportMapModal(false);
        }}
      />
    </View>
  );
}
