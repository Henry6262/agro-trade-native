import React from 'react';
import { View, Text } from 'react-native';

interface ProductSelectionDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect?: (product: string) => void;
  onProductSelect?: (productId: string, productData: unknown) => void;
  mode?: string;
}

export const ProductSelectionDrawer: React.FC<ProductSelectionDrawerProps> = () => {
  return (
    <View>
      <Text>Product Selection Drawer (stub)</Text>
    </View>
  );
};
