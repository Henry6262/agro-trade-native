import React from 'react';
import { ProductSpecificationDrawer } from '@shared/components/ProductSpecificationDrawer';
import { ProductSpecificationStepProps, ProductSpecifications } from '../types';

export const ProductSpecificationStep: React.FC<ProductSpecificationStepProps> = ({
  visible,
  productData,
  onClose,
  onNext,
  onBack,
}) => {
  const handleSpecificationsSave = (specs: any) => {
    // Transform the specs data to match our ProductSpecifications interface
    const specifications: ProductSpecifications = {
      quantity: specs.quantity || 0,
      unit: specs.unit || productData.defaultUnit || 'ton',
      specifications: specs.specifications || {},
      productId: productData.id,
      productName: productData.name,
      pricePerUnit: specs.pricePerUnit,
      totalPrice: specs.totalPrice,
    };

    onNext(specifications);
  };

  const handleSkip = () => {
    // Create basic specifications if user skips
    const basicSpecifications: ProductSpecifications = {
      quantity: 0,
      unit: productData.defaultUnit || 'ton',
      specifications: {},
      productId: productData.id,
      productName: productData.name,
    };

    onNext(basicSpecifications);
  };

  return (
    <ProductSpecificationDrawer
      visible={visible}
      productData={productData}
      onClose={onClose}
      onSave={handleSpecificationsSave}
      onSkip={handleSkip}
    />
  );
};
