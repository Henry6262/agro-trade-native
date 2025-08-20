import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Input, EmptyState } from '../../components/common';

export default function SearchScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4">
        <Input
          placeholder="Search for products..."
          variant="outline"
        />
      </View>
      
      <EmptyState
        title="Start Searching"
        description="Enter keywords to find fresh agricultural products"
        actionLabel="Browse Categories"
        onAction={() => {}}
      />
    </SafeAreaView>
  );
}