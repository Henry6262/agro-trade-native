import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { EmptyState, Button } from '../../components/common';
import { useNavigation } from '@react-navigation/native';

export default function OrdersScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <EmptyState
        title="No Orders Yet"
        description="Start shopping to see your orders here"
        actionLabel="Browse Products"
        onAction={() => navigation.navigate('Marketplace' as never)}
      />
    </SafeAreaView>
  );
}