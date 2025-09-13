import React, { useEffect, memo } from 'react';
import { BuyerRequestCreationFlowProps } from './types';
import { useBuyerRequestCreation } from './hooks/useBuyerRequestCreation';

// Import existing drawer components
import { ProductSelectionDrawer } from '../../../../../shared/components/ProductSelectionDrawer';
import { BuyerSpecificationsDrawer } from '../../../../../shared/components/BuyerSpecificationsDrawer';
import { ProductSpecificationsDrawer } from '../../../../../shared/components/ProductSpecificationsDrawer';
import { LocationConfirmationDrawer } from '../../../../../shared/components/LocationConfirmationDrawer';
import { BuyerSubmitDrawer } from '../../../../onboarding/components/buyer/BuyerSubmitDrawer';

const BuyerRequestCreationFlowComponent: React.FC<BuyerRequestCreationFlowProps> = ({
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
    updateBuyerSpecifications,
    updateProductSpecifications,
    updateLocation,
    submitBuyerRequest,
    resetFlow,
    ensureMetadataLoaded,
    clearError,
  } = useBuyerRequestCreation();

  // Initialize metadata when flow opens
  useEffect(() => {
    if (visible) {
      ensureMetadataLoaded();
      clearError();
    } else {
      // Reset flow when closing
      resetFlow();
    }
  }, [visible]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle product selection
  const handleProductSelect = (productId: string, productData: any) => {
    console.log('Product selected:', productId, productData);
    updateProductData(productData);
    goToNextStep();
  };

  // Handle quantity and price specifications
  const handleQuantityPriceSave = (specs: any) => {
    console.log('Quantity and price saved:', specs);
    
    if (specs && specs.length > 0) {
      const spec = specs[0];
      // Convert from drawer format to hook format
      const buyerSpec = {
        productId: spec.productId,
        productName: data.productData?.name || '',
        quantity: parseFloat(spec.quantity) || 0,
        unit: spec.unit || 'tons',
        maxPricePerUnit: parseFloat(spec.pricePerKilo) || undefined,
        neededBy: spec.deliveryDeadline || undefined,
        notes: spec.notes || undefined,
      };
      updateBuyerSpecifications(buyerSpec);
    }
    
    goToNextStep();
  };

  // Handle product specifications
  const handleProductSpecsSave = (specs: any) => {
    console.log('Product specifications saved:', specs);
    updateProductSpecifications(specs);
    goToNextStep();
  };

  // Handle location confirmation
  const handleLocationConfirm = (location: any) => {
    console.log('Location confirmed:', location);
    updateLocation(location);
    goToNextStep();
  };

  // Handle final submit
  const handleFinalSubmit = async () => {
    const success = await submitBuyerRequest();
    if (success && onSuccess) {
      // Create a request object for the success callback
      const createdRequest = {
        ...data.productData,
        ...data.buyerSpecifications,
        specifications: data.productSpecifications,
        location: data.location,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSuccess(createdRequest);
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

  // Only render when visible
  if (!visible) return null;

  return (
    <>
      {/* Step 1: Product Selection */}
      {currentStep === 'product-selection' && (
        <ProductSelectionDrawer
          visible={true}
          onClose={handleClose}
          onProductSelect={handleProductSelect}
          selectedProducts={[]}
          mode="single"
        />
      )}

      {/* Step 2: Quantity & Price */}
      {currentStep === 'quantity-price' && data.productData && (
        <BuyerSpecificationsDrawer
          visible={true}
          onClose={handleClose}
          onSave={handleQuantityPriceSave}
          productId={data.productData.id}
          productName={data.productData.name}
          onBack={handleBack}
        />
      )}

      {/* Step 3: Product Specifications */}
      {currentStep === 'product-specifications' && data.productData && data.buyerSpecifications && (
        <ProductSpecificationsDrawer
          visible={true}
          onClose={handleClose}
          onBack={handleBack}
          onNext={handleProductSpecsSave}
          productId={data.productData.id}
          productName={data.productData.name}
          existingSpecs={data.productSpecifications || {}}
        />
      )}

      {/* Step 4: Location Confirmation */}
      {currentStep === 'location-confirmation' && (
        <LocationConfirmationDrawer
          visible={true}
          onClose={handleClose}
          onConfirm={handleLocationConfirm}
          initialLocation={data.location || undefined}
        />
      )}

      {/* Step 5: Submit */}
      {currentStep === 'submit' && data.productData && data.buyerSpecifications && (
        <BuyerSubmitDrawer
          visible={true}
          onClose={handleClose}
          productId={data.productData.id}
          specifications={{
            ...data.buyerSpecifications,
            ...data.productSpecifications,
            location: data.location,
          }}
          onComplete={handleFinalSubmit}
          onBack={handleBack}
        />
      )}
    </>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const BuyerRequestCreationFlow = memo(BuyerRequestCreationFlowComponent);