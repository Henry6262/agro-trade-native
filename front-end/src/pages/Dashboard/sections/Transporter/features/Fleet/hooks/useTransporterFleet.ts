import { useCallback, useEffect, useMemo, useState } from 'react';
import { transporterFleetService } from '../service';
import type {
  FleetDriverStatus,
  FleetTruck,
  FleetDriver,
  FleetTruckStatus,
  FleetSummary,
  TransporterFleetHookResult,
} from '../types';

export const useTransporterFleet = (): TransporterFleetHookResult => {
  const [summary, setSummary] = useState<FleetSummary>({
    totalTrucks: 0,
    availableTrucks: 0,
    inTransitTrucks: 0,
    verifiedTrucks: 0,
    availableDrivers: 0,
    assignedDrivers: 0,
  });
  const [trucks, setTrucks] = useState<FleetTruck[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [truckTab, setTruckTab] = useState<FleetTruckStatus | 'in_transit'>('available');
  const [driverTab, setDriverTab] = useState<FleetDriverStatus>('available');
  const [isLoading, setIsLoading] = useState(true);
  const [showFleetCreation, setShowFleetCreation] = useState(false);

  const loadFleet = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await transporterFleetService.fetchFleet();
      setSummary(data.summary);
      setTrucks(data.trucks);
      setDrivers(data.drivers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleet().catch((error) => console.error('Failed to load fleet data', error));
  }, [loadFleet]);

  const filteredTrucks = useMemo(
    () =>
      trucks.filter((truck) =>
        truckTab === 'available' ? truck.status === 'available' : truck.status === 'assigned'
      ),
    [truckTab, trucks]
  );

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((driver) =>
        driverTab === 'available' ? driver.status === 'available' : driver.status === 'assigned'
      ),
    [driverTab, drivers]
  );

  const openFleetCreation = useCallback(() => setShowFleetCreation(true), []);
  const closeFleetCreation = useCallback(() => setShowFleetCreation(false), []);

  return {
    summary,
    trucks,
    drivers,
    filteredTrucks,
    filteredDrivers,
    truckTab,
    driverTab,
    isLoading,
    showFleetCreation,
    setTruckTab,
    setDriverTab,
    openFleetCreation,
    closeFleetCreation,
  };
};
