import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { transportService } from '@services/transportService';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError?.response?.data?.message || fallback;
};

// ==================== TRUCK MUTATIONS ====================

export const useCreateTruck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      licensePlate: string;
      model: string;
      capacityTons: number;
      location?: { lat: number; lng: number; address?: string };
      vehicleType?: string;
    }) => transportService.createTruck(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Truck added to fleet successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to create truck'));
    },
  });
};

export const useUpdateTruck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      truckId,
      data,
    }: {
      truckId: string;
      data: {
        licensePlate?: string;
        model?: string;
        capacityTons?: number;
        location?: { lat: number; lng: number; address?: string };
        vehicleType?: string;
        status?: 'available' | 'assigned' | 'maintenance';
      };
    }) => transportService.updateTruck(truckId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Truck updated successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to update truck'));
    },
  });
};

export const useDeleteTruck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (truckId: string) => transportService.deleteTruck(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Truck deleted successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to delete truck'));
    },
  });
};

// ==================== DRIVER MUTATIONS ====================

export const useCreateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      licenseNumber: string;
      phone: string;
      experienceYears?: number;
      email?: string;
      licenseClasses?: string[];
    }) => transportService.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Driver added to fleet successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to create driver'));
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      driverId,
      data,
    }: {
      driverId: string;
      data: {
        firstName?: string;
        lastName?: string;
        licenseNumber?: string;
        phone?: string;
        experienceYears?: number;
        email?: string;
        licenseClasses?: string[];
        status?: 'available' | 'assigned' | 'offline' | 'on_break';
      };
    }) => transportService.updateDriver(driverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Driver updated successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to update driver'));
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (driverId: string) => transportService.deleteDriver(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Driver deleted successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to delete driver'));
    },
  });
};

// ==================== ASSIGNMENT MUTATIONS ====================

export const useAssignDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ truckId, driverId }: { truckId: string; driverId: string }) =>
      transportService.assignDriver(truckId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Driver assigned to truck successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to assign driver'));
    },
  });
};

export const useUnassignDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (truckId: string) => transportService.unassignDriver(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporter', 'fleet'] });
      Alert.alert('Success', 'Driver unassigned from truck successfully!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error, 'Failed to unassign driver'));
    },
  });
};
