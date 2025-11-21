import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import {
  Package,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  DollarSign,
  Truck,
  Calendar,
  Eye,
  Send,
} from 'lucide-react-native';

import { useTradeOperations } from './hooks/useTradeOperations';
import { TradeCreationDrawer } from './components/TradeCreationDrawer';
import { TransportMapModal } from './components/TransportMapModal';
import { TradeOperationDetailDrawer } from './components/TradeOperationDetailDrawer';
import { ActiveOperationsTab } from './components/ActiveOperationsTab';
import { OfferModal } from './components/OfferModal';
import { NegotiationManagementScreen } from './components/NegotiationManagementScreen';
import { CounterOfferModal } from './components/CounterOfferModal';
import type { BuyListing, SaleListing, TradeOperation } from '@services/tradeOperationService';

export default function OperationsScreenRefactored() {
  const {
    // Data
    buyListings = [],
    sellListings = [],
    tradeOperations = [],
    currentTradeOperation,
    matchingSellers,
    profitCalculation,
    transportEstimate,

    // Loading states
    isLoadingBuyListings,
    isLoadingSellListings,
    isLoadingMatchingSellers,
    isCalculatingProfit,
    isEstimatingTransport,
    isSendingOffers,

    // Actions
    loadBuyListings,
    loadSellListings,
    loadTradeOperations,
    createTradeOperation,
    findMatchingSellers,
    selectSellers,
    calculateProfit,
    refreshCurrentTrade,
    estimateTransportCost,
    sendBulkOffers,

    // Error handling
    error,
    clearError,
  } = useTradeOperations();

  // UI State
  const [activeTab, setActiveTab] = useState<'active' | 'create' | 'sellers'>('active');
  const [selectedBuyListing, setSelectedBuyListing] = useState<BuyListing | null>(null);
  const [showCreationDrawer, setShowCreationDrawer] = useState(false);
  const [showTransportMap, setShowTransportMap] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<TradeOperation | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerModalData, setOfferModalData] = useState<{
    tradeOperationId: string;
    tradeSellerId: string;
  } | null>(null);
  const [showNegotiationManagement, setShowNegotiationManagement] = useState(false);
  const [negotiationOperationId, setNegotiationOperationId] = useState<string | null>(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [counterOfferData, setCounterOfferData] = useState<{
    negotiationId: string;
    currentOffer: any;
    counterOffer?: any;
    sellerName?: string;
  } | null>(null);

  // Load data on mount
  useEffect(() => {
    loadBuyListings();
    loadSellListings();
    loadTradeOperations();
  }, []);

  // Tab Component
  const TabButton = ({ id, label, count, isActive }: any) => (
    <TouchableOpacity
      onPress={() => setActiveTab(id)}
      className={`flex-1 py-3 border-b-2 ${isActive ? 'border-blue-600' : 'border-transparent'}`}
    >
      <Text className={`text-center font-semibold ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
        {label} {count > 0 && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  // Render Active Operations
  const renderActiveOperations = () => (
    <ActiveOperationsTab
      onSelectOperation={(operation) => {
        // Open negotiation management instead of detail drawer
        setNegotiationOperationId(operation.id);
        setShowNegotiationManagement(true);
      }}
      onSendOffer={(tradeOperationId, tradeSellerId) => {
        setOfferModalData({ tradeOperationId, tradeSellerId });
        setShowOfferModal(true);
      }}
      onCounterOffer={(negotiationId) => {
        // Open counter offer modal - would fetch negotiation details in real app
        setCounterOfferData({
          negotiationId,
          currentOffer: { price: 0, quantity: 0 },
          sellerName: 'Seller',
        });
        setShowCounterOfferModal(true);
      }}
    />
  );

  // Render Seller Listings Tab
  const renderSellers = () => (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">Available Seller Listings</Text>
          <TouchableOpacity
            onPress={loadSellListings}
            disabled={isLoadingSellListings}
            className="px-3 py-1 bg-blue-100 rounded-full"
          >
            <Text className="text-blue-600 text-sm font-medium">
              {isLoadingSellListings ? 'Loading...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoadingSellListings ? (
          <View className="flex-1 justify-center items-center py-8">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-gray-600 mt-2">Loading seller listings...</Text>
          </View>
        ) : sellListings.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Package size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-2">No seller listings available</Text>
          </View>
        ) : (
          <>
            {sellListings.map((listing) => (
              <View
                key={listing.id}
                className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
              >
                {/* Seller Listing Header */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {listing.product?.name || 'Unknown Product'}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {listing.seller?.name || 'Unknown Seller'}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      listing.quality === 'premium'
                        ? 'bg-purple-100'
                        : listing.quality === 'standard'
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        listing.quality === 'premium'
                          ? 'text-purple-800'
                          : listing.quality === 'standard'
                            ? 'text-green-800'
                            : 'text-gray-800'
                      }`}
                    >
                      {listing.quality || 'Standard'}
                    </Text>
                  </View>
                </View>

                {/* Product Categories */}
                {listing.categories && listing.categories.length > 0 && (
                  <View className="flex-row flex-wrap gap-1 mb-2">
                    {listing.categories.slice(0, 3).map((cat, idx) => (
                      <View key={idx} className="px-2 py-1 bg-gray-100 rounded">
                        <Text className="text-xs text-gray-600">{cat}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Seller Listing Details */}
                <View className="space-y-2">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Package size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {listing.quantity} {listing.unit} available
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <DollarSign size={16} color="#10B981" />
                      <Text className="text-green-600 font-bold text-sm ml-1">
                        ${listing.askingPrice}/{listing.unit}
                      </Text>
                    </View>
                  </View>

                  {listing.harvestDate && (
                    <View className="flex-row items-center">
                      <Calendar size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-2 text-sm">
                        Harvest: {new Date(listing.harvestDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {listing.location && (
                    <View className="flex-row items-center">
                      <Truck size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-2 text-sm">
                        Location: {listing.location?.city || 'N/A'},{' '}
                        {listing.location?.country || 'N/A'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );

  // Render Create Trade Tab
  const renderCreateTrade = () => (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">Available Buy Orders</Text>

        {isLoadingBuyListings ? (
          <View className="flex-1 justify-center items-center py-8">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-gray-600 mt-2">Loading buy orders...</Text>
          </View>
        ) : buyListings.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Package size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-2">No buy orders available</Text>
          </View>
        ) : (
          <>
            {buyListings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                onPress={() => {
                  console.log('Selected buy listing:', JSON.stringify(listing, null, 2));
                  console.log('Buy listing ID:', listing.id);
                  console.log('Buy listing ID type:', typeof listing.id);
                  setSelectedBuyListing(listing);
                  setShowCreationDrawer(true);
                }}
                className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
              >
                {/* Buy Order Header */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {listing.product?.name || 'Unknown Product'}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {listing.buyer?.name || 'Unknown Buyer'}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      listing.urgency === 'critical'
                        ? 'bg-red-100'
                        : listing.urgency === 'high'
                          ? 'bg-orange-100'
                          : 'bg-blue-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        listing.urgency === 'critical'
                          ? 'text-red-800'
                          : listing.urgency === 'high'
                            ? 'text-orange-800'
                            : 'text-blue-800'
                      }`}
                    >
                      {listing.urgency || listing.status}
                    </Text>
                  </View>
                </View>

                {/* Product Requirements */}
                {listing.requirements && listing.requirements.length > 0 && (
                  <View className="flex-row flex-wrap gap-1 mb-2">
                    {listing.requirements.slice(0, 3).map((req, idx) => (
                      <View key={idx} className="px-2 py-1 bg-gray-100 rounded">
                        <Text className="text-xs text-gray-600">{req}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Buy Order Details */}
                <View className="space-y-2">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Package size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {listing.quantity} {listing.unit}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <DollarSign size={16} color="#10B981" />
                      <Text className="text-green-600 font-bold text-sm ml-1">
                        ${listing.maxPricePerUnit}/{listing.unit}
                      </Text>
                    </View>
                  </View>

                  {listing.neededBy && (
                    <View className="flex-row items-center">
                      <Calendar size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-2 text-sm">
                        Needed by: {new Date(listing.neededBy).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {listing.deliveryAddress && (
                    <View className="flex-row items-center">
                      <Truck size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-2 text-sm">
                        Delivery: {listing.deliveryAddress?.city || 'N/A'},{' '}
                        {listing.deliveryAddress?.country || 'N/A'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Create Trade Button */}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBuyListing(listing);
                    setShowCreationDrawer(true);
                  }}
                  className="mt-4 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
                >
                  <Plus size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Create Trade Operation</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );

  // If showing negotiation management, render that instead
  if (showNegotiationManagement && negotiationOperationId) {
    return (
      <NegotiationManagementScreen
        tradeOperationId={negotiationOperationId}
        onBack={() => {
          setShowNegotiationManagement(false);
          setNegotiationOperationId(null);
          loadTradeOperations(); // Refresh operations when returning
        }}
        onCounterOffer={(negotiationId, currentOffer) => {
          // For now, use placeholder data - in real app, would fetch full negotiation details
          setCounterOfferData({
            negotiationId,
            currentOffer: currentOffer || { price: 0, quantity: 0 },
            counterOffer: currentOffer,
            sellerName: 'Seller',
          });
          setShowCounterOfferModal(true);
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Trade Operations</Text>
        <Text className="text-gray-600 text-sm">Manage and create trade operations</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View className="bg-red-50 border-l-4 border-red-500 p-3 mx-4 mt-2">
          <View className="flex-row items-center">
            <AlertTriangle size={18} color="#EF4444" />
            <Text className="text-red-800 ml-2">{error}</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TabButton
          id="active"
          label="Active Operations"
          count={tradeOperations.length}
          isActive={activeTab === 'active'}
        />
        <TabButton
          id="create"
          label="Create Trade"
          count={buyListings.length}
          isActive={activeTab === 'create'}
        />
        <TabButton
          id="sellers"
          label="Seller Listings"
          count={sellListings.length}
          isActive={activeTab === 'sellers'}
        />
      </View>

      {/* Content */}
      {activeTab === 'active'
        ? renderActiveOperations()
        : activeTab === 'create'
          ? renderCreateTrade()
          : renderSellers()}

      {/* Trade Creation Drawer */}
      <TradeCreationDrawer
        visible={showCreationDrawer}
        onClose={() => {
          setShowCreationDrawer(false);
          setSelectedBuyListing(null);
        }}
        buyListing={selectedBuyListing}
        onTradeCreated={(trade) => {
          loadTradeOperations();
          setActiveTab('active');
        }}
        // Pass hook functions
        findMatchingSellers={findMatchingSellers}
        createTradeOperation={createTradeOperation}
        selectSellers={selectSellers}
        calculateProfit={calculateProfit}
        refreshCurrentTrade={refreshCurrentTrade}
        estimateTransportCost={estimateTransportCost}
        sendBulkOffers={sendBulkOffers}
        // Pass data
        currentTradeOperation={currentTradeOperation}
        matchingSellers={matchingSellers}
        profitCalculation={profitCalculation}
        transportEstimate={transportEstimate}
        isLoadingMatchingSellers={isLoadingMatchingSellers}
        isCalculatingProfit={isCalculatingProfit}
        isEstimatingTransport={isEstimatingTransport}
        isSendingOffers={isSendingOffers}
      />

      {/* Transport Map Modal (for viewing existing operations) */}
      <TransportMapModal
        visible={showTransportMap}
        onClose={() => setShowTransportMap(false)}
        tradeOperation={selectedOperation}
        transportEstimate={transportEstimate}
      />

      {/* Trade Operation Detail Drawer */}
      <TradeOperationDetailDrawer
        visible={showDetailDrawer}
        operationId={selectedOperationId}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedOperationId(null);
        }}
        onRefresh={loadTradeOperations}
      />

      {/* Offer Modal */}
      {offerModalData && (
        <OfferModal
          visible={showOfferModal}
          onClose={() => {
            setShowOfferModal(false);
            setOfferModalData(null);
            loadTradeOperations(); // Refresh after sending offer
          }}
          tradeOperationId={offerModalData.tradeOperationId}
          sellerId={offerModalData.tradeSellerId}
        />
      )}

      {/* Counter-Offer Modal */}
      {counterOfferData && (
        <CounterOfferModal
          visible={showCounterOfferModal}
          onClose={() => {
            setShowCounterOfferModal(false);
            setCounterOfferData(null);
          }}
          negotiationId={counterOfferData.negotiationId}
          currentOffer={counterOfferData.currentOffer}
          counterOffer={counterOfferData.counterOffer}
          sellerName={counterOfferData.sellerName}
          buyerMaxPrice={selectedOperation?.buyListing?.maxPricePerUnit}
          targetMargin={selectedOperation?.targetProfitMargin}
          onOfferSent={() => {
            loadTradeOperations(); // Refresh after responding
          }}
        />
      )}
    </View>
  );
}
