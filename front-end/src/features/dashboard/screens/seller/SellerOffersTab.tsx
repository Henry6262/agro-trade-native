import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  MapPin,
  Weight,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Calendar,
  Award,
  Target,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';

import { Card, CardContent } from '../../../../shared/components/Card';
import { Badge } from '../../../../shared/components/Badge';
import { useSellerOffers } from '../../../../shared/hooks/useSellerOffers';
import { SellerAcceptOfferModal } from './components/SellerAcceptOfferModal';
import { SellerRejectOfferModal } from './components/SellerRejectOfferModal';
import { SellerCounterOfferModal } from './components/SellerCounterOfferModal';
import { SellerOffer } from '../../../../services/sellerOfferService';

interface SellerOffersTabProps {
  id?: string;
}

export default function SellerOffersTab({ id }: SellerOffersTabProps = {}) {
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<SellerOffer | null>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [counterModalVisible, setCounterModalVisible] = useState(false);

  // Use the seller offers hook
  const {
    offers,
    stats,
    isLoading,
    isError,
    error,
    acceptOffer,
    rejectOffer,
    makeCounterOffer,
    refreshOffers,
    isAccepting,
    isRejecting,
    isCountering,
    acceptSuccess,
    rejectSuccess,
    counterSuccess,
  } = useSellerOffers();

  // Handle modal actions
  const handleAcceptOffer = (offer: SellerOffer) => {
    setSelectedOffer(offer);
    setAcceptModalVisible(true);
  };

  const handleRejectOffer = (offer: SellerOffer) => {
    setSelectedOffer(offer);
    setRejectModalVisible(true);
  };

  const handleCounterOffer = (offer: SellerOffer) => {
    setSelectedOffer(offer);
    setCounterModalVisible(true);
  };

  const handleAcceptConfirm = (negotiationId: string, acceptanceNote?: string) => {
    acceptOffer(negotiationId, acceptanceNote);
    setAcceptModalVisible(false);
    setSelectedOffer(null);
  };

  const handleRejectConfirm = (negotiationId: string, reason?: string) => {
    rejectOffer(negotiationId, reason);
    setRejectModalVisible(false);
    setSelectedOffer(null);
  };

  const handleCounterConfirm = (negotiationId: string, counterPrice: number, quantity?: number, message?: string) => {
    makeCounterOffer(negotiationId, counterPrice, quantity, message);
    setCounterModalVisible(false);
    setSelectedOffer(null);
  };

  // Handle success alerts
  React.useEffect(() => {
    if (acceptSuccess) {
      Alert.alert('Success', 'Offer accepted successfully!');
    }
    if (rejectSuccess) {
      Alert.alert('Offer Rejected', 'The offer has been rejected.');
    }
    if (counterSuccess) {
      Alert.alert('Counter Offer Sent', 'Your counter offer has been sent to the buyer.');
    }
  }, [acceptSuccess, rejectSuccess, counterSuccess]);

  const handleRefresh = () => {
    refreshOffers();
  };

  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'expired':
        return 'bg-gray-500';
      default:
        return 'bg-neutral-500';
    }
  };

  // Show loading state
  if (isLoading && offers.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#FB923C" />
        <Text className="text-white mt-4">Loading your offers...</Text>
      </View>
    );
  }

  // Show error state
  if (isError) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <AlertCircle color="#EF4444" size={48} />
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          Failed to load offers
        </Text>
        <Text className="text-neutral-400 text-center mt-2">
          {error?.message || 'Please try again later'}
        </Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-orange-500 px-6 py-3 rounded-lg mt-4 flex-row items-center"
        >
          <RefreshCw color="#FFFFFF" size={16} />
          <Text className="text-white font-semibold ml-2">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#FB923C"
            colors={['#FB923C']}
          />
        }
      >
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-white">Incoming Offers</Text>
            <Text className="text-neutral-400">Review and respond to buyer requests</Text>
          </View>

          {/* Stats Cards - 3 in One Row */}
          <View className="flex-row justify-between gap-2 mb-6">
            {/* Pending Offers */}
            <Card className="bg-neutral-900 border-neutral-700 flex-1">
              <CardContent className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Clock color="#fb923c" size={24} />
                  <Text className="text-2xl font-bold text-white">{stats.pendingOffers}</Text>
                </View>
                <Text className="text-xs text-neutral-400">Pending</Text>
              </CardContent>
            </Card>

            {/* Accepted */}
            <Card className="bg-neutral-900 border-neutral-700 flex-1">
              <CardContent className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <CheckCircle color="#60a5fa" size={24} />
                  <Text className="text-2xl font-bold text-white">{stats.acceptedThisMonth}</Text>
                </View>
                <Text className="text-xs text-neutral-400">Accepted</Text>
              </CardContent>
            </Card>

            {/* Average Value */}
            <Card className="bg-neutral-900 border-neutral-700 flex-1">
              <CardContent className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <DollarSign color="#8b5cf6" size={24} />
                  <Text className="text-2xl font-bold text-white">
                    ${(stats.averageOfferValue / 1000).toFixed(1)}k
                  </Text>
                </View>
                <Text className="text-xs text-neutral-400">Avg Value</Text>
              </CardContent>
            </Card>
          </View>

          {/* Offers List */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold text-white">Active Offers</Text>
              <TouchableOpacity onPress={handleRefresh}>
                <Badge className="bg-orange-500 text-white px-3 py-1 rounded flex-row items-center">
                  <RefreshCw color="#FFFFFF" size={12} />
                  <Text className="text-white text-sm ml-1">{stats.pendingOffers} Pending</Text>
                </Badge>
              </TouchableOpacity>
            </View>

            {offers.length === 0 ? (
              <View className="bg-neutral-800 rounded-lg p-8 items-center">
                <Target color="#6B7280" size={48} />
                <Text className="text-white font-semibold text-lg mt-4">No offers yet</Text>
                <Text className="text-neutral-400 text-center mt-2">
                  When buyers are interested in your products, their offers will appear here.
                </Text>
              </View>
            ) : (
              offers.map((offer) => (
                <Card
                  key={offer.id}
                  className={`mb-4 ${
                    offer.status === 'pending'
                      ? 'bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-orange-500/30'
                      : offer.status === 'accepted'
                      ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30'
                      : offer.status === 'rejected'
                      ? 'bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/30'
                      : offer.status === 'countered'
                      ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-500/30'
                      : 'bg-gradient-to-r from-gray-900/20 to-gray-800/20 border-gray-500/30'
                  }`}
                >
                  <CardContent className="p-6">
                    <View className="flex-row justify-between items-start mb-4">
                      <View>
                        <Text className="text-lg font-semibold text-white">{offer.product}</Text>
                        <View className="flex-row items-center gap-4 mt-2">
                          <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                            <Weight color="#fb923c" size={16} />
                            <Text className="text-white font-medium text-sm">{offer.quantity} tons</Text>
                          </View>
                          <View className="flex-row items-center gap-1 bg-neutral-800/50 px-2 py-1 rounded">
                            <DollarSign color="#fb923c" size={16} />
                            <Text className="text-white font-medium text-sm">${offer.offeredPricePerTon}/ton</Text>
                          </View>
                          <View className="flex-row items-center gap-1 bg-orange-500/20 px-2 py-1 rounded">
                            <Text className="text-orange-300 text-xs">Total:</Text>
                            <Text className="text-orange-400 font-bold text-sm">
                              ${offer.totalValue.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-col items-end gap-1">
                        <Badge className={`px-2 py-1 rounded flex-row items-center gap-1 ${
                          offer.status === 'pending' ? 'bg-orange-500' :
                          offer.status === 'accepted' ? 'bg-green-500' :
                          offer.status === 'rejected' ? 'bg-red-500' :
                          offer.status === 'countered' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}>
                          <Text className="text-white text-xs capitalize">{offer.status}</Text>
                        </Badge>
                        {offer.isExpiringSoon && offer.status === 'pending' && (
                          <Badge className="bg-red-500 text-white px-2 py-1 rounded flex-row items-center gap-1">
                            <Clock color="#ffffff" size={12} />
                            <Text className="text-white text-xs">{offer.hoursUntilExpiry}h left</Text>
                          </Badge>
                        )}
                      </View>
                    </View>

                  <View className="mb-4">
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Buyer:</Text>
                      <Text className="text-white font-medium">{offer.buyer}</Text>
                      <View className="flex-row items-center gap-1">
                        <MapPin color="#9ca3af" size={12} />
                        <Text className="text-neutral-400 text-sm">
                          {offer.buyerFlag} {offer.buyerLocation}
                        </Text>
                      </View>
                    </View>
                    <View className="mb-2">
                      <Text className="text-neutral-400 text-sm">Quality Requirements:</Text>
                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {offer.qualityRequirements.map((req, index) => (
                          <Badge
                            key={index}
                            className="text-xs border-orange-400 text-orange-300 border px-2 py-1 rounded"
                          >
                            {req}
                          </Badge>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Estimated Profit Highlight */}
                  <View className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-green-400 text-sm">Estimated Profit</Text>
                      <Text className="text-green-400 font-bold text-lg">
                        +${offer.estimatedProfit}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-neutral-800/50 rounded-lg p-3 mb-4">
                    <Text className="text-neutral-400 text-sm">Admin Note:</Text>
                    <Text className="text-neutral-300 mt-1 text-sm">{offer.adminNote}</Text>
                  </View>

                    {offer.status === 'pending' && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity 
                          onPress={() => handleAcceptOffer(offer)}
                          disabled={isAccepting || isRejecting || isCountering}
                          className="flex-1 bg-green-500 py-2 px-4 rounded flex-row items-center justify-center gap-2"
                        >
                          {isAccepting ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <CheckCircle color="#ffffff" size={16} />
                          )}
                          <Text className="text-white font-semibold">Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleRejectOffer(offer)}
                          disabled={isAccepting || isRejecting || isCountering}
                          className="bg-transparent border border-red-500 py-2 px-3 rounded"
                        >
                          <X color="#ef4444" size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleCounterOffer(offer)}
                          disabled={isAccepting || isRejecting || isCountering}
                          className="bg-transparent border border-orange-500 py-2 px-3 rounded"
                        >
                          <DollarSign color="#fb923c" size={16} />
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {offer.status === 'accepted' && (
                      <View className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                        <Text className="text-green-400 text-sm font-semibold">Offer Accepted</Text>
                        <Text className="text-green-300 text-xs mt-1">
                          You've accepted this offer. The buyer has been notified.
                        </Text>
                      </View>
                    )}
                    
                    {offer.status === 'rejected' && (
                      <View className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                        <Text className="text-red-400 text-sm font-semibold">Offer Rejected</Text>
                        <Text className="text-red-300 text-xs mt-1">
                          You've rejected this offer. The negotiation has ended.
                        </Text>
                      </View>
                    )}
                    
                    {offer.status === 'countered' && (
                      <View className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                        <Text className="text-blue-400 text-sm font-semibold">Counter Offer Sent</Text>
                        <Text className="text-blue-300 text-xs mt-1">
                          Waiting for buyer's response to your counter offer.
                        </Text>
                      </View>
                    )}
                    
                    {offer.status === 'expired' && (
                      <View className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-3">
                        <Text className="text-gray-400 text-sm font-semibold">Offer Expired</Text>
                        <Text className="text-gray-300 text-xs mt-1">
                          This offer has expired and is no longer valid.
                        </Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        </View>
        {/* Bottom Padding for Navigation */}
        <View className="h-20" />
      </ScrollView>
      
      {/* Modals */}
      <SellerAcceptOfferModal
        visible={acceptModalVisible}
        onClose={() => {
          setAcceptModalVisible(false);
          setSelectedOffer(null);
        }}
        offer={selectedOffer}
        onConfirm={handleAcceptConfirm}
        isLoading={isAccepting}
      />
      
      <SellerRejectOfferModal
        visible={rejectModalVisible}
        onClose={() => {
          setRejectModalVisible(false);
          setSelectedOffer(null);
        }}
        offer={selectedOffer}
        onConfirm={handleRejectConfirm}
        isLoading={isRejecting}
      />
      
      <SellerCounterOfferModal
        visible={counterModalVisible}
        onClose={() => {
          setCounterModalVisible(false);
          setSelectedOffer(null);
        }}
        offer={selectedOffer}
        onConfirm={handleCounterConfirm}
        isLoading={isCountering}
      />
    </View>
  );
}