import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Send, X } from 'lucide-react-native';

import type { SellerOfferView } from '@shared/types/seller-offers';

interface SellerOffersFooterProps {
  currentView: SellerOfferView;
  actionLoading: boolean;
  rejectReason: string;
  onBack: () => void;
  onSubmitNegotiation: () => void;
  onSubmitAccept: () => void;
  onSubmitReject: () => void;
}

export function SellerOffersFooter({
  currentView,
  actionLoading,
  rejectReason,
  onBack,
  onSubmitNegotiation,
  onSubmitAccept,
  onSubmitReject,
}: SellerOffersFooterProps) {
  if (currentView === 'list') {
    return null;
  }

  const renderButtons = () => {
    switch (currentView) {
      case 'negotiate':
        return (
          <>
            <TouchableOpacity
              onPress={onBack}
              className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-gray-200/50"
            >
              <Text className="text-gray-900 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSubmitNegotiation}
              disabled={actionLoading}
              className="flex-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl py-4 items-center justify-center flex-row"
            >
              <Send size={18} color="#FFFFFF" />
              <Text className="text-gray-900 font-bold ml-2">
                {actionLoading ? 'Sending...' : 'Send Counter-Offer'}
              </Text>
            </TouchableOpacity>
          </>
        );
      case 'accept':
        return (
          <>
            <TouchableOpacity
              onPress={onBack}
              className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-gray-200/50"
            >
              <Text className="text-gray-900 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSubmitAccept}
              disabled={actionLoading}
              className="flex-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl py-4 items-center justify-center flex-row"
            >
              <Check size={18} color="#FFFFFF" />
              <Text className="text-gray-900 font-bold ml-2">
                {actionLoading ? 'Processing...' : 'Confirm Accept'}
              </Text>
            </TouchableOpacity>
          </>
        );
      case 'reject':
        return (
          <>
            <TouchableOpacity
              onPress={onBack}
              className="flex-1 bg-gradient-to-br from-neutral-700/80 to-neutral-800/60 rounded-xl py-4 items-center justify-center border border-gray-200/50"
            >
              <Text className="text-gray-900 font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSubmitReject}
              disabled={actionLoading || !rejectReason}
              className="flex-2 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl py-4 items-center justify-center flex-row"
            >
              <X size={18} color="#FFFFFF" />
              <Text className="text-gray-900 font-bold ml-2">
                {actionLoading ? 'Processing...' : 'Confirm Reject'}
              </Text>
            </TouchableOpacity>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View className="p-6 border-t border-gray-200/50 bg-gradient-to-b from-neutral-900/80 to-black">
      <View className="flex-row gap-4">{renderButtons()}</View>
    </View>
  );
}
