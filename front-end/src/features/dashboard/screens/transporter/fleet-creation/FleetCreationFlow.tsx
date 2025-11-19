import React, { useEffect } from 'react';
import { FleetCreationFlowProps } from './types';
import { useFleetCreation } from './hooks/useFleetCreation';
import { CreationTypeSelector } from './components/shared/CreationTypeSelector';
import { TruckInfoStep } from './components/truck/TruckInfoStep';
import { DriverInfoStep } from './components/driver/DriverInfoStep';

export const FleetCreationFlow: React.FC<FleetCreationFlowProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
}) => {
  const {
    currentStep,
    creationType,
    truckData,
    driverData,
    isLoading,
    error,
    selectCreationType,
    goBack,
    updateTruckInfo,
    updateDriverInfo,
    submitFleetItem,
    resetFlow,
    clearError,
  } = useFleetCreation();

  // Reset flow when closing
  useEffect(() => {
    if (!visible) {
      // Small delay to ensure smooth closing animation
      setTimeout(() => {
        resetFlow();
      }, 300);
    } else {
      clearError();
    }
  }, [visible, resetFlow, clearError]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle close
  const handleClose = () => {
    resetFlow();
    onClose();
  };

  // Handle type selection
  const handleTypeSelect = (type: 'truck' | 'driver') => {
    selectCreationType(type);
  };

  // Handle truck info submission
  const handleTruckInfo = async (data: any) => {
    updateTruckInfo(data);
    const success = await submitFleetItem();
    if (success) {
      if (onSuccess) {
        onSuccess(data);
      }
      handleClose();
    }
  };

  // Handle driver info submission
  const handleDriverInfo = async (data: any) => {
    updateDriverInfo(data);
    const success = await submitFleetItem();
    if (success) {
      if (onSuccess) {
        onSuccess(data);
      }
      handleClose();
    }
  };

  // Only render if visible
  if (!visible) return null;

  return (
    <>
      {/* Type Selection */}
      {currentStep === 'type-selection' && (
        <CreationTypeSelector
          visible={true}
          onClose={handleClose}
          onSelectType={handleTypeSelect}
        />
      )}

      {/* Truck Flow - Single Step */}
      {currentStep === 'truck-info' && (
        <TruckInfoStep
          visible={true}
          onClose={handleClose}
          onSubmit={handleTruckInfo}
          onBack={goBack}
          initialData={truckData.info}
        />
      )}

      {/* Driver Flow - Single Step */}
      {currentStep === 'driver-info' && (
        <DriverInfoStep
          visible={true}
          onClose={handleClose}
          onSubmit={handleDriverInfo}
          onBack={goBack}
          initialData={driverData.info}
        />
      )}
    </>
  );
};
