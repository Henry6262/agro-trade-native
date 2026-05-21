// Fleet Creation Types

export type CreationType = 'truck' | 'driver' | null;

export type FleetCreationStep = 'type-selection' | 'truck-info' | 'driver-info';

// Truck Related Types - Simplified
export interface TruckInfo {
  licensePlate: string;
  trailerRegistrationNumber?: string;
  model?: string;
  year?: string;
  vehicleType: 'flatbed' | 'refrigerated' | 'tanker' | 'box' | 'other';
}

export interface TruckData {
  info: TruckInfo | null;
}

// Driver Related Types - Simplified
export interface DriverInfo {
  fullName: string;
  egn?: string; // Bulgarian National ID Number
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
}

export interface DriverData {
  info: DriverInfo | null;
}

// Main State Interface
export interface FleetCreationState {
  currentStep: FleetCreationStep;
  creationType: CreationType;
  truckData: TruckData;
  driverData: DriverData;
  isLoading: boolean;
  error: string | null;
}

// Component Props
export interface FleetCreationFlowProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface StepComponentProps {
  visible: boolean;
  onClose: () => void;
  onNext: (data: any) => void;
  onBack?: () => void;
  data?: any;
}
