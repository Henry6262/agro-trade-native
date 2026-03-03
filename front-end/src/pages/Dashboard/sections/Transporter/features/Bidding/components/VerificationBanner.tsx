import React from 'react';
import { View, Text, Alert } from 'react-native';
import { Shield, Zap } from 'lucide-react-native';
import { Button } from '@shared/components/Button';

interface TransporterVerificationBannerProps {
  isVerified: boolean;
}

export const TransporterVerificationBanner: React.FC<TransporterVerificationBannerProps> = ({
  isVerified,
}) => {
  if (isVerified) {
    return null;
  }

  return (
    <View className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <Shield size={32} color="#FCD34D" />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-yellow-400">Verification Required</Text>
            <Text className="text-sm text-gray-600">
              Complete verification to unlock premium bidding features
            </Text>
          </View>
        </View>
        <Button
          onPress={() => Alert.alert('Verification', 'Verification flow coming soon.')}
          variant="gradient"
          className="bg-gradient-to-r from-yellow-600 to-yellow-700"
        >
          <View className="flex-row items-center">
            <Zap size={16} color="#000000" />
            <Text className="ml-2 text-black font-semibold">VERIFY NOW</Text>
          </View>
        </Button>
      </View>
    </View>
  );
};
