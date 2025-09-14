import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  FleetCreationState,
  FleetCreationStep,
  CreationType,
  TruckInfo,
  DriverInfo,
} from '../types';

const initialState: FleetCreationState = {
  currentStep: 'type-selection',
  creationType: null,
  truckData: {
    info: null,
  },
  driverData: {
    info: null,
  },
  isLoading: false,
  error: null,
};

export const useFleetCreation = () => {
  const [state, setState] = useState<FleetCreationState>(initialState);

  // Set creation type and move to info step
  const selectCreationType = useCallback((type: CreationType) => {
    if (!type) return;
    
    const infoStep: FleetCreationStep = type === 'truck' 
      ? 'truck-info' 
      : 'driver-info';
    
    setState(prev => ({
      ...prev,
      creationType: type,
      currentStep: infoStep,
      error: null,
    }));
  }, []);

  // Navigation - simplified for single step
  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'type-selection',
      creationType: null,
      error: null,
    }));
  }, []);

  // Truck data update - simplified
  const updateTruckInfo = useCallback((data: TruckInfo) => {
    setState(prev => ({
      ...prev,
      truckData: {
        info: data,
      },
    }));
  }, []);

  // Driver data update - simplified
  const updateDriverInfo = useCallback((data: DriverInfo) => {
    setState(prev => ({
      ...prev,
      driverData: {
        info: data,
      },
    }));
  }, []);

  // Submit functions
  const submitTruck = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Mock API call - replace with actual API
      console.log('Submitting truck:', state.truckData.info);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert('Success', 'Truck added to fleet!');
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to submit truck' 
      }));
      return false;
    }
  }, [state.truckData]);

  const submitDriver = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Mock API call - replace with actual API
      console.log('Submitting driver:', state.driverData.info);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert('Success', 'Driver added to fleet!');
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to add driver' 
      }));
      return false;
    }
  }, [state.driverData]);

  const submitFleetItem = useCallback(async () => {
    if (state.creationType === 'truck') {
      return submitTruck();
    } else {
      return submitDriver();
    }
  }, [state.creationType, submitTruck, submitDriver]);

  // Reset function
  const resetFlow = useCallback(() => {
    setState(initialState);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    currentStep: state.currentStep,
    creationType: state.creationType,
    truckData: state.truckData,
    driverData: state.driverData,
    isLoading: state.isLoading,
    error: state.error,
    
    // Navigation
    selectCreationType,
    goBack,
    
    // Data updates
    updateTruckInfo,
    updateDriverInfo,
    
    // Actions
    submitFleetItem,
    resetFlow,
    clearError,
  };
};