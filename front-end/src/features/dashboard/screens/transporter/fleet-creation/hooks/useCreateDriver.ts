import { useState, useCallback } from 'react';

interface DriverInput {
  name: string;
  licenseType: string;
  experience: number;
}

export function useCreateDriver() {
  const [loading, setLoading] = useState(false);

  const createDriver = useCallback(async (_data: DriverInput) => {
    setLoading(true);
    try {
      // Stub implementation
      return { id: 'stub-driver-id', ..._data };
    } finally {
      setLoading(false);
    }
  }, []);

  return { createDriver, loading };
}
