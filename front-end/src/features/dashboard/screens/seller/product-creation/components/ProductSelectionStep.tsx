import React from 'react';
import { ProductSelectionDrawer } from '@shared/components/ProductSelectionDrawer';
import { ProductSelectionStepProps, ProductData } from '../types';

export const ProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  visible,
  onClose,
  onNext,
}) => {
  const handleProductSelect = (productId: string, productData: any) => {
    // Transform the selected product data to match our ProductData interface
    const selectedProductData: ProductData = {
      id: productId,
      name: productData.name || productData.displayName || 'Unknown Product',
      displayName: productData.displayName,
      category: productData.category || productId,
      defaultUnit: productData.defaultUnit || 'ton',
      priceRangeMin: productData.priceRangeMin,
      priceRangeMax: productData.priceRangeMax,
      image: productData.image,
      description: productData.description,
    };

    onNext(selectedProductData);
  };

  return (
    <ProductSelectionDrawer
      visible={visible}
      onClose={onClose}
      onProductSelect={handleProductSelect}
      mode="single"
    />
  );
};
