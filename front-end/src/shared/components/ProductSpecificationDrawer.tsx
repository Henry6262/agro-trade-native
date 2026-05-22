import React from 'react';
import { View, Text } from 'react-native';

interface ProductSpecificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (specs: Record<string, unknown>) => void;
}

export const ProductSpecificationDrawer: React.FC<ProductSpecificationDrawerProps> = () => {
  return (
    <View>
      <Text>Product Specification Drawer (stub)</Text>
    </View>
  );
};
