export interface Location {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  name?: string;
  type: 'pickup' | 'delivery' | 'truck_location';
}

export interface Truck {
  id: string;
  registrationNumber: string;
  capacity: number;
  currentLocation: Location;
  status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
  assignedDriver?: string;
  lastUpdated: Date;
  specifications?: {
    make?: string;
    model?: string;
    year?: number;
    fuelType?: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  };
}

export interface Fleet {
  transporterId: string;
  trucks: Truck[];
  totalCapacity: number;
  availableCapacity: number;
  stats: {
    totalTrucks: number;
    availableTrucks: number;
    inTransitTrucks: number;
    maintenanceTrucks: number;
  };
}

export interface MapOffer {
  id: string;
  quantity: number;
  pickup: Location;
  delivery: Location;
  deadline: Date;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered';
  estimatedValue: number;
  productType: string;
}

export interface TruckMarker {
  id: string;
  truckId: string;
  position: Location;
  label: string;
  licensePlate?: string;
  capacity: number;
  currentLoad: number;
  status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
  distanceToPickup?: number;
  estimatedArrival?: Date;
  color: string;
}

export interface RouteData {
  truckId: string;
  truckLabel: string;
  polyline: string;
  waypoints: Location[];
  distance: {
    total: number;
    toPickup: number;
    toDelivery: number;
  };
  duration: {
    total: number;
    toPickup: number;
    toDelivery: number;
  };
  color: string;
  alternativeRoutes?: RouteData[];
}

export interface MapBounds {
  northeast: {
    latitude: number;
    longitude: number;
  };
  southwest: {
    latitude: number;
    longitude: number;
  };
  center: {
    latitude: number;
    longitude: number;
  };
  zoom?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface MapViewState {
  isOpen: boolean;
  selectedOffer?: MapOffer;
  selectedTrucks: TruckMarker[];
  routes: RouteData[];
  viewMode: 'route' | 'satellite' | 'terrain';
  isLoading: boolean;
  error?: string;
  mapBounds?: MapBounds;
  settings: {
    showTraffic: boolean;
    showLegend: boolean;
    autoZoom: boolean;
    followTruck?: string;
  };
}