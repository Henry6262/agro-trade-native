import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Button } from '../../../shared/components';

export default function ForgotPasswordScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Forgot Password
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          This feature will be implemented soon.
        </Text>
        <Button title="Go Back" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}