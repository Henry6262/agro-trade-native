import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  X,
  ChevronRight,
  Package,
  Users,
  Truck,
  DollarSign,
  Send,
  CheckCircle,
  MapPin,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react-native';
import { TransportMapView } from './TransportMapView';
import { OfferModal } from './OfferModal';
import type {
  BuyListing,
  SaleListing,
  TradeOperation,
  MatchingSeller,
  ProfitCalculation,
  TransportEstimate,
} from '../../../../services/tradeOperationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TradeCreationDrawerProps {
  visible: boolean;
  onClose: () => void;
  buyListing: BuyListing | null;
  onTradeCreated?: (trade: TradeOperation) => void;
  // Hook functions
  findMatchingSellers: (tradeId: string, maxDistance?: number) => Promise<void>;
  createTradeOperation: (
    buyListingId: string,
    targetMargin: number
  ) => Promise<TradeOperation | null>;
  selectSellers: (tradeId: string, sellers: any[]) => Promise<boolean>;
  calculateProfit: (tradeId: string) => Promise<void>;
  refreshCurrentTrade?: (tradeId: string) => Promise<void>;
  estimateTransportCost: (params: any) => Promise<void>;
  sendBulkOffers: (params: any) => Promise<boolean>;
  // Data from hook
  currentTradeOperation?: TradeOperation | null;
  matchingSellers: MatchingSeller[];
  profitCalculation: ProfitCalculation | null;
  transportEstimate: TransportEstimate | null;
  isLoadingMatchingSellers: boolean;
  isCalculatingProfit: boolean;
  isEstimatingTransport: boolean;
  isSendingOffers: boolean;
}

const STEPS = [
  { id: 1, title: 'Review Order', icon: Package },
  { id: 2, title: 'Find Sellers', icon: Users },
  { id: 3, title: 'Plan Transport', icon: Truck },
  { id: 4, title: 'Calculate Profit', icon: TrendingUp },
  { id: 5, title: 'Send Offers', icon: Send },
];

export const TradeCreationDrawer: React.FC<TradeCreationDrawerProps> = ({
  visible,
  onClose,
  buyListing,
  onTradeCreated,
  findMatchingSellers,
  createTradeOperation,
  selectSellers,
  calculateProfit,
  refreshCurrentTrade,
  estimateTransportCost,
  sendBulkOffers,
  currentTradeOperation,
  matchingSellers,
  profitCalculation,
  transportEstimate,
  isLoadingMatchingSellers,
  isCalculatingProfit,
  isEstimatingTransport,
  isSendingOffers,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [localTradeOperation, setLocalTradeOperation] = useState<TradeOperation | null>(null);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]);

  // Use currentTradeOperation from hook if available, otherwise use local state
  const tradeOperation = currentTradeOperation || localTradeOperation;
  const [targetMargin, setTargetMargin] = useState('7.5');
  const [offerPrices, setOfferPrices] = useState<{
    buyer: string;
    sellers: Record<string, string>;
  }>({ buyer: '', sellers: {} });
  const [isCreatingTrade, setIsCreatingTrade] = useState(false);

  // Offer modal state
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedSellerForOffer, setSelectedSellerForOffer] = useState<MatchingSeller | null>(null);

  // Reset when drawer opens
  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      setLocalTradeOperation(null);
      setSelectedSellers([]);
      setTargetMargin('7.5');
      setOfferPrices({ buyer: '', sellers: {} });
    }
  }, [visible]);

  // Step 1: Review and Create Trade
  const handleCreateTrade = async () => {
    if (!buyListing) return;

    // Debug log to check the buyListing structure
    console.log('Buy Listing data:', JSON.stringify(buyListing, null, 2));
    console.log('Buy Listing ID:', buyListing.id);
    console.log('Buy Listing ID type:', typeof buyListing.id);

    if (!buyListing.id) {
      Alert.alert('Error', 'Buy listing ID is missing');
      return;
    }

    const margin = parseFloat(targetMargin);
    if (isNaN(margin) || margin < 5 || margin > 15) {
      Alert.alert('Error', 'Target margin must be between 5% and 15%');
      return;
    }

    setIsCreatingTrade(true);
    const trade = await createTradeOperation(buyListing.id, margin);
    if (trade) {
      setLocalTradeOperation(trade);
      // Trade operation is now created! User can send offers immediately
      Alert.alert(
        'Success',
        'Trade operation created! You can now select sellers and send offers.'
      );
      setCurrentStep(2);
      // Auto-find matching sellers
      await findMatchingSellers(trade.id, 200);
    }
    setIsCreatingTrade(false);
  };

  // Step 2: Select Sellers
  const handleSelectSellers = async () => {
    if (!tradeOperation || selectedSellers.length === 0) {
      Alert.alert('Error', 'Please select at least one seller');
      return;
    }

    const buyerQuantity = Number(buyListing?.quantity) || 0;
    let remainingQuantity = buyerQuantity;

    const sellersToAdd = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((s) => s.sellerId === sellerId);
        if (!seller || remainingQuantity <= 0) return null;

        // Ensure both values are proper numbers
        const sellerAvailability = Number(seller.availability) || 0;

        // Calculate how much we actually need from this seller
        const requestedQty = Math.min(sellerAvailability, remainingQuantity);

        // Reduce remaining quantity for next seller
        remainingQuantity -= requestedQty;

        console.log(
          `Seller ${seller.sellerId}: Available: ${sellerAvailability}, Taking: ${requestedQty}, Remaining needed: ${remainingQuantity}`
        );

        return {
          sellerId: seller.sellerId,
          saleListingId: seller.saleListingId,
          requestedQuantity: requestedQty,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null && s.requestedQuantity > 0);

    const success = await selectSellers(tradeOperation.id, sellersToAdd);
    if (success) {
      // Refresh the trade operation to get the updated sellers
      if (refreshCurrentTrade) {
        await refreshCurrentTrade(tradeOperation.id);
      }
      setCurrentStep(3);
      // Auto-estimate transport
      await handleEstimateTransport();
    }
  };

  // Step 3: Estimate Transport
  const handleEstimateTransport = async () => {
    if (!tradeOperation || !buyListing) return;

    const origin = { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' };
    const destination = {
      latitude: buyListing.deliveryAddress?.latitude || 41.8781,
      longitude: buyListing.deliveryAddress?.longitude || -87.6298,
      address: buyListing.deliveryAddress?.address || 'Chicago, IL',
    };

    const pickupLocations = selectedSellers.map((sellerId, index) => {
      const seller = matchingSellers.find((s) => s.sellerId === sellerId);
      return {
        latitude: 42.0 + index * 0.1,
        longitude: -93.0 + index * 0.1,
        address: seller?.saleListing.address?.address || `Farm ${index + 1}`,
        quantity: seller?.availability || 0,
      };
    });

    await estimateTransportCost({
      origin,
      pickupLocations,
      destination,
      quantity: buyListing.quantity,
      vehicleType: 'TRUCK',
    });

    // Auto-calculate profit
    await calculateProfit(tradeOperation.id);
    setCurrentStep(4);
  };

  // Step 5: Send Offers
  const handleSendOffers = async () => {
    if (!tradeOperation || !buyListing) return;

    const buyerPrice = parseFloat(offerPrices.buyer || buyListing.maxPricePerUnit.toString());
    const sellerOffers = selectedSellers
      .map((sellerId) => {
        const seller = matchingSellers.find((s) => s.sellerId === sellerId);
        return {
          sellerId,
          price: parseFloat(offerPrices.sellers[sellerId] || seller?.askingPrice.toString() || '0'),
          quantity: seller?.availability || 0,
        };
      })
      .filter((o) => o.price > 0);

    const success = await sendBulkOffers({
      tradeOperationId: tradeOperation.id,
      buyerOffer: { price: buyerPrice },
      sellerOffers,
    });

    if (success) {
      Alert.alert('Success', 'Trade operation created and offers sent!');
      onTradeCreated?.(tradeOperation);
      onClose();
    }
  };

  // Step Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!buyListing;
      case 2:
        return selectedSellers.length > 0;
      case 3:
        return !!transportEstimate;
      case 4:
        return !!profitCalculation;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    switch (currentStep) {
      case 1:
        await handleCreateTrade();
        break;
      case 2:
        await handleSelectSellers();
        break;
      case 3:
        setCurrentStep(4);
        break;
      case 4:
        setCurrentStep(5);
        break;
      case 5:
        await handleSendOffers();
        break;
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <View key={step.id} className="flex-1 flex-row items-center">
            <View className="items-center flex-1">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isActive ? 'bg-blue-600' : isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} color="white" />
                ) : (
                  <Icon size={16} color="white" />
                )}
              </View>
              <Text
                className={`text-xs mt-1 ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
                }`}
              >
                {step.title}
              </Text>
            </View>
            {index < STEPS.length - 1 && <ChevronRight size={16} color="#9CA3AF" />}
          </View>
        );
      })}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderReviewStep();
      case 2:
        return renderSellerSelectionStep();
      case 3:
        return renderTransportStep();
      case 4:
        return renderProfitStep();
      case 5:
        return renderOffersStep();
      default:
        return null;
    }
  };

  const renderReviewStep = () => (
    <ScrollView className="flex-1 p-4">
      <Text className="text-lg font-bold text-gray-800 mb-4">Review Buy Order & Create Trade</Text>

      {!tradeOperation && (
        <View className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
          <Text className="text-blue-800 font-medium mb-1">⚠️ Important</Text>
          <Text className="text-blue-700 text-sm">
            Clicking "Create Trade & Continue" will create a trade operation with your specified
            margin. You'll then be able to select sellers and send offers immediately.
          </Text>
        </View>
      )}

      {buyListing && (
        <View className="bg-white rounded-lg p-4 border border-gray-200">
          <View className="mb-4">
            <Text className="text-gray-600 text-sm">Product</Text>
            <Text className="text-gray-800 font-semibold text-lg">
              {buyListing.product?.name || 'Unknown Product'}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm">Buyer</Text>
            <Text className="text-gray-800 font-semibold">
              {buyListing.buyer?.name || 'Unknown Buyer'}
            </Text>
            {buyListing.deliveryAddress && (
              <View className="flex-row items-center mt-1">
                <MapPin size={12} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {buyListing.deliveryAddress.city ||
                    buyListing.deliveryAddress.address ||
                    'Delivery location set'}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row justify-between mb-4">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm">Quantity</Text>
              <Text className="text-gray-800 font-semibold">
                {buyListing.quantity} {buyListing.unit || 'TON'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm">Max Price</Text>
              <Text className="text-green-600 font-bold">
                ${buyListing.maxPricePerUnit}/{buyListing.unit || 'TON'}
              </Text>
            </View>
          </View>

          {buyListing.neededBy && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm">Needed By</Text>
              <View className="flex-row items-center mt-1">
                <Calendar size={16} color="#6B7280" />
                <Text className="text-gray-800 ml-2">
                  {new Date(buyListing.neededBy).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}

          <View className="border-t border-gray-200 pt-4">
            <Text className="text-gray-600 text-sm mb-2">Target Profit Margin (%)</Text>
            <TextInput
              value={targetMargin}
              onChangeText={setTargetMargin}
              placeholder="7.5"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
            />
            <Text className="text-gray-500 text-xs mt-1">Minimum: 5%, Maximum: 15%</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderSellerSelectionStep = () => {
    // Calculate actual quantities that will be taken from each seller
    const buyerQuantity = Number(buyListing?.quantity) || 0;
    let remainingNeeded = buyerQuantity;

    const sellerQuantities: { [key: string]: number } = {};
    let totalSelectedQuantity = 0;

    selectedSellers.forEach((sellerId) => {
      const seller = matchingSellers.find((s) => s.sellerId === sellerId);
      if (seller && remainingNeeded > 0) {
        const available = Number(seller.availability) || 0;
        const taking = Math.min(available, remainingNeeded);
        sellerQuantities[sellerId] = taking;
        totalSelectedQuantity += taking;
        remainingNeeded -= taking;
      }
    });

    const progressPercentage =
      buyerQuantity > 0 ? (totalSelectedQuantity / buyerQuantity) * 100 : 0;

    return (
      <View className="flex-1">
        {/* Fixed Header with Buyer Requirements */}
        <View className="px-4 pt-4">
          <View className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <View
                className={`px-2 py-1 rounded ${progressPercentage >= 100 ? 'bg-green-100' : 'bg-orange-100'}`}
              >
                <Text
                  className={`text-sm font-bold ${progressPercentage >= 100 ? 'text-green-800' : 'text-orange-800'}`}
                >
                  {totalSelectedQuantity} / {buyerQuantity} TON
                </Text>
              </View>
              <Text className="text-green-600 text-sm font-bold">
                Max: ${buyListing?.maxPricePerUnit}/TON
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className={`h-full ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </View>

            {buyListing?.specifications && buyListing.specifications.length > 0 && (
              <View className="mt-2 pt-2 border-t border-blue-200">
                <Text className="text-gray-600 text-sm mb-1 font-medium">
                  Required Specifications:
                </Text>
                {buyListing.specifications.slice(0, 3).map((spec, index) => (
                  <View key={index} className="flex-row items-start ml-2">
                    <Text className="text-gray-700 text-xs">• </Text>
                    <Text className="text-gray-700 text-xs flex-1">
                      {spec.specificationType?.name}: {spec.valueText || spec.valueNumber || 'N/A'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Scrollable Seller List */}
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {isLoadingMatchingSellers ? (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-gray-600 mt-2">Finding matching sellers...</Text>
            </View>
          ) : (
            <>
              {matchingSellers.map((seller) => {
                const isSelected = selectedSellers.includes(seller.sellerId);
                const actualQuantity = sellerQuantities[seller.sellerId] || 0;
                const available = Number(seller.availability) || 0;
                const isPartialUse = isSelected && actualQuantity < available;

                return (
                  <TouchableOpacity
                    key={seller.sellerId}
                    onPress={() => {
                      setSelectedSellers((prev) =>
                        prev.includes(seller.sellerId)
                          ? prev.filter((id) => id !== seller.sellerId)
                          : [...prev, seller.sellerId]
                      );
                    }}
                    className={`mb-3 p-3 rounded-lg border-2 ${
                      isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">
                          {seller.saleListing?.seller?.name || 'Unknown Seller'}
                        </Text>
                        {/* Location display */}
                        <View className="flex-row items-center mt-1">
                          <MapPin size={10} color="#6B7280" />
                          <Text className="text-gray-500 text-xs ml-1">
                            {seller.location?.displayName ||
                              (seller.location?.city
                                ? `${seller.location.city} • ${seller.distance}km`
                                : 'Location N/A')}
                          </Text>
                        </View>
                      </View>
                      <View className="px-2 py-1 rounded bg-orange-100">
                        <Text className="text-orange-800 text-xs">Match: {seller.matchScore}%</Text>
                      </View>
                    </View>

                    <View className="mb-2">
                      <Text className="text-gray-600 text-sm">
                        {seller.availability} {seller.saleListing?.unit || 'TON'} available
                      </Text>
                      {isSelected && (
                        <Text
                          className={`text-sm font-semibold mt-1 ${isPartialUse ? 'text-orange-600' : 'text-green-600'}`}
                        >
                          {isPartialUse
                            ? `✓ Taking only ${actualQuantity} TON (partial)`
                            : `✓ Taking all ${actualQuantity} TON`}
                        </Text>
                      )}
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="text-green-600 font-bold">
                        ${seller.askingPrice}/{seller.saleListing?.unit || 'TON'}
                      </Text>
                      {/* Negotiation button - only shows when selected */}
                      {isSelected && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation(); // Prevent card selection toggle
                            setSelectedSellerForOffer(seller);
                            setShowOfferModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 rounded-full"
                        >
                          <Text className="text-white text-xs font-medium">Send Offer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {matchingSellers.length === 0 && (
                <View className="py-8 items-center">
                  <Text className="text-gray-500">No matching sellers found</Text>
                  <Text className="text-gray-400 text-sm mt-2">
                    Try refreshing or adjusting criteria
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderTransportStep = () => {
    if (!tradeOperation || !buyListing) return null;

    const route = transportEstimate
      ? {
          origin: { latitude: 42.0, longitude: -93.0, address: 'Warehouse, Iowa' },
          pickupLocations: selectedSellers.map((sellerId, index) => {
            const seller = matchingSellers.find((s) => s.sellerId === sellerId);
            return {
              sellerId,
              sellerName: seller?.saleListing?.seller?.name || 'Seller',
              latitude: 42.0 + index * 0.15,
              longitude: -93.0 + index * 0.15,
              address: seller?.saleListing.address?.address || `Farm ${index + 1}`,
              quantity: seller?.availability || 0,
              product: seller?.saleListing?.product?.name || 'Product',
            };
          }),
          destination: {
            latitude: buyListing.deliveryAddress?.latitude || 41.8781,
            longitude: buyListing.deliveryAddress?.longitude || -87.6298,
            address: buyListing.deliveryAddress?.address || 'Chicago, IL',
          },
          totalDistance: transportEstimate?.distance,
          estimatedDuration: transportEstimate?.duration,
          estimatedCost: transportEstimate?.costs.totalCost,
        }
      : null;

    return (
      <View className="flex-1">
        {isEstimatingTransport ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-gray-600 mt-2">Estimating transport...</Text>
          </View>
        ) : route ? (
          <>
            <TransportMapView route={route} height={screenHeight * 0.4} showDetails={false} />

            <ScrollView className="flex-1 p-4">
              <View className="bg-white rounded-lg p-4 border border-gray-200">
                <Text className="text-lg font-bold text-gray-800 mb-3">Transport Summary</Text>

                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Distance:</Text>
                  <Text className="font-semibold">{transportEstimate.distance} km</Text>
                </View>

                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Duration:</Text>
                  <Text className="font-semibold">
                    {Math.round(transportEstimate.duration / 60)} hours
                  </Text>
                </View>

                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Pickup Stops:</Text>
                  <Text className="font-semibold">{selectedSellers.length}</Text>
                </View>

                <View className="h-px bg-gray-200 my-2" />

                <View className="flex-row justify-between">
                  <Text className="text-gray-800 font-semibold">Transport Cost:</Text>
                  <Text className="font-bold text-blue-600">
                    ${transportEstimate.costs.totalCost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </>
        ) : (
          <View className="flex-1 justify-center items-center p-4">
            <Truck size={48} color="#6B7280" />
            <Text className="text-gray-600 mt-2">Transport estimation pending...</Text>
          </View>
        )}
      </View>
    );
  };

  const renderProfitStep = () => (
    <ScrollView className="flex-1 p-4">
      <Text className="text-lg font-bold text-gray-800 mb-4">Profit Analysis</Text>

      {isCalculatingProfit ? (
        <View className="flex-1 justify-center items-center py-8">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-600 mt-2">Calculating profit...</Text>
        </View>
      ) : profitCalculation ? (
        <>
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <Text className="text-gray-800 font-semibold mb-3">Revenue Breakdown</Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Selling Price:</Text>
              <Text className="font-semibold">
                ${profitCalculation.revenue.sellingPrice.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Quantity:</Text>
              <Text className="font-semibold">{profitCalculation.revenue.quantity} units</Text>
            </View>

            <View className="h-px bg-gray-200 my-2" />

            <View className="flex-row justify-between">
              <Text className="text-gray-800 font-semibold">Total Revenue:</Text>
              <Text className="font-bold text-green-600">
                ${profitCalculation.revenue.totalRevenue.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <Text className="text-gray-800 font-semibold mb-3">Cost Breakdown</Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Purchase Cost:</Text>
              <Text className="font-semibold">
                ${profitCalculation.costs.purchaseCost.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Transport Cost:</Text>
              <Text className="font-semibold">
                ${profitCalculation.costs.transportCost.toFixed(2)}
              </Text>
            </View>

            <View className="h-px bg-gray-200 my-2" />

            <View className="flex-row justify-between">
              <Text className="text-gray-800 font-semibold">Total Costs:</Text>
              <Text className="font-bold text-red-600">
                ${profitCalculation.costs.totalCosts.toFixed(2)}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-lg p-4 border-2 ${
              profitCalculation.profit.meetsMinimumMargin
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <View className="flex-row items-center mb-2">
              {profitCalculation.profit.meetsMinimumMargin ? (
                <CheckCircle size={20} color="#10B981" />
              ) : (
                <AlertTriangle size={20} color="#EF4444" />
              )}
              <Text
                className={`font-bold ml-2 ${
                  profitCalculation.profit.meetsMinimumMargin ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {profitCalculation.profit.meetsMinimumMargin
                  ? 'Profitable Trade'
                  : 'Below Minimum Margin'}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-800 font-semibold">Net Profit:</Text>
              <Text
                className={`font-bold text-lg ${
                  profitCalculation.profit.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${profitCalculation.profit.netProfit.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-800 font-semibold">Profit Margin:</Text>
              <Text
                className={`font-bold text-lg ${
                  profitCalculation.profit.meetsMinimumMargin ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {profitCalculation.profit.profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View className="flex-1 justify-center items-center py-8">
          <TrendingUp size={48} color="#6B7280" />
          <Text className="text-gray-600 mt-2">Profit calculation pending...</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderOffersStep = () => {
    if (!buyListing || !tradeOperation) return null;

    return (
      <ScrollView className="flex-1 p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">Send Offers</Text>

        <View className="bg-blue-50 rounded-lg p-3 mb-4">
          <Text className="text-blue-800 text-sm">
            Review and adjust offer prices before sending to all parties.
          </Text>
        </View>

        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <Text className="text-gray-800 font-semibold mb-3">Buyer Offer</Text>

          <View className="mb-2">
            <Text className="text-gray-600 text-sm">
              To: {buyListing.buyer?.name || 'Unknown Buyer'}
            </Text>
            <Text className="text-gray-500 text-xs">Max price: ${buyListing.maxPricePerUnit}</Text>
          </View>

          <TextInput
            value={offerPrices.buyer}
            onChangeText={(value) => setOfferPrices((prev) => ({ ...prev, buyer: value }))}
            placeholder={buyListing.maxPricePerUnit.toString()}
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
          />
        </View>

        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <Text className="text-gray-800 font-semibold mb-3">Seller Offers</Text>

          {selectedSellers.map((sellerId) => {
            const seller = matchingSellers.find((s) => s.sellerId === sellerId);
            if (!seller) return null;

            return (
              <View key={sellerId} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
                <View className="mb-2">
                  <Text className="text-gray-600 text-sm">
                    To: {seller.saleListing?.seller?.name || 'Unknown Seller'}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Asking: ${seller.askingPrice} | Qty: {seller.availability} units
                  </Text>
                </View>

                <TextInput
                  value={offerPrices.sellers[sellerId] || ''}
                  onChangeText={(value) =>
                    setOfferPrices((prev) => ({
                      ...prev,
                      sellers: { ...prev.sellers, [sellerId]: value },
                    }))
                  }
                  placeholder={seller.askingPrice.toString()}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                />
              </View>
            );
          })}
        </View>

        {profitCalculation && (
          <View className="bg-yellow-50 rounded-lg p-3 mb-4">
            <Text className="text-yellow-800 text-sm">
              Expected profit with current prices: ${profitCalculation.profit.netProfit.toFixed(2)}{' '}
              ({profitCalculation.profit.profitMargin.toFixed(1)}%)
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800">Create Trade Operation</Text>
                {buyListing && (
                  <Text className="text-sm text-gray-600">
                    {buyListing.product?.name || 'Unknown Product'} - {buyListing.quantity}{' '}
                    {buyListing.unit || 'TON'}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} className="p-2">
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Content */}
          <View className="flex-1">{renderStepContent()}</View>

          {/* Footer Actions */}
          <View className="border-t border-gray-200 bg-white px-4 py-3">
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => {
                  if (currentStep > 1) {
                    setCurrentStep(currentStep - 1);
                  } else {
                    onClose();
                  }
                }}
                className="px-6 py-3 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-semibold">
                  {currentStep === 1 ? 'Cancel' : 'Back'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                disabled={!canProceed() || isCreatingTrade || isSendingOffers}
                className={`px-6 py-3 rounded-lg flex-row items-center ${
                  canProceed() ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                {isCreatingTrade || isSendingOffers ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text className="text-white font-semibold mr-2">
                      {currentStep === 1
                        ? 'Create Trade & Continue'
                        : currentStep === 5
                          ? 'Send Offers'
                          : 'Next'}
                    </Text>
                    <ArrowRight size={16} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Offer Modal */}
      {tradeOperation && (
        <OfferModal
          visible={showOfferModal}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedSellerForOffer(null);
          }}
          seller={selectedSellerForOffer}
          tradeOperationId={tradeOperation.id}
          tradeOperation={tradeOperation}
          onOfferSent={() => {
            setShowOfferModal(false);
            setSelectedSellerForOffer(null);
            Alert.alert('Success', 'Offer sent successfully!');
            // Refresh the trade operation to get updated negotiations
            if (refreshCurrentTrade) {
              refreshCurrentTrade(tradeOperation.id);
            }
          }}
          buyerMaxPrice={buyListing?.maxPricePerUnit}
          requiredQuantity={buyListing?.quantity}
        />
      )}
    </>
  );
};

export default TradeCreationDrawer;
