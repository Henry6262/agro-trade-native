import React from 'react';
import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Card, Button } from '../../components/common';
import { useAuth } from '../../hooks';

export default function ProfileScreen() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          <Card>
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Profile
            </Text>
            <Text className="text-gray-600 mb-2">
              Name: {user?.name || 'Not available'}
            </Text>
            <Text className="text-gray-600 mb-2">
              Email: {user?.email || 'Not available'}
            </Text>
            <Text className="text-gray-600">
              Role: {user?.role || 'Not available'}
            </Text>
          </Card>

          <Card>
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Settings
            </Text>
            <Text className="text-gray-600">
              Profile settings will be available here.
            </Text>
          </Card>

          <Button
            title="Logout"
            variant="danger"
            fullWidth
            onPress={handleLogout}
            loading={logoutMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}