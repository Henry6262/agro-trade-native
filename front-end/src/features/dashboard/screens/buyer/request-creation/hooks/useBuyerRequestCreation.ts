import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../../../../../../services/api';
import { useProductStore } from '../../../../../../stores/product.store';
import { useOnboardingStore } from '../../../../../../stores/onboarding.store';
import {
  BuyerRequestCreationState,
  BuyerRequestCreationStep,
  ProductData,
  BuyerSpecifications,
  ProductSpecifications,
  LocationData,
  CreateBuyerRequestDto,
} from '../types';

const initialState: BuyerRequestCreationState = {
  currentStep: 'product-selection',
  data: {
    productData: null,
    buyerSpecifications: null,
    productSpecifications: null,
    location: null,
  },
  isLoading: false,
  error: null,
};

export const useBuyerRequestCreation = () => {
  const [state, setState] = useState<BuyerRequestCreationState>(initialState);
  const productMetadata = useProductStore((state) => state.products) || [];
  const fetchProductMetadata = useProductStore((state) => state.fetchAllData);
  const onboardingStore = useOnboardingStore();

  // Ensure product metadata is loaded
  const ensureMetadataLoaded = useCallback(async () => {
    if (productMetadata.length === 0) {
      try {
        await fetchProductMetadata();
      } catch (error) {
        console.error('Error fetching product metadata:', error);
      }
    }
  }, [fetchProductMetadata]);

  // Step navigation
  const goToStep = useCallback((step: BuyerRequestCreationStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      error: null,
    }));
  }, []);

  const goToNextStep = useCallback(() => {
    setState(prev => {
      const stepOrder: BuyerRequestCreationStep[] = [
        'product-selection', 
        'quantity-price', 
        'product-specifications', 
        'location-confirmation',
        'submit'
      ];
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      const nextStep = stepOrder[currentIndex + 1];
      
      return {
        ...prev,
        currentStep: nextStep || prev.currentStep,
        error: null,
      };
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState(prev => {
      const stepOrder: BuyerRequestCreationStep[] = [
        'product-selection', 
        'quantity-price', 
        'product-specifications', 
        'location-confirmation',
        'submit'
      ];
      const currentIndex = stepOrder.indexOf(prev.currentStep);
      const previousStep = stepOrder[currentIndex - 1];
      
      return {
        ...prev,
        currentStep: previousStep || prev.currentStep,
        error: null,
      };
    });
  }, []);

  // Data updates
  const updateProductData = useCallback((productData: ProductData) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        productData,
      },
      error: null,
    }));

    // Update onboarding store for compatibility
    onboardingStore.setSelectedProducts([productData.id]);
    onboardingStore.setSelectedProductsMetadata([productData]);
  }, [onboardingStore]);

  const updateBuyerSpecifications = useCallback((specifications: BuyerSpecifications) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        buyerSpecifications: specifications,
      },
      error: null,
    }));

    // Update onboarding store for compatibility
    if (specifications.productId) {
      onboardingStore.updateBuyerSpecification(specifications.productId, specifications);
    }
  }, [onboardingStore]);

  const updateProductSpecifications = useCallback((specifications: ProductSpecifications) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        productSpecifications: specifications,
      },
      error: null,
    }));
  }, []);

  const updateLocation = useCallback((location: LocationData) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        location,
      },
      error: null,
    }));
  }, []);

  // Error handling
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading,
    }));
  }, []);

  // Reset flow
  const resetFlow = useCallback(() => {
    setState(initialState);
    // Reset onboarding store data as well
    onboardingStore.setSelectedProducts([]);
    onboardingStore.setSelectedProductsMetadata([]);
    // Clear buyer specifications
    Object.keys(onboardingStore.buyerSpecifications || {}).forEach(productId => {
      onboardingStore.updateBuyerSpecification(productId, {});
    });
  }, [onboardingStore]);

  // Validate data for submission
  const validateData = useCallback((): boolean => {
    const { productData, buyerSpecifications, location } = state.data;

    if (!productData) {
      setError('Product selection is required');
      return false;
    }

    if (!buyerSpecifications) {
      setError('Buyer specifications are required');
      return false;
    }

    if (!buyerSpecifications.quantity || buyerSpecifications.quantity <= 0) {
      setError('Valid quantity is required');
      return false;
    }

    if (!location) {
      setError('Location information is required');
      return false;
    }

    if (!location.address || !location.city || !location.country) {
      setError('Complete location information is required');
      return false;
    }

    return true;
  }, [state.data, setError]);

  // Submit buyer request creation
  const submitBuyerRequest = useCallback(async (): Promise<boolean> => {
    if (!validateData()) {
      return false;
    }

    const { productData, buyerSpecifications, productSpecifications, location } = state.data;

    try {
      setLoading(true);
      clearError();

      // Merge buyer specifications with product specifications
      const mergedSpecifications = {
        ...buyerSpecifications,
        ...productSpecifications,
      };

      // Prepare the data for backend
      const createRequestDto: CreateBuyerRequestDto = {
        productId: productData!.id,
        quantity: buyerSpecifications!.quantity,
        unit: buyerSpecifications!.unit || 'ton',
        maxPricePerUnit: buyerSpecifications!.maxPricePerUnit,
        neededBy: buyerSpecifications!.neededBy,
        specifications: productSpecifications || {},
        deliveryAddress: {
          address: location!.address,
          city: location!.city,
          region: location!.region || '',
          country: location!.country,
          latitude: location!.latitude,
          longitude: location!.longitude,
        },
        notes: buyerSpecifications!.notes,
        status: 'active',
      };

      // Send to backend
      const response = await apiClient.post('/buyer/listings', createRequestDto);

      if (response?.data?.success || response?.data) {
        // Reset the flow
        resetFlow();
        
        Alert.alert('Success', 'Buyer request created successfully!');
        return true;
      } else {
        throw new Error(response?.data?.message || 'Failed to create buyer request');
      }
    } catch (error: any) {
      console.error('Error creating buyer request:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create buyer request';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateData, state.data, setLoading, clearError, setError, resetFlow]);

  // Get product image from metadata
  const getProductImage = useCallback((productName: string, category: string): string => {
    // Try to find product in metadata
    const metaProduct = productMetadata?.find?.(
      p => p.name === productName || p.displayName === productName || p.category === category
    );
    
    if (metaProduct?.image) {
      return metaProduct.image;
    }
    
    // Fallback image based on category
    const categoryImages: Record<string, string> = {
      'SOFT_WHEAT': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
      'HARD_WHEAT': 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400',
      'CORN': 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400',
      'SOYBEANS': 'https://images.unsplash.com/photo-1639843906836-85fc9fa11584?w=400',
      'RICE': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    };
    
    return categoryImages[category] || 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Product';
  }, [productMetadata]);

  // Check if step is completed
  const isStepCompleted = useCallback((step: BuyerRequestCreationStep): boolean => {
    switch (step) {
      case 'product-selection':
        return !!state.data.productData;
      case 'quantity-price':
        return !!state.data.buyerSpecifications;
      case 'product-specifications':
        return !!state.data.productSpecifications;
      case 'location-confirmation':
        return !!state.data.location;
      case 'submit':
        return true; // Submit step doesn't need to be "completed"
      default:
        return false;
    }
  }, [state.data]);

  // Check if can proceed to next step
  const canProceedToNext = useCallback((): boolean => {
    return isStepCompleted(state.currentStep);
  }, [state.currentStep, isStepCompleted]);

  return {
    // State
    currentStep: state.currentStep,
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    productMetadata,

    // Navigation
    goToStep,
    goToNextStep,
    goToPreviousStep,

    // Data updates
    updateProductData,
    updateBuyerSpecifications,
    updateProductSpecifications,
    updateLocation,

    // Error handling
    setError,
    clearError,

    // Actions
    submitBuyerRequest,
    resetFlow,
    ensureMetadataLoaded,

    // Utilities
    getProductImage,
    isStepCompleted,
    canProceedToNext,
  };
};