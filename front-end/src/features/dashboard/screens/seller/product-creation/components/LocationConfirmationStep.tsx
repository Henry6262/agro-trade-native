import React from 'react';
import { EnhancedLocationConfirmation } from '@shared/components/EnhancedLocationConfirmation';
import { LocationConfirmationStepProps } from '../types';

export const LocationConfirmationStep: React.FC<LocationConfirmationStepProps> = ({
  visible,
  onClose,
  onNext,
  initialLocation,
}) => {
  const handleLocationConfirm = (location: any) => {
    onNext(location);
  };

  return (
    <EnhancedLocationConfirmation
      visible={visible}
      onClose={onClose}
      onConfirm={handleLocationConfirm}
      initialLocation={initialLocation}
    />
  );
};
