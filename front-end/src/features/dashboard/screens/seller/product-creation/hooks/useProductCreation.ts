import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '@services/api';
import { useUserData } from '@contexts/UserDataContext';
import { useProductStore } from '@stores/product.store';
import {
  ProductCreationState,
  ProductCreationStep,
  ProductData,
  ProductSpecifications,
  LocationData,
  CreateListingDto,
} from '../types';

const initialState: ProductCreationState = {
  currentStep: 'product-selection',
  data: {
    productData: null,
    specifications: null,
    location: null,
  },
  isLoading: false,
  error: null,
};

export const useProductCreation = () => {
  const [state, setState] = useState<ProductCreationState>(initialState);
  const { refreshProducts } = useUserData();
  const productMetadata = useProductStore((state) => state.products) || [];
  const fetchProductMetadata = useProductStore((state) => state.fetchAllData);

  // Ensure product metadata is loaded
  const ensureMetadataLoaded = useCallback(async () => {
    if (productMetadata.length === 0) {
      try {
        await fetchProductMetadata();
      } catch (error) {
        console.error('Error fetching product metadata:', error);
      }
    }
  }, [fetchProductMetadata]); // Remove productMetadata.length from dependencies

  // Step navigation
  const goToStep = useCallback((step: ProductCreationStep) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
      error: null,
    }));
  }, []);

  const goToNextStep = useCallback(() => {
    setState((prev) => {
      const stepOrder: ProductCreationStep[] = [
        'product-selection',
        'specifications',
        'location-confirmation',
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
    setState((prev) => {
      const stepOrder: ProductCreationStep[] = [
        'product-selection',
        'specifications',
        'location-confirmation',
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
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        productData,
      },
      error: null,
    }));
  }, []);

  const updateSpecifications = useCallback((specifications: ProductSpecifications) => {
    setState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        specifications,
      },
      error: null,
    }));
  }, []);

  const updateLocation = useCallback((location: LocationData) => {
    setState((prev) => ({
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
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading,
    }));
  }, []);

  // Reset flow
  const resetFlow = useCallback(() => {
    setState(initialState);
  }, []);

  // Validate data for submission
  const validateData = useCallback((): boolean => {
    const { productData, specifications, location } = state.data;

    if (!productData) {
      setError('Product selection is required');
      return false;
    }

    if (!specifications) {
      setError('Product specifications are required');
      return false;
    }

    if (!specifications.quantity || specifications.quantity <= 0) {
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

  // Submit product creation
  const submitProduct = useCallback(async (): Promise<boolean> => {
    if (!validateData()) {
      return false;
    }

    const { productData, specifications, location } = state.data;

    try {
      setLoading(true);
      clearError();

      // Prepare the data for backend
      const createListingDto: CreateListingDto = {
        productId: productData!.id,
        quantity: specifications!.quantity,
        unit: specifications!.unit || 'ton',
        specifications: specifications!.specifications || {},
        location: {
          address: location!.address,
          city: location!.city,
          region: location!.region || location!.region,
          country: location!.country,
          latitude: location!.latitude,
          longitude: location!.longitude,
        },
        status: 'active',
        offerType: 'listing' as any, // Changed from 'STANDARD' to match backend enum
      };

      // Send to backend
      const response = await apiClient.post('/seller/listings', createListingDto);

      if (response?.data?.success) {
        // Refresh the products list
        await refreshProducts();

        // Reset the flow
        resetFlow();

        Alert.alert('Success', 'Product listing created successfully!');
        return true;
      } else {
        throw new Error(response?.data?.message || 'Failed to create product listing');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to create product listing';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateData, state.data, setLoading, clearError, setError, refreshProducts, resetFlow]);

  // Get product image from metadata
  const getProductImage = useCallback(
    (productName: string, category: string): string => {
      // Try to find product in metadata
      const metaProduct = productMetadata?.find?.(
        (p) => p.name === productName || p.displayName === productName || p.category === category
      );

      if (metaProduct?.image) {
        return metaProduct.image;
      }

      // Fallback image based on category
      const categoryImages: Record<string, string> = {
        SOFT_WHEAT: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
        HARD_WHEAT: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400',
        CORN: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400',
        SOYBEANS: 'https://images.unsplash.com/photo-1639843906836-85fc9fa11584?w=400',
        RICE: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      };

      return (
        categoryImages[category] || 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Product'
      );
    },
    [productMetadata]
  );

  // Check if step is completed
  const isStepCompleted = useCallback(
    (step: ProductCreationStep): boolean => {
      switch (step) {
        case 'product-selection':
          return !!state.data.productData;
        case 'specifications':
          return !!state.data.specifications;
        case 'location-confirmation':
          return !!state.data.location;
        default:
          return false;
      }
    },
    [state.data]
  );

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
    updateSpecifications,
    updateLocation,

    // Error handling
    setError,
    clearError,

    // Actions
    submitProduct,
    resetFlow,
    ensureMetadataLoaded,

    // Utilities
    getProductImage,
    isStepCompleted,
    canProceedToNext,
  };
};
