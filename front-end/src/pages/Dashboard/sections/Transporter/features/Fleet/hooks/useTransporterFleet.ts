import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const [truckTab, setTruckTab] = useState<FleetTruckStatus | 'in_transit'>('available');
  const [driverTab, setDriverTab] = useState<FleetDriverStatus>('available');
  const [showFleetCreation, setShowFleetCreation] = useState(false);

  const fleetQuery = useQuery({
    queryKey: ['transporter', 'fleet'],
    queryFn: transporterFleetService.fetchFleet,
  });

  const summary: FleetSummary =
    fleetQuery.data?.summary ?? {
      totalTrucks: 0,
      availableTrucks: 0,
      inTransitTrucks: 0,
      verifiedTrucks: 0,
      availableDrivers: 0,
      assignedDrivers: 0,
    };

  const trucks: FleetTruck[] = fleetQuery.data?.trucks ?? [];
  const drivers: FleetDriver[] = fleetQuery.data?.drivers ?? [];

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
    isLoading: fleetQuery.isLoading,
    showFleetCreation,
    setTruckTab,
    setDriverTab,
    openFleetCreation,
    closeFleetCreation,
  };
};
