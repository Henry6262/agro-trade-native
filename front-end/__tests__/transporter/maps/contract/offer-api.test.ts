import { getOfferMapData, getMultipleOffersMapData } from '../../../../src/features/dashboard/screens/transporter/maps/api/offerApi';
import { MapOffer } from '../../../../src/features/dashboard/screens/transporter/maps/types';

describe('Offer Map Data Contract', () => {
  describe('GET /api/offers/:id/map-data', () => {
    it('should return offer with location data', async () => {
      const offer = await getOfferMapData('offer-001');
      
      expect(offer).toBeDefined();
      expect(offer).toHaveProperty('id');
      expect(offer).toHaveProperty('quantity');
      expect(offer).toHaveProperty('pickup');
      expect(offer).toHaveProperty('delivery');
      expect(offer).toHaveProperty('deadline');
      expect(offer).toHaveProperty('status');
      expect(offer).toHaveProperty('estimatedValue');
      expect(offer).toHaveProperty('productType');
    });

    it('should return valid pickup location', async () => {
      const offer = await getOfferMapData('offer-001');
      
      expect(offer.pickup).toBeDefined();
      expect(offer.pickup).toHaveProperty('coordinates');
      expect(offer.pickup).toHaveProperty('address');
      expect(offer.pickup).toHaveProperty('type', 'pickup');
      
      const { coordinates } = offer.pickup;
      expect(coordinates).toHaveProperty('latitude');
      expect(coordinates).toHaveProperty('longitude');
      expect(typeof coordinates.latitude).toBe('number');
      expect(typeof coordinates.longitude).toBe('number');
    });

    it('should return valid delivery location', async () => {
      const offer = await getOfferMapData('offer-001');
      
      expect(offer.delivery).toBeDefined();
      expect(offer.delivery).toHaveProperty('coordinates');
      expect(offer.delivery).toHaveProperty('address');
      expect(offer.delivery).toHaveProperty('type', 'delivery');
      
      const { address } = offer.delivery;
      expect(address).toHaveProperty('city');
      expect(address).toHaveProperty('state');
      expect(address).toHaveProperty('country');
    });

    it('should return offer quantity and capacity requirements', async () => {
      const offer = await getOfferMapData('offer-001');
      
      expect(typeof offer.quantity).toBe('number');
      expect(offer.quantity).toBeGreaterThan(0);
      expect(offer.quantity).toBeLessThanOrEqual(500); // Max reasonable tonnage
    });

    it('should return deadline as valid date', async () => {
      const offer = await getOfferMapData('offer-001');
      
      expect(offer.deadline).toBeDefined();
      const deadline = new Date(offer.deadline);
      expect(deadline).toBeInstanceOf(Date);
      expect(deadline.getTime()).toBeGreaterThan(Date.now());
    });

    it('should include product type information', async () => {
      const offer = await getOfferMapData('offer-001');
      
      expect(offer.productType).toBeDefined();
      expect(typeof offer.productType).toBe('string');
      expect(offer.productType.length).toBeGreaterThan(0);
      
      const validTypes = ['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'];
      expect(validTypes).toContain(offer.productType);
    });

    it('should return correct offer status', async () => {
      const offer = await getOfferMapData('offer-001');
      
      const validStatuses = ['pending', 'accepted', 'in_transit', 'delivered'];
      expect(validStatuses).toContain(offer.status);
    });

    it('should handle non-existent offer ID', async () => {
      await expect(
        getOfferMapData('non-existent-offer')
      ).rejects.toThrow('Offer not found');
    });

    it('should calculate truck requirements based on quantity', async () => {
      const smallOffer = await getOfferMapData('offer-small'); // 30 tons
      const mediumOffer = await getOfferMapData('offer-medium'); // 120 tons
      const largeOffer = await getOfferMapData('offer-large'); // 200 tons
      
      // Assuming 40-ton truck capacity
      const calculateTrucks = (quantity: number) => Math.ceil(quantity / 40);
      
      expect(calculateTrucks(smallOffer.quantity)).toBe(1);
      expect(calculateTrucks(mediumOffer.quantity)).toBe(3);
      expect(calculateTrucks(largeOffer.quantity)).toBe(5);
    });

    it('should include location names when available', async () => {
      const offer = await getOfferMapData('offer-001');
      
      if (offer.pickup.name) {
        expect(typeof offer.pickup.name).toBe('string');
        expect(offer.pickup.name.length).toBeGreaterThan(0);
      }
      
      if (offer.delivery.name) {
        expect(typeof offer.delivery.name).toBe('string');
        expect(offer.delivery.name.length).toBeGreaterThan(0);
      }
    });

    it('should return multiple offers efficiently', async () => {
      const offerIds = ['offer-001', 'offer-002', 'offer-003'];
      
      const startTime = Date.now();
      const offers = await getMultipleOffersMapData(offerIds);
      const endTime = Date.now();
      
      expect(offers).toHaveLength(3);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      offers.forEach((offer, index) => {
        expect(offer.id).toBe(offerIds[index]);
        expect(offer.pickup).toBeDefined();
        expect(offer.delivery).toBeDefined();
      });
    });

    it('should return offers with different statuses', async () => {
      const pendingOffer = await getOfferMapData('offer-pending');
      const acceptedOffer = await getOfferMapData('offer-accepted');
      const inTransitOffer = await getOfferMapData('offer-transit');
      
      expect(pendingOffer.status).toBe('pending');
      expect(acceptedOffer.status).toBe('accepted');
      expect(inTransitOffer.status).toBe('in_transit');
    });

    it('should validate offer value is reasonable', async () => {
      const offer = await getOfferMapData('offer-001');
      
      expect(typeof offer.estimatedValue).toBe('number');
      expect(offer.estimatedValue).toBeGreaterThan(0);
      expect(offer.estimatedValue).toBeLessThanOrEqual(1000000); // Max 1M currency units
      
      // Value should be proportional to quantity (rough estimate)
      const valuePerTon = offer.estimatedValue / offer.quantity;
      expect(valuePerTon).toBeGreaterThan(100); // Min value per ton
      expect(valuePerTon).toBeLessThan(10000); // Max value per ton
    });

    it('should return consistent data on multiple calls', async () => {
      const offer1 = await getOfferMapData('offer-001');
      const offer2 = await getOfferMapData('offer-001');
      
      expect(offer1.id).toBe(offer2.id);
      expect(offer1.quantity).toBe(offer2.quantity);
      expect(offer1.pickup.coordinates.latitude).toBe(offer2.pickup.coordinates.latitude);
      expect(offer1.pickup.coordinates.longitude).toBe(offer2.pickup.coordinates.longitude);
    });
  });
});