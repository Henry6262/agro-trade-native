import { getOfferMapData } from './api/offerApi';
import { fetchAvailableFleet } from './api/fleetApi';
import { calculateMultipleRoutes } from './api/routeApi';
import type { Fleet, MapOffer, RouteData, Location } from './types';

export const transporterMapService = {
  fetchOfferMapData: (offerId: string) => getOfferMapData(offerId),
  fetchAvailableFleet: (transporterId: string) => fetchAvailableFleet(transporterId),
  calculateRoutes: (
    trucks: { id: string; label: string; location: Location }[],
    pickup: Location,
    delivery: Location
  ): Promise<RouteData[]> => calculateMultipleRoutes(trucks, pickup, delivery),
};

export type { Fleet, MapOffer, RouteData };
