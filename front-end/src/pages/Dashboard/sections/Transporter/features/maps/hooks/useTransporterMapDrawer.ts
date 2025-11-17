import { useCallback, useState } from 'react';
import { transporterMapService } from '../service';
import type { Fleet, MapOffer, RouteData } from '../types';

interface UseTransporterMapDrawerReturn {
  isLoading: boolean;
  error: string | null;
  fleet: Fleet | null;
  routes: RouteData[];
  loadMapData: (offer: MapOffer) => Promise<void>;
}

export const useTransporterMapDrawer = (): UseTransporterMapDrawerReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [routes, setRoutes] = useState<RouteData[]>([]);

  const loadMapData = useCallback(async (offer: MapOffer) => {
    setIsLoading(true);
    setError(null);
    try {
      const [offerData, fleetData] = await Promise.all([
        transporterMapService.fetchOfferMapData(offer.id),
        transporterMapService.fetchAvailableFleet('transporter-001'),
      ]);
      setFleet(fleetData);

      const trucksRequired = Math.ceil((offer.quantity ?? 0) / 40);
      const availableTrucks = fleetData.trucks
        .filter((truck) => truck.status === 'available')
        .slice(0, trucksRequired)
        .map((truck, index) => ({
          id: truck.id,
          label: `T${index + 1}`,
          location: truck.currentLocation,
        }));

      if (availableTrucks.length) {
        const calculatedRoutes = await transporterMapService.calculateRoutes(
          availableTrucks,
          offerData.pickup,
          offerData.delivery
        );
        setRoutes(calculatedRoutes);
      } else {
        setRoutes([]);
      }
    } catch (err) {
      console.error('Failed to load map data', err);
      setError('Failed to load map data');
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fleet,
    routes,
    loadMapData,
  };
};
