import transportService, {
  TransportFleetDriver,
  TransportFleetResponse,
  TransportFleetSummary,
  TransportFleetTruck,
} from '@services/transportService';
import type { FleetData, FleetDriver, FleetSummary, FleetTruck } from './types';

const mapTruck = (truck: TransportFleetTruck): FleetTruck => ({
  id: truck.id,
  licensePlate: truck.licensePlate,
  model: truck.model,
  capacityTons: truck.capacityTons,
  status: truck.status,
  location: truck.location,
  verified: truck.verified,
  driver: truck.driver,
  assignment: truck.assignment ?? undefined,
});

const mapDriver = (driver: TransportFleetDriver): FleetDriver => ({
  id: driver.id,
  name: driver.name,
  license: driver.license,
  phone: driver.phone ?? '',
  status: driver.status,
  experienceYears: driver.experienceYears,
  assignment: driver.assignment ?? undefined,
});

const buildSummary = (summary: TransportFleetSummary): FleetSummary => ({
  totalTrucks: summary.totalTrucks,
  availableTrucks: summary.availableTrucks,
  inTransitTrucks: summary.inTransitTrucks,
  verifiedTrucks: summary.verifiedTrucks,
  availableDrivers: summary.availableDrivers,
  assignedDrivers: summary.assignedDrivers,
});

export const transporterFleetService = {
  async fetchFleet(): Promise<FleetData> {
    const response: TransportFleetResponse = await transportService.getMyFleet();

    return {
      summary: buildSummary(response.summary),
      trucks: response.trucks.map(mapTruck),
      drivers: response.drivers.map(mapDriver),
    };
  },
};
