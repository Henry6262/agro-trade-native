import type { FleetData, FleetDriver, FleetSummary, FleetTruck } from './types';

const mockTrucks: FleetTruck[] = [
  {
    id: 'T001',
    licensePlate: 'ABC-1234',
    model: 'Volvo FH16',
    capacityTons: 40,
    status: 'available',
    location: 'Chicago, IL 🇺🇸',
    verified: true,
  },
  {
    id: 'T002',
    licensePlate: 'DEF-5678',
    model: 'Mercedes Actros',
    capacityTons: 35,
    status: 'assigned',
    location: 'En route to Kansas 🇺🇸',
    verified: true,
    driver: 'Mike Johnson',
    assignment: 'Wheat Transport - Iowa to Chicago',
  },
  {
    id: 'T003',
    licensePlate: 'GHI-9012',
    model: 'Scania R500',
    capacityTons: 45,
    status: 'assigned',
    location: 'Milwaukee, WI 🇺🇸',
    verified: true,
    driver: 'Sarah Davis',
    assignment: 'Corn Transport - Wisconsin to Kansas',
  },
  {
    id: 'T004',
    licensePlate: 'JKL-3456',
    model: 'Peterbilt 579',
    capacityTons: 38,
    status: 'available',
    location: 'Des Moines, IA 🇺🇸',
    verified: false,
  },
];

const mockDrivers: FleetDriver[] = [
  {
    id: 'D001',
    name: 'John Smith',
    license: 'CDL123456789',
    phone: '+1 (555) 123-4567',
    status: 'available',
    experienceYears: 8,
  },
  {
    id: 'D002',
    name: 'Mike Johnson',
    license: 'CDL987654321',
    phone: '+1 (555) 987-6543',
    status: 'assigned',
    experienceYears: 12,
    assignment: 'Truck DEF-5678',
  },
  {
    id: 'D003',
    name: 'Sarah Davis',
    license: 'CDL456789123',
    phone: '+1 (555) 456-7890',
    status: 'assigned',
    experienceYears: 6,
    assignment: 'Truck GHI-9012',
  },
];

const buildSummary = (trucks: FleetTruck[], drivers: FleetDriver[]): FleetSummary => ({
  totalTrucks: trucks.length,
  availableTrucks: trucks.filter((t) => t.status === 'available').length,
  inTransitTrucks: trucks.filter((t) => t.status === 'assigned').length,
  verifiedTrucks: trucks.filter((t) => t.verified).length,
  availableDrivers: drivers.filter((d) => d.status === 'available').length,
  assignedDrivers: drivers.filter((d) => d.status === 'assigned').length,
});

export const transporterFleetService = {
  async fetchFleet(): Promise<FleetData> {
    const summary = buildSummary(mockTrucks, mockDrivers);
    return Promise.resolve({ summary, trucks: mockTrucks, drivers: mockDrivers });
  },
};
