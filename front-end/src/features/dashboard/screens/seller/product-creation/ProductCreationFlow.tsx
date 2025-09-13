import React, { useEffect } from 'react';
import { ProductCreationFlowProps } from './types';
import { useProductCreation } from './hooks/useProductCreation';
import { ProductSelectionStep } from './components/ProductSelectionStep';
import { ProductSpecificationStep } from './components/ProductSpecificationStep';
import { LocationConfirmationStep } from './components/LocationConfirmationStep';

export const ProductCreationFlow: React.FC<ProductCreationFlowProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
}) => {
  const {
    currentStep,
    data,
    isLoading,
    error,
    productMetadata,
    goToNextStep,
    goToPreviousStep,
    updateProductData,
    updateSpecifications,
    updateLocation,
    submitProduct,
    resetFlow,
    ensureMetadataLoaded,
    clearError,
  } = useProductCreation();

  // Initialize metadata when flow opens
  useEffect(() => {
    if (visible) {
      ensureMetadataLoaded();
      clearError();
    }
  }, [visible, ensureMetadataLoaded, clearError]);

  // Reset flow when closing
  useEffect(() => {
    if (!visible) {
      resetFlow();
    }
  }, [visible, resetFlow]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle product selection
  const handleProductSelect = (productData: any) => {
    updateProductData(productData);
    goToNextStep();
  };

  // Handle specifications
  const handleSpecificationsSave = (specifications: any) => {
    updateSpecifications(specifications);
    goToNextStep();
  };

  // Handle location confirmation and submit
  const handleLocationConfirm = async (location: any) => {
    updateLocation(location);
    
    // Submit the product after location is confirmed
    const success = await submitProduct();
    if (success && onSuccess) {
      // Create a product object for the success callback
      const createdProduct = {
        ...data.productData,
        ...data.specifications,
        location,
        isVerified: false,
        views: 0,
        inquiries: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSuccess(createdProduct);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    goToPreviousStep();
  };

  // Handle close from any step
  const handleClose = () => {
    resetFlow();
    onClose();
  };

  return (
    <>
      {/* Step 1: Product Selection */}
      <ProductSelectionStep
        visible={visible && currentStep === 'product-selection'}
        onClose={handleClose}
        onNext={handleProductSelect}
        productMetadata={productMetadata}
      />

      {/* Step 2: Product Specifications */}
      {data.productData && (
        <ProductSpecificationStep
          visible={visible && currentStep === 'specifications'}
          productData={data.productData}
          onClose={handleClose}
          onNext={handleSpecificationsSave}
          onBack={handleBack}
        />
      )}

      {/* Step 3: Location Confirmation */}
      <LocationConfirmationStep
        visible={visible && currentStep === 'location-confirmation'}
        onClose={handleClose}
        onNext={handleLocationConfirm}
        onBack={handleBack}
        initialLocation={data.location || undefined}
      />
    </>
  );
};