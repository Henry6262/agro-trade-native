import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  FleetCreationState,
  FleetCreationStep,
  CreationType,
  TruckInfo,
  DriverInfo,
} from '../types';
import {
  useCreateTruck,
  useCreateDriver,
} from '../../../../../../pages/Dashboard/sections/Transporter/features/Fleet/hooks';

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

  const createTruckMutation = useCreateTruck();
  const createDriverMutation = useCreateDriver();

  // Set creation type and move to info step
  const selectCreationType = useCallback((type: CreationType) => {
    if (!type) return;

    const infoStep: FleetCreationStep = type === 'truck' ? 'truck-info' : 'driver-info';

    setState((prev) => ({
      ...prev,
      creationType: type,
      currentStep: infoStep,
      error: null,
    }));
  }, []);

  // Navigation - simplified for single step
  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: 'type-selection',
      creationType: null,
      error: null,
    }));
  }, []);

  // Truck data update - simplified
  const updateTruckInfo = useCallback((data: TruckInfo) => {
    setState((prev) => ({
      ...prev,
      truckData: {
        info: data,
      },
    }));
  }, []);

  // Driver data update - simplified
  const updateDriverInfo = useCallback((data: DriverInfo) => {
    setState((prev) => ({
      ...prev,
      driverData: {
        info: data,
      },
    }));
  }, []);

  // Submit functions
  const submitTruck = useCallback(async () => {
    if (!state.truckData.info) {
      setState((prev) => ({ ...prev, error: 'No truck data to submit' }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Transform frontend data to backend API format
      const backendData = {
        licensePlate: state.truckData.info.licensePlate,
        model: state.truckData.info.trailerRegistrationNumber, // Using trailer reg as model
        capacityTons: 10, // Default capacity - could be added to form later
        vehicleType: state.truckData.info.vehicleType.toUpperCase(),
      };

      await createTruckMutation.mutateAsync(backendData);
      setState((prev) => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to submit truck',
      }));
      return false;
    }
  }, [state.truckData, createTruckMutation]);

  const submitDriver = useCallback(async () => {
    if (!state.driverData.info) {
      setState((prev) => ({ ...prev, error: 'No driver data to submit' }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Transform frontend data to backend API format
      const nameParts = state.driverData.info.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const backendData = {
        firstName,
        lastName,
        licenseNumber: state.driverData.info.egn, // Using EGN as license number
        phone: state.driverData.info.phoneNumber,
        experienceYears: 5, // Default - could be added to form later
      };

      await createDriverMutation.mutateAsync(backendData);
      setState((prev) => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to add driver',
      }));
      return false;
    }
  }, [state.driverData, createDriverMutation]);

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
    setState((prev) => ({ ...prev, error: null }));
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
