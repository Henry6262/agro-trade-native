import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, ArrowLeft } from 'lucide-react-native';

import type { SellerOfferView } from '@shared/types/seller-offers';

interface SellerOffersHeaderProps {
  currentView: SellerOfferView;
  offerCount: number;
  productName: string;
  onClose: () => void;
  onBack: () => void;
}

export function SellerOffersHeader({
  currentView,
  offerCount,
  productName,
  onClose,
  onBack,
}: SellerOffersHeaderProps) {
  const getTitle = () => {
    switch (currentView) {
      case 'negotiate':
        return 'Counter Offer';
      case 'accept':
        return 'Accept Offer';
      case 'reject':
        return 'Reject Offer';
      default:
        return `${productName} Offers`;
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'negotiate':
        return 'Negotiate terms with buyer';
      case 'accept':
        return 'Confirm your acceptance';
      case 'reject':
        return 'Provide rejection reason';
      default:
        return `${offerCount} offer${offerCount !== 1 ? 's' : ''} received`;
    }
  };

  return (
    <View className="flex-row justify-between items-center p-6 border-b border-gray-200/50">
      <TouchableOpacity
        onPress={currentView === 'list' ? onClose : onBack}
        className="p-2 -m-2 bg-gray-50/50 rounded-lg border border-gray-200/50"
      >
        {currentView === 'list' ? (
          <X color="#9CA3AF" size={20} />
        ) : (
          <ArrowLeft color="#9CA3AF" size={20} />
        )}
      </TouchableOpacity>
      <View className="items-center flex-1 mx-4">
        <Text className="text-xl font-bold text-gray-900">{getTitle()}</Text>
        <Text className="text-sm text-gray-500 mt-1">{getSubtitle()}</Text>
      </View>
      <View style={{ width: 36 }} />
    </View>
  );
}
