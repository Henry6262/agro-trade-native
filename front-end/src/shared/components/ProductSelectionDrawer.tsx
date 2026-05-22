import React from 'react';
import { View, Text } from 'react-native';

interface ProductSelectionDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: string) => void;
}

export const ProductSelectionDrawer: React.FC<ProductSelectionDrawerProps> = () => {
  return (
    <View>
      <Text>Product Selection Drawer (stub)</Text>
    </View>
  );
};
