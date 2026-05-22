import { useState, useCallback } from 'react';

interface TruckInput {
  plateNumber?: string;
  licensePlate?: string;
  model?: string;
  type?: string;
  vehicleType?: string;
  capacity?: number;
  capacityTons?: number;
}

export function useCreateTruck() {
  const [loading, setLoading] = useState(false);

  const createTruck = useCallback(async (_data: TruckInput) => {
    setLoading(true);
    try {
      // Stub implementation
      return { id: 'stub-truck-id', ..._data };
    } finally {
      setLoading(false);
    }
  }, []);

  const mutateAsync = createTruck;

  return { createTruck, mutateAsync, loading };
}
