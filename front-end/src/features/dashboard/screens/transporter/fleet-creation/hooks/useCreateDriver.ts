import { useState, useCallback } from 'react';

interface DriverInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  licenseType?: string;
  licenseNumber?: string;
  phone?: string;
  experience?: number;
  experienceYears?: number;
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

  const mutateAsync = createDriver;

  return { createDriver, mutateAsync, loading };
}
