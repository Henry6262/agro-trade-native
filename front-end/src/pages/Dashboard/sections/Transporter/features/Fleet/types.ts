import type { LucideIcon } from 'lucide-react-native';

export type FleetTruckStatus = 'available' | 'assigned' | 'maintenance';
export type FleetDriverStatus = 'available' | 'assigned';

export interface FleetTruck {
  id: string;
  licensePlate: string;
  model: string;
  capacityTons: number;
  status: FleetTruckStatus;
  location: string;
  verified: boolean;
  driver?: string | undefined;
  assignment?: string | undefined;
}

export interface FleetDriver {
  id: string;
  name: string;
  license: string;
  phone: string;
  status: FleetDriverStatus;
  experienceYears: number;
  assignment?: string | undefined;
}

export interface FleetSummary {
  totalTrucks: number;
  availableTrucks: number;
  inTransitTrucks: number;
  verifiedTrucks: number;
  availableDrivers: number;
  assignedDrivers: number;
}

export interface FleetData {
  summary: FleetSummary;
  trucks: FleetTruck[];
  drivers: FleetDriver[];
}

export interface FleetStatsCard {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  iconColor: string;
  valueColor: string;
}

export interface TransporterFleetHookResult {
  summary: FleetSummary;
  trucks: FleetTruck[];
  drivers: FleetDriver[];
  filteredTrucks: FleetTruck[];
  filteredDrivers: FleetDriver[];
  truckTab: FleetTruckStatus | 'in_transit';
  driverTab: FleetDriverStatus;
  isLoading: boolean;
  showFleetCreation: boolean;
  setTruckTab: (tab: FleetTruckStatus | 'in_transit') => void;
  setDriverTab: (tab: FleetDriverStatus) => void;
  openFleetCreation: () => void;
  closeFleetCreation: () => void;
}
