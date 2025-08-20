import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/common';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-bold text-gray-900 mb-2">
          AgroTrade
        </Text>
        <Text className="text-lg text-gray-600 text-center mb-8">
          Connect farmers with buyers for fresh agricultural products
        </Text>
        
        <View className="w-full space-y-4">
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('Onboarding' as never)}
            fullWidth
          />
          <Button
            title="Login"
            variant="outline"
            onPress={() => navigation.navigate('Login' as never)}
            fullWidth
          />
          <Button
            title="Sign Up"
            variant="outline"
            onPress={() => navigation.navigate('Register' as never)}
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}