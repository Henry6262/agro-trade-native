# Data Model: Google Maps Integration

**Feature**: Google Maps Integration for Transporter Route Visualization
**Date**: 2024-01-13

## Core Entities

### MapOffer
Represents an offer with enhanced location data for map visualization.

```typescript
interface MapOffer {
  id: string;
  quantity: number; // in tons
  pickup: Location;
  delivery: Location;
  deadline: Date;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered';
  estimatedValue: number;
  productType: string;
}
```

### Location
Geographic point with address and coordinate information.

```typescript
interface Location {
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
  name?: string; // e.g., "ABC Farm", "XYZ Warehouse"
  type: 'pickup' | 'delivery' | 'truck_location';
}
```

### TruckMarker
Represents a truck's position and information on the map.

```typescript
interface TruckMarker {
  id: string;
  truckId: string;
  position: Location;
  label: string; // e.g., "T1", "T2"
  licensePlate?: string;
  capacity: number; // in tons
  currentLoad: number; // in tons
  status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
  distanceToPickup?: number; // in kilometers
  estimatedArrival?: Date;
  color: string; // hex color for route
}
```

### RouteData
Contains polyline and metadata for a single truck's route.

```typescript
interface RouteData {
  truckId: string;
  truckLabel: string; // e.g., "T1"
  polyline: string; // encoded polyline string
  waypoints: Location[]; // [truck location, pickup, delivery]
  distance: {
    total: number; // in kilometers
    toPickup: number;
    toDelivery: number;
  };
  duration: {
    total: number; // in minutes
    toPickup: number;
    toDelivery: number;
  };
  color: string; // hex color for display
  alternativeRoutes?: RouteData[]; // optional alternatives
}
```

### MapBounds
Viewport calculation for fitting all elements.

```typescript
interface MapBounds {
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
  zoom?: number; // optional zoom level
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

### Fleet
Collection of trucks for a transporter.

```typescript
interface Fleet {
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
```

### Truck
Individual truck details.

```typescript
interface Truck {
  id: string;
  registrationNumber: string;
  capacity: number; // in tons
  currentLocation: Location;
  status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
  assignedDriver?: string; // driver ID
  lastUpdated: Date;
  specifications: {
    make?: string;
    model?: string;
    year?: number;
    fuelType?: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  };
}
```

### MapViewState
UI state for the map drawer component.

```typescript
interface MapViewState {
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
    followTruck?: string; // truck ID to follow
  };
}
```

## Relationships

### Entity Relationships
```
MapOffer (1) ──── has ────> (2) Location (pickup, delivery)
    │
    └──── requires ────> (1..n) Truck
              │
              └──── generates ────> (1..n) RouteData
                          │
                          └──── displays as ────> (1) TruckMarker

Fleet (1) ──── contains ────> (n) Truck
    │
    └──── belongs to ────> (1) Transporter

MapViewState (1) ──── manages ────> (n) RouteData
    │
    ├──── displays ────> (n) TruckMarker
    │
    └──── calculates ────> (1) MapBounds
```

## Mock Data Structure

### Sample Mock Offer
```typescript
const mockOffer: MapOffer = {
  id: 'offer-001',
  quantity: 120,
  pickup: {
    coordinates: { latitude: 25.2744, longitude: 51.5111 },
    address: {
      street: 'Farm Road 45',
      city: 'Al Khor',
      state: 'Al Khor',
      country: 'Qatar'
    },
    name: 'Green Valley Farm',
    type: 'pickup'
  },
  delivery: {
    coordinates: { latitude: 25.2854, longitude: 51.5310 },
    address: {
      city: 'Doha',
      state: 'Ad Dawhah',
      country: 'Qatar'
    },
    name: 'Central Market',
    type: 'delivery'
  },
  deadline: new Date('2024-01-15T14:00:00'),
  status: 'pending',
  estimatedValue: 50000,
  productType: 'vegetables'
};
```

### Sample Mock Fleet
```typescript
const mockFleet: Fleet = {
  transporterId: 'transporter-001',
  trucks: [
    {
      id: 'truck-001',
      registrationNumber: 'QTR-1234',
      capacity: 40,
      currentLocation: {
        coordinates: { latitude: 25.2654, longitude: 51.5200 },
        address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
        type: 'truck_location'
      },
      status: 'available',
      lastUpdated: new Date()
    },
    // ... more trucks
  ],
  totalCapacity: 200,
  availableCapacity: 160,
  stats: {
    totalTrucks: 5,
    availableTrucks: 4,
    inTransitTrucks: 1,
    maintenanceTrucks: 0
  }
};
```

## Data Validation Rules

### Coordinate Validation
- Latitude: -90 to +90
- Longitude: -180 to +180
- Precision: 6 decimal places (11cm accuracy)

### Capacity Rules
- Minimum truck capacity: 1 ton
- Maximum truck capacity: 100 tons
- Offer quantity must be > 0

### Distance Calculations
- Use Haversine formula for straight-line distance
- Apply 1.3x factor for road distance estimation
- Maximum route distance: 1000 km

### Time Estimations
- Highway speed: 60 km/h
- City speed: 40 km/h
- Add 15% buffer for traffic
- Include 30 min loading/unloading time

---
*Data model defined for Maps integration feature*