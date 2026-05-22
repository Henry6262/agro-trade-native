import { useState, useCallback } from 'react';

interface TruckInput {
  plateNumber: string;
  type: string;
  capacity: number;
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

  return { createTruck, loading };
}
