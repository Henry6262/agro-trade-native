import { renderHook, waitFor } from '@testing-library/react-native';
import { fetchAvailableFleet } from '../../../../src/features/dashboard/screens/transporter/maps/api/fleetApi';
import { Fleet, Truck } from '../../../../src/features/dashboard/screens/transporter/maps/types';

describe('Fleet API Contract', () => {
  describe('GET /api/transporter/fleet/available', () => {
    it('should return available trucks with required fields', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      
      expect(response).toBeDefined();
      expect(response).toHaveProperty('transporterId');
      expect(response).toHaveProperty('trucks');
      expect(response).toHaveProperty('totalCapacity');
      expect(response).toHaveProperty('availableCapacity');
      expect(response).toHaveProperty('stats');
      
      expect(Array.isArray(response.trucks)).toBe(true);
      expect(response.trucks.length).toBeGreaterThan(0);
    });

    it('should return trucks with correct structure', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      const firstTruck = response.trucks[0];
      
      expect(firstTruck).toHaveProperty('id');
      expect(firstTruck).toHaveProperty('registrationNumber');
      expect(firstTruck).toHaveProperty('capacity');
      expect(firstTruck).toHaveProperty('currentLocation');
      expect(firstTruck).toHaveProperty('status');
      expect(firstTruck).toHaveProperty('lastUpdated');
      
      expect(typeof firstTruck.id).toBe('string');
      expect(typeof firstTruck.capacity).toBe('number');
      expect(firstTruck.capacity).toBeGreaterThan(0);
      expect(firstTruck.capacity).toBeLessThanOrEqual(100);
    });

    it('should return valid location data for each truck', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      const firstTruck = response.trucks[0];
      
      expect(firstTruck.currentLocation).toHaveProperty('coordinates');
      expect(firstTruck.currentLocation).toHaveProperty('address');
      expect(firstTruck.currentLocation).toHaveProperty('type');
      
      const { coordinates } = firstTruck.currentLocation;
      expect(coordinates).toHaveProperty('latitude');
      expect(coordinates).toHaveProperty('longitude');
      
      expect(coordinates.latitude).toBeGreaterThanOrEqual(-90);
      expect(coordinates.latitude).toBeLessThanOrEqual(90);
      expect(coordinates.longitude).toBeGreaterThanOrEqual(-180);
      expect(coordinates.longitude).toBeLessThanOrEqual(180);
      
      expect(firstTruck.currentLocation.type).toBe('truck_location');
    });

    it('should return fleet statistics', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      const { stats } = response;
      
      expect(stats).toHaveProperty('totalTrucks');
      expect(stats).toHaveProperty('availableTrucks');
      expect(stats).toHaveProperty('inTransitTrucks');
      expect(stats).toHaveProperty('maintenanceTrucks');
      
      expect(typeof stats.totalTrucks).toBe('number');
      expect(typeof stats.availableTrucks).toBe('number');
      expect(stats.totalTrucks).toBeGreaterThanOrEqual(0);
      expect(stats.availableTrucks).toBeLessThanOrEqual(stats.totalTrucks);
    });

    it('should only return available trucks when filtered', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      const availableTrucks = response.trucks.filter(
        (truck: Truck) => truck.status === 'available'
      );
      
      expect(availableTrucks.length).toBe(response.stats.availableTrucks);
      
      availableTrucks.forEach((truck: Truck) => {
        expect(truck.status).toBe('available');
      });
    });

    it('should calculate capacity correctly', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      
      const totalCapacity = response.trucks.reduce(
        (sum: number, truck: Truck) => sum + truck.capacity, 
        0
      );
      
      const availableCapacity = response.trucks
        .filter((truck: Truck) => truck.status === 'available')
        .reduce((sum: number, truck: Truck) => sum + truck.capacity, 0);
      
      expect(response.totalCapacity).toBe(totalCapacity);
      expect(response.availableCapacity).toBe(availableCapacity);
    });

    it('should handle transporter with no trucks', async () => {
      const response = await fetchAvailableFleet('transporter-empty');
      
      expect(response).toBeDefined();
      expect(response.trucks).toEqual([]);
      expect(response.totalCapacity).toBe(0);
      expect(response.availableCapacity).toBe(0);
      expect(response.stats.totalTrucks).toBe(0);
    });

    it('should handle invalid transporter ID', async () => {
      await expect(
        fetchAvailableFleet('invalid-transporter')
      ).rejects.toThrow('Transporter not found');
    });

    it('should include driver info when assigned', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      const assignedTruck = response.trucks.find(
        (truck: Truck) => truck.assignedDriver
      );
      
      if (assignedTruck) {
        expect(assignedTruck.assignedDriver).toBeDefined();
        expect(typeof assignedTruck.assignedDriver).toBe('string');
      }
    });

    it('should return fresh data with lastUpdated timestamp', async () => {
      const response = await fetchAvailableFleet('transporter-001');
      const now = new Date();
      
      response.trucks.forEach((truck: Truck) => {
        const lastUpdated = new Date(truck.lastUpdated);
        const timeDiff = now.getTime() - lastUpdated.getTime();
        
        expect(timeDiff).toBeLessThanOrEqual(30 * 60 * 1000);
      });
    });
  });
});