import { useReducer, useCallback } from 'react';
import { Alert } from 'react-native';
import { useProductStore } from '@stores/product.store';
import { useOnboardingStore } from '@stores/onboarding.store';
import type {
  BuyerRequestCreationStep,
  ProductData,
  BuyerSpecifications,
  ProductSpecifications,
  LocationData,
  CreateBuyerRequestDto,
} from '../types';
import { buyerRequestCreationReducer, initialState, isStepComplete } from '../state';
import { buyerRequestCreationService } from '../service';
import { resolveProductImage } from '../utils';

export const useBuyerRequestCreation = () => {
  const [state, dispatch] = useReducer(buyerRequestCreationReducer, initialState);
  const productMetadata = useProductStore((store) => store.products) || [];
  const fetchProductMetadata = useProductStore((store) => store.fetchAllData);
  const onboardingStore = useOnboardingStore();

  const ensureMetadataLoaded = useCallback(async () => {
    if (!productMetadata.length) {
      try {
        await fetchProductMetadata();
      } catch (err) {
        console.error('Error fetching product metadata', err);
      }
    }
  }, [fetchProductMetadata, productMetadata.length]);

  const goToStep = useCallback((step: BuyerRequestCreationStep) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);
  const goToNextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);
  const goToPreviousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const updateProductData = useCallback(
    (productData: ProductData) => {
      dispatch({ type: 'SET_PRODUCT_DATA', payload: productData });
      onboardingStore.setSelectedProducts([productData.id]);
      onboardingStore.setSelectedProductsMetadata([productData]);
    },
    [onboardingStore]
  );

  const updateBuyerSpecifications = useCallback(
    (specifications: BuyerSpecifications) => {
      dispatch({ type: 'SET_BUYER_SPECS', payload: specifications });
      if (specifications.productId) {
        onboardingStore.updateBuyerSpecification(specifications.productId, specifications);
      }
    },
    [onboardingStore]
  );

  const updateProductSpecifications = useCallback((specs: ProductSpecifications) => {
    dispatch({ type: 'SET_PRODUCT_SPECS', payload: specs });
  }, []);

  const updateLocation = useCallback((location: LocationData) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
  }, []);

  const setError = useCallback((message: string) => {
    dispatch({ type: 'SET_ERROR', message });
    dispatch({ type: 'SET_LOADING', value: false });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', message: null });
  }, []);

  const setLoading = useCallback((value: boolean) => {
    dispatch({ type: 'SET_LOADING', value });
  }, []);

  const resetFlow = useCallback(() => {
    dispatch({ type: 'RESET' });
    onboardingStore.setSelectedProducts([]);
    onboardingStore.setSelectedProductsMetadata([]);
    Object.keys(onboardingStore.buyerSpecifications || {}).forEach((productId) => {
      onboardingStore.updateBuyerSpecification(productId, {});
    });
  }, [onboardingStore]);

  const validateData = useCallback(() => {
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

    if (!location || !location.address || !location.city || !location.country) {
      setError('Complete location information is required');
      return false;
    }

    return true;
  }, [state.data, setError]);

  const submitBuyerRequest = useCallback(async (): Promise<boolean> => {
    if (!validateData()) {
      return false;
    }

    const { productData, buyerSpecifications, productSpecifications, location } = state.data;

    const payload: CreateBuyerRequestDto = {
      productId: productData?.id ?? '',
      quantity: buyerSpecifications?.quantity ?? 0,
      unit: buyerSpecifications?.unit || 'ton',
      maxPricePerUnit: buyerSpecifications?.maxPricePerUnit,
      neededBy: buyerSpecifications?.neededBy,
      specifications: productSpecifications || {},
      deliveryAddress: {
        address: location?.address ?? '',
        city: location?.city ?? '',
        region: location?.region || '',
        country: location?.country ?? '',
        latitude: location?.latitude,
        longitude: location?.longitude,
      },
      notes: buyerSpecifications?.notes,
      status: 'active',
    };

    try {
      setLoading(true);
      clearError();
      await buyerRequestCreationService.submitRequest(payload);
      resetFlow();
      Alert.alert('Success', 'Buyer request created successfully!');
      return true;
    } catch (error) {
      console.error('Error creating buyer request', error);
      const message =
        (error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined) ||
        (error instanceof Error ? error.message : undefined) ||
        'Failed to create buyer request';
      setError(message);
      Alert.alert('Error', message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.data, validateData, clearError, resetFlow, setError, setLoading]);

  const getProductImage = useCallback(
    (productName: string, category: string) =>
      resolveProductImage(productMetadata, productName, category),
    [productMetadata]
  );

  const isStepCompleted = useCallback(
    (step: BuyerRequestCreationStep) => isStepComplete(state, step),
    [state]
  );
  const canProceedToNext = useCallback(() => isStepComplete(state, state.currentStep), [state]);
  return {
    currentStep: state.currentStep,
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    productMetadata,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    updateProductData,
    updateBuyerSpecifications,
    updateProductSpecifications,
    updateLocation,
    setError,
    clearError,
    submitBuyerRequest,
    resetFlow,
    ensureMetadataLoaded,
    getProductImage,
    isStepCompleted,
    canProceedToNext,
  };
};
