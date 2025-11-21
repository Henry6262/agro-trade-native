import {
  calculateRoute,
  calculateMultipleRoutes,
} from '../../../../src/features/dashboard/screens/transporter/maps/api/routeApi';
import { Location } from '../../../../src/features/dashboard/screens/transporter/maps/types';

describe('Route Calculation Contract', () => {
  describe('POST /api/routes/calculate', () => {
    const truckLocation: Location = {
      coordinates: { latitude: 25.2654, longitude: 51.52 },
      address: { city: 'Doha', state: 'Ad Dawhah', country: 'Qatar' },
      type: 'truck_location',
    };

    const pickupLocation: Location = {
      coordinates: { latitude: 25.2744, longitude: 51.5111 },
      address: {
        street: 'Farm Road 45',
        city: 'Al Khor',
        state: 'Al Khor',
        country: 'Qatar',
      },
      name: 'Green Valley Farm',
      type: 'pickup',
    };

    const deliveryLocation: Location = {
      coordinates: { latitude: 25.2854, longitude: 51.531 },
      address: {
        city: 'Doha',
        state: 'Ad Dawhah',
        country: 'Qatar',
      },
      name: 'Central Market',
      type: 'delivery',
    };

    it('should calculate route with polyline points', async () => {
      const route = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );

      expect(route).toBeDefined();
      expect(route).toHaveProperty('truckId', 'truck-001');
      expect(route).toHaveProperty('truckLabel', 'T1');
      expect(route).toHaveProperty('polyline');
      expect(route).toHaveProperty('distance');
      expect(route).toHaveProperty('duration');
      expect(route).toHaveProperty('color');
      expect(route).toHaveProperty('waypoints');
    });

    it('should return encoded polyline string', async () => {
      const route = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );

      expect(typeof route.polyline).toBe('string');
      expect(route.polyline.length).toBeGreaterThan(0);
      // Encoded polylines typically contain these characters
      expect(route.polyline).toMatch(/^[a-zA-Z0-9~`!@_\-\[\]{}|\\]+$/);
    });

    it('should include correct waypoints', async () => {
      const route = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );

      expect(route.waypoints).toHaveLength(3);
      expect(route.waypoints[0]).toEqual(truckLocation);
      expect(route.waypoints[1]).toEqual(pickupLocation);
      expect(route.waypoints[2]).toEqual(deliveryLocation);
    });

    it('should calculate distances correctly', async () => {
      const route = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );

      expect(route.distance).toBeDefined();
      expect(route.distance.toPickup).toBeGreaterThan(0);
      expect(route.distance.toDelivery).toBeGreaterThan(0);
      expect(route.distance.total).toBe(route.distance.toPickup + route.distance.toDelivery);

      // Reasonable distance ranges for Qatar (in km)
      expect(route.distance.total).toBeGreaterThan(1);
      expect(route.distance.total).toBeLessThan(200);
    });

    it('should calculate durations correctly', async () => {
      const route = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );

      expect(route.duration).toBeDefined();
      expect(route.duration.toPickup).toBeGreaterThan(0);
      expect(route.duration.toDelivery).toBeGreaterThan(0);
      expect(route.duration.total).toBe(route.duration.toPickup + route.duration.toDelivery);

      // Reasonable duration ranges (in minutes)
      expect(route.duration.total).toBeGreaterThan(5);
      expect(route.duration.total).toBeLessThan(240); // 4 hours max
    });

    it('should assign correct colors to routes', async () => {
      const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899'];

      const route1 = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );
      const route2 = await calculateRoute(
        'truck-002',
        'T2',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );
      const route3 = await calculateRoute(
        'truck-003',
        'T3',
        truckLocation,
        pickupLocation,
        deliveryLocation
      );

      expect(colors).toContain(route1.color);
      expect(colors).toContain(route2.color);
      expect(colors).toContain(route3.color);

      // Different trucks should get different colors
      expect(route1.color).not.toBe(route2.color);
      expect(route2.color).not.toBe(route3.color);
    });

    it('should handle same pickup and delivery locations', async () => {
      const route = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        pickupLocation // Same as pickup
      );

      expect(route.distance.toDelivery).toBe(0);
      expect(route.duration.toDelivery).toBe(0);
      expect(route.distance.total).toBe(route.distance.toPickup);
    });

    it('should calculate multiple routes efficiently', async () => {
      const trucks = [
        { id: 'truck-001', label: 'T1', location: truckLocation },
        { id: 'truck-002', label: 'T2', location: truckLocation },
        { id: 'truck-003', label: 'T3', location: truckLocation },
      ];

      const startTime = Date.now();
      const routes = await calculateMultipleRoutes(trucks, pickupLocation, deliveryLocation);
      const endTime = Date.now();

      expect(routes).toHaveLength(3);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Each route should be unique
      const truckIds = routes.map((r) => r.truckId);
      expect(new Set(truckIds).size).toBe(3);
    });

    it('should handle invalid coordinates gracefully', async () => {
      const invalidLocation: Location = {
        coordinates: { latitude: 999, longitude: 999 }, // Invalid
        address: { city: 'Invalid', state: 'Invalid', country: 'Invalid' },
        type: 'truck_location',
      };

      await expect(
        calculateRoute('truck-001', 'T1', invalidLocation, pickupLocation, deliveryLocation)
      ).rejects.toThrow('Invalid coordinates');
    });

    it('should include traffic factor in calculations', async () => {
      const morningRoute = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation,
        { includeTraffic: true, timeOfDay: 'morning' }
      );

      const nightRoute = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation,
        { includeTraffic: true, timeOfDay: 'night' }
      );

      // Morning should have more traffic, longer duration
      expect(morningRoute.duration.total).toBeGreaterThanOrEqual(nightRoute.duration.total);
    });

    it('should provide alternative routes when requested', async () => {
      const route = await calculateRoute(
        'truck-001',
        'T1',
        truckLocation,
        pickupLocation,
        deliveryLocation,
        { includeAlternatives: true }
      );

      expect(route.alternativeRoutes).toBeDefined();
      expect(Array.isArray(route.alternativeRoutes)).toBe(true);

      if (route.alternativeRoutes && route.alternativeRoutes.length > 0) {
        const alt = route.alternativeRoutes[0];
        expect(alt).toHaveProperty('polyline');
        expect(alt).toHaveProperty('distance');
        expect(alt).toHaveProperty('duration');

        // Alternative route should be different
        expect(alt.polyline).not.toBe(route.polyline);
      }
    });
  });
});
