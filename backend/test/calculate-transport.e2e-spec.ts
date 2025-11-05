import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Calculate Transport (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testBuyerAddressId: string;
  let testSellerIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create a test buyer with address
    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer@example.com',
        name: 'Test Buyer',
        phoneNumber: '+359888111111',
        role: 'BUYER',
        password: 'hashed_password',
      },
    });

    const buyerAddress = await prisma.address.create({
      data: {
        userId: buyer.id,
        addressLine1: 'Test Buyer Street 1',
        city: 'Sofia',
        province: 'Sofia',
        country: 'Bulgaria',
        postalCode: '1000',
        latitude: 42.6977,
        longitude: 23.3219,
        addressType: 'DELIVERY',
      },
    });

    testBuyerAddressId = buyerAddress.id;

    // Create test sellers with addresses
    const seller1 = await prisma.user.create({
      data: {
        email: 'test-seller1@example.com',
        name: 'Test Seller 1',
        phoneNumber: '+359888222222',
        role: 'SELLER',
        password: 'hashed_password',
      },
    });

    const seller2 = await prisma.user.create({
      data: {
        email: 'test-seller2@example.com',
        name: 'Test Seller 2',
        phoneNumber: '+359888333333',
        role: 'SELLER',
        password: 'hashed_password',
      },
    });

    // Create addresses for sellers
    const seller1Address = await prisma.address.create({
      data: {
        userId: seller1.id,
        addressLine1: 'Test Seller 1 Street',
        city: 'Plovdiv',
        province: 'Plovdiv',
        country: 'Bulgaria',
        postalCode: '4000',
        latitude: 42.1354,
        longitude: 24.7453,
        addressType: 'FARM',
      },
    });

    const seller2Address = await prisma.address.create({
      data: {
        userId: seller2.id,
        addressLine1: 'Test Seller 2 Street',
        city: 'Varna',
        province: 'Varna',
        country: 'Bulgaria',
        postalCode: '9000',
        latitude: 43.2141,
        longitude: 27.9147,
        addressType: 'FARM',
      },
    });

    // Create a test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Tomatoes',
        category: 'Vegetables',
        unit: 'TON',
        description: 'Test product for transport calculation',
      },
    });

    // Create sale listings for sellers
    const listing1 = await prisma.saleListing.create({
      data: {
        sellerId: seller1.id,
        productId: product.id,
        quantity: 50,
        unit: 'TON',
        pricePerUnit: 300,
        addressId: seller1Address.id,
        status: 'ACTIVE',
      },
    });

    const listing2 = await prisma.saleListing.create({
      data: {
        sellerId: seller2.id,
        productId: product.id,
        quantity: 40,
        unit: 'TON',
        pricePerUnit: 310,
        addressId: seller2Address.id,
        status: 'ACTIVE',
      },
    });

    testSellerIds = [seller1.id, seller2.id];

    // Create transport cost settings
    await prisma.transportCostSettings.create({
      data: {
        baseRatePerKm: 0.15,
        flatbedMultiplier: 1.0,
        refrigeratedMultiplier: 1.3,
        tankerMultiplier: 1.2,
        containerMultiplier: 1.1,
        tier1MaxKm: 50,
        tier1Rate: 0.15,
        tier2MaxKm: 200,
        tier2Rate: 0.13,
        tier3Rate: 0.11,
        loadingCostPerTon: 0.5,
        urgencySurcharge: 0.3,
        isActive: true,
        effectiveFrom: new Date(),
      },
    });
  }

  async function cleanupTestData() {
    // Delete in reverse order of dependencies
    await prisma.saleListing.deleteMany({
      where: {
        seller: {
          email: {
            in: ['test-seller1@example.com', 'test-seller2@example.com'],
          },
        },
      },
    });

    await prisma.product.deleteMany({
      where: { name: 'Test Tomatoes' },
    });

    await prisma.address.deleteMany({
      where: {
        user: {
          email: {
            in: [
              'test-buyer@example.com',
              'test-seller1@example.com',
              'test-seller2@example.com',
            ],
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-buyer@example.com',
            'test-seller1@example.com',
            'test-seller2@example.com',
          ],
        },
      },
    });

    await prisma.transportCostSettings.deleteMany({
      where: { baseRatePerKm: 0.15 },
    });
  }

  describe('POST /api/trade-operations/calculate-transport', () => {
    it('should calculate transport costs successfully', () => {
      return request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: testSellerIds,
          buyerAddressId: testBuyerAddressId,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.results).toBeDefined();
          expect(res.body.results).toHaveLength(2);
          expect(res.body.totalCost).toBeGreaterThan(0);
          expect(res.body.currency).toBe('EUR');

          // Verify each result has the required fields
          res.body.results.forEach((result: any) => {
            expect(result.sellerId).toBeDefined();
            expect(result.distance).toBeGreaterThan(0);
            expect(result.transportCost).toBeGreaterThan(0);
          });

          // Verify total cost is sum of individual costs
          const sumCosts = res.body.results.reduce(
            (sum: number, r: any) => sum + r.transportCost,
            0
          );
          expect(Math.abs(res.body.totalCost - sumCosts)).toBeLessThan(0.01);
        });
    });

    it('should return 400 when sellerIds is empty', () => {
      return request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: [],
          buyerAddressId: testBuyerAddressId,
        })
        .expect(400);
    });

    it('should return 400 when buyerAddressId is missing', () => {
      return request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: testSellerIds,
        })
        .expect(400);
    });

    it('should return 400 when sellerIds is not an array', () => {
      return request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: 'not-an-array',
          buyerAddressId: testBuyerAddressId,
        })
        .expect(400);
    });

    it('should return 400 when buyer address does not exist', () => {
      return request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: testSellerIds,
          buyerAddressId: 'non-existent-address-id',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('address');
        });
    });

    it('should return 400 when no sellers have valid addresses', () => {
      return request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: ['non-existent-seller-1', 'non-existent-seller-2'],
          buyerAddressId: testBuyerAddressId,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('No sellers found');
        });
    });

    it('should calculate costs accurately based on distance', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: testSellerIds,
          buyerAddressId: testBuyerAddressId,
        })
        .expect(200);

      // Verify cost calculation logic
      response.body.results.forEach((result: any) => {
        const expectedCost = result.distance * 0.15; // baseRatePerKm
        // Allow small rounding differences
        expect(Math.abs(result.transportCost - expectedCost)).toBeLessThan(0.01);
      });
    });

    it('should return distances in kilometers with proper precision', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: testSellerIds,
          buyerAddressId: testBuyerAddressId,
        })
        .expect(200);

      response.body.results.forEach((result: any) => {
        // Distance should be rounded to 1 decimal place
        const decimalPlaces = (result.distance.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(1);
      });
    });

    it('should return costs with proper precision (2 decimal places)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: testSellerIds,
          buyerAddressId: testBuyerAddressId,
        })
        .expect(200);

      response.body.results.forEach((result: any) => {
        // Cost should be rounded to 2 decimal places
        const decimalPlaces = (result.transportCost.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });
  });
});
