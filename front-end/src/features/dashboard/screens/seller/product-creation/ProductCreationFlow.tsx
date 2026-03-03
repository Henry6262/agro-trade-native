import React, { useEffect, memo } from 'react';
import { ProductCreationFlowProps } from './types';
import { useProductCreation } from './hooks/useProductCreation';
import { ProductSelectionStep } from './components/ProductSelectionStep';
import { ProductSpecificationStep } from './components/ProductSpecificationStep';
import { LocationConfirmationStep } from './components/LocationConfirmationStep';

const ProductCreationFlowComponent: React.FC<ProductCreationFlowProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
}) => {
  const {
    currentStep,
    data,
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
    } else {
      // Reset flow when closing
      resetFlow();
    }
  }, [visible]); // Remove function dependencies to prevent re-renders

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

  // Only render the active step to prevent unnecessary renders
  if (!visible) return null;

  return (
    <>
      {/* Step 1: Product Selection */}
      {currentStep === 'product-selection' && (
        <ProductSelectionStep
          visible={true}
          onClose={handleClose}
          onNext={handleProductSelect}
          productMetadata={productMetadata as any}
        />
      )}

      {/* Step 2: Product Specifications */}
      {currentStep === 'specifications' && data.productData && (
        <ProductSpecificationStep
          visible={true}
          productData={data.productData}
          onClose={handleClose}
          onNext={handleSpecificationsSave}
          onBack={handleBack}
        />
      )}

      {/* Step 3: Location Confirmation */}
      {currentStep === 'location-confirmation' && (
        <LocationConfirmationStep
          visible={true}
          onClose={handleClose}
          onNext={handleLocationConfirm}
          onBack={handleBack}
          initialLocation={data.location || undefined}
        />
      )}
    </>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const ProductCreationFlow = memo(ProductCreationFlowComponent);
