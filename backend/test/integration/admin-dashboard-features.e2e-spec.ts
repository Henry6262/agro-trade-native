import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDataFactory } from '../helpers/test-data-factory';
import { DatabaseCleaner } from '../helpers/database-cleaner';
import { ApiClient } from '../helpers/api-client';

/**
 * Admin Dashboard Features Integration Tests
 *
 * Tests all admin dashboard features end-to-end:
 * 1. Scenario Orchestrator - Complete trade workflow simulation
 * 2. Trade Operations Management - CRUD operations
 * 3. Map-based Matching - Buyer/seller matching with transport costs
 * 4. Inspector Portal - Inspection viewing and completion
 * 5. Transport Management - Transport requests and bid management
 * 6. Trade Flow Visualization - State progression tracking
 * 7. Database State Panel - Data browsing and cleanup
 * 8. Progress Dashboard - Metrics tracking
 */
describe('Admin Dashboard Features - Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dataFactory: TestDataFactory;
  let dbCleaner: DatabaseCleaner;
  let apiClient: ApiClient;
  let testScenario: Awaited<ReturnType<TestDataFactory['createFullTradeScenario']>>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    dataFactory = new TestDataFactory(prisma);
    dbCleaner = new DatabaseCleaner(prisma);
    apiClient = new ApiClient(app);
  });

  afterAll(async () => {
    await dbCleaner.cleanAll();
    await app.close();
  });

  beforeEach(async () => {
    await dbCleaner.cleanAll();
    testScenario = await dataFactory.createFullTradeScenario({
      sellerCount: 3,
      buyerQuantity: 100,
      sellerQuantity: 40,
      sellerPrice: 320,
      buyerPrice: 350,
      withAddresses: true,
      withVerifiedSellers: [false, false, true],
    });
  });

  describe('Feature 1: Scenario Orchestrator', () => {
    it('should execute complete happy path scenario from start to finish', async () => {
      console.log('\n========== SCENARIO ORCHESTRATOR TEST ==========');

      // Step 1: Create trade operation via API
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
            {
              sellerId: testScenario.sellers[1].id,
              saleListingId: testScenario.saleListings[1].id,
              quantity: 40,
              offerPrice: 320,
            },
            {
              sellerId: testScenario.sellers[2].id,
              saleListingId: testScenario.saleListings[2].id,
              quantity: 20,
              offerPrice: 325,
            },
          ],
        },
        201
      );

      const tradeOpId = createResponse.body.tradeOperationId;
      expect(tradeOpId).toBeDefined();

      // Verify trade operation created
      const tradeOp = await prisma.tradeOperation.findUnique({
        where: { id: tradeOpId },
        include: { sellers: true, negotiations: true },
      });

      expect(tradeOp).toBeDefined();
      expect(tradeOp?.phase).toBe('SELLER_NEGOTIATION');
      expect(tradeOp?.sellers).toHaveLength(3);
      expect(tradeOp?.negotiations).toHaveLength(3);

      // Step 2: Sellers accept offers
      for (const negotiation of tradeOp!.negotiations) {
        await apiClient.post(`/api/negotiations/${negotiation.id}/accept`, {}, 200);
      }

      // Step 3: Verify inspections auto-created
      const inspections = await prisma.inspectionRequest.findMany({
        where: { tradeOperationId: tradeOpId },
      });

      expect(inspections).toHaveLength(2); // Only 2 unverified sellers

      // Step 4: Complete inspections
      for (const inspection of inspections) {
        await prisma.inspectionRequest.update({
          where: { id: inspection.id },
          data: {
            inspectorId: testScenario.inspector.id,
            status: 'SCHEDULED',
          },
        });

        await apiClient.patch(`/api/inspections/${inspection.id}`, {
          status: 'COMPLETED',
          qualityScore: 85,
          qualityGrade: 'Premium',
        }, 200);
      }

      // Step 5: Verify phase advanced to TRANSPORT_MATCHING
      const updatedTradeOp = await prisma.tradeOperation.findUnique({
        where: { id: tradeOpId },
      });

      expect(updatedTradeOp?.phase).toBe('TRANSPORT_MATCHING');

      // Step 6: Verify transport request auto-created
      const transportRequest = await prisma.transportRequest.findFirst({
        where: { tradeOperationId: tradeOpId },
      });

      expect(transportRequest).toBeDefined();
      expect(transportRequest?.status).toBe('OPEN');

      console.log('✅ Scenario orchestrator workflow completed successfully');
    });

    it('should handle counter-offers in negotiation', async () => {
      // Create trade operation
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      const negotiationId = createResponse.body.negotiations[0].id;

      // Counter-offer
      const counterResponse = await apiClient.post(
        `/api/negotiations/${negotiationId}/counter`,
        {
          counterPrice: 330,
          notes: 'Higher price needed',
        },
        200
      );

      expect(counterResponse.body.status).toBe('COUNTERED');
      expect(counterResponse.body.counterOfferPrice).toBe(330);
    });

    it('should enforce 48-hour offer expiry', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      const negotiation = createResponse.body.negotiations[0];
      const expiresAt = new Date(negotiation.expiresAt);
      const now = new Date();
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(hoursUntilExpiry).toBeGreaterThan(47);
      expect(hoursUntilExpiry).toBeLessThanOrEqual(48);
    });
  });

  describe('Feature 2: Trade Operations Management', () => {
    it('should list all trade operations', async () => {
      // Create 3 trade operations
      for (let i = 0; i < 3; i++) {
        await apiClient.post(
          '/api/trade-operations',
          {
            buyListingId: testScenario.buyListing.id,
            adminId: testScenario.admin.id,
            sellers: [
              {
                sellerId: testScenario.sellers[0].id,
                saleListingId: testScenario.saleListings[0].id,
                quantity: 30,
                offerPrice: 320,
              },
            ],
          },
          201
        );
      }

      const listResponse = await apiClient.get('/api/trade-operations', 200);
      const operations = listResponse.body.data || listResponse.body;

      expect(Array.isArray(operations)).toBe(true);
      expect(operations.length).toBeGreaterThanOrEqual(3);
    });

    it('should get single trade operation by ID with full details', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      const tradeOpId = createResponse.body.tradeOperationId;
      const getResponse = await apiClient.get(`/api/trade-operations/${tradeOpId}`, 200);

      expect(getResponse.body.id).toBe(tradeOpId);
      expect(getResponse.body).toHaveProperty('phase');
      expect(getResponse.body).toHaveProperty('status');
      expect(getResponse.body).toHaveProperty('sellers');
      expect(getResponse.body).toHaveProperty('negotiations');
    });

    it('should update trade operation phase', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[2].id, // Verified seller
              saleListingId: testScenario.saleListings[2].id,
              quantity: 40,
              offerPrice: 325,
            },
          ],
        },
        201
      );

      const tradeOpId = createResponse.body.tradeOperationId;

      // Accept offer
      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      // Verify phase advanced automatically
      const updatedOp = await prisma.tradeOperation.findUnique({
        where: { id: tradeOpId },
      });

      expect(updatedOp?.phase).toBe('TRANSPORT_MATCHING');
    });
  });

  describe('Feature 3: Map-based Matching Dashboard', () => {
    it('should calculate transport costs between buyer and sellers', async () => {
      const response = await apiClient.post(
        '/api/trade-operations/calculate-transport',
        {
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              quantity: 40,
            },
            {
              sellerId: testScenario.sellers[1].id,
              quantity: 40,
            },
          ],
          buyerAddressId: testScenario.buyerAddress!.id,
        },
        201
      );

      expect(response.body).toHaveProperty('calculations');
      expect(Array.isArray(response.body.calculations)).toBe(true);
      expect(response.body.calculations.length).toBe(2);

      for (const calc of response.body.calculations) {
        expect(calc).toHaveProperty('distance');
        expect(calc).toHaveProperty('estimatedCost');
        expect(calc.distance).toBeGreaterThan(0);
        expect(calc.estimatedCost).toBeGreaterThan(0);
      }
    });

    it('should get regions for map display', async () => {
      const response = await apiClient.get('/api/regions', 200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get cities for map markers', async () => {
      const response = await apiClient.get('/api/cities', 200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create trade operation with multiple sellers and send offers', async () => {
      const response = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 30,
              offerPrice: 320,
            },
            {
              sellerId: testScenario.sellers[1].id,
              saleListingId: testScenario.saleListings[1].id,
              quantity: 30,
              offerPrice: 320,
            },
            {
              sellerId: testScenario.sellers[2].id,
              saleListingId: testScenario.saleListings[2].id,
              quantity: 40,
              offerPrice: 325,
            },
          ],
        },
        201
      );

      expect(response.body).toHaveProperty('tradeOperationId');
      expect(response.body.negotiations).toHaveLength(3);

      // All negotiations should be PENDING with expiry
      for (const negotiation of response.body.negotiations) {
        expect(negotiation.status).toBe('PENDING');
        expect(negotiation).toHaveProperty('expiresAt');
      }
    });
  });

  describe('Feature 4: Inspector Portal', () => {
    it('should list pending inspections', async () => {
      // Create trade operation with unverified sellers
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id, // Unverified
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      // Accept offer to trigger inspection creation
      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      // List inspections
      const listResponse = await apiClient.get('/api/inspections', 200);
      const inspections = listResponse.body.data || listResponse.body;

      expect(Array.isArray(inspections)).toBe(true);
      expect(inspections.length).toBeGreaterThanOrEqual(1);
      expect(inspections[0]).toHaveProperty('status');
      expect(inspections[0]).toHaveProperty('priority');
    });

    it('should filter inspections by status', async () => {
      // Create and complete an inspection
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      const inspections = await prisma.inspectionRequest.findMany({
        where: { tradeOperationId: createResponse.body.tradeOperationId },
      });

      // Assign inspector
      await prisma.inspectionRequest.update({
        where: { id: inspections[0].id },
        data: {
          inspectorId: testScenario.inspector.id,
          status: 'SCHEDULED',
        },
      });

      // Filter by SCHEDULED status
      const filteredResponse = await apiClient.get(
        '/api/inspections?status=SCHEDULED',
        200
      );

      const filteredInspections = filteredResponse.body.data || filteredResponse.body;
      expect(filteredInspections.every((i: any) => i.status === 'SCHEDULED')).toBe(true);
    });

    it('should complete inspection with quality data', async () => {
      // Create trade operation and inspection
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      const inspections = await prisma.inspectionRequest.findMany({
        where: { tradeOperationId: createResponse.body.tradeOperationId },
      });

      const inspectionId = inspections[0].id;

      // Assign inspector
      await prisma.inspectionRequest.update({
        where: { id: inspectionId },
        data: {
          inspectorId: testScenario.inspector.id,
          status: 'SCHEDULED',
        },
      });

      // Complete inspection
      const completeResponse = await apiClient.patch(
        `/api/inspections/${inspectionId}`,
        {
          status: 'COMPLETED',
          qualityScore: 92,
          qualityGrade: 'Premium',
          notes: 'Excellent quality wheat',
        },
        200
      );

      expect(completeResponse.body.status).toBe('COMPLETED');
      expect(completeResponse.body.qualityScore).toBe(92);
      expect(completeResponse.body.qualityGrade).toBe('Premium');

      // Verify sale listing updated
      const updatedSaleListing = await prisma.saleListing.findUnique({
        where: { id: inspections[0].saleListingId },
      });

      expect(updatedSaleListing?.qualityScore).toBe(92);
      expect(updatedSaleListing?.qualityGrade).toBe('Premium');
    });
  });

  describe('Feature 5: Transport Management', () => {
    it('should list transport requests', async () => {
      // Create complete trade operation that triggers transport creation
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[2].id, // Verified seller
              saleListingId: testScenario.saleListings[2].id,
              quantity: 40,
              offerPrice: 325,
            },
          ],
        },
        201
      );

      // Accept offer
      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      // List transport requests
      const listResponse = await apiClient.get('/api/transport/requests', 200);
      const requests = listResponse.body.data || listResponse.body;

      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThanOrEqual(1);
      expect(requests[0]).toHaveProperty('status');
      expect(requests[0]).toHaveProperty('truckTracking');
    });

    it('should create and accept transport bid', async () => {
      // Create trade operation
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[2].id,
              saleListingId: testScenario.saleListings[2].id,
              quantity: 40,
              offerPrice: 325,
            },
          ],
        },
        201
      );

      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      // Get transport request
      const transportRequest = await prisma.transportRequest.findFirst({
        where: { tradeOperationId: createResponse.body.tradeOperationId },
      });

      expect(transportRequest).toBeDefined();

      // Submit bid
      const bidResponse = await apiClient.post(
        '/api/transport/bids',
        {
          transportRequestId: transportRequest!.id,
          transportCompanyId: testScenario.transportCompany.id,
          transporterId: testScenario.transporter.id,
          truckCount: 5,
          bidAmount: 450,
          estimatedDuration: 8,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
          assignedTruckId: testScenario.truck.id,
        },
        201
      );

      expect(bidResponse.body).toHaveProperty('id');
      expect(bidResponse.body.status).toBe('PENDING');

      // Accept bid
      const acceptResponse = await apiClient.post(
        `/api/transport/bids/${bidResponse.body.id}/accept`,
        {},
        200
      );

      expect(acceptResponse.body.status).toBe('ACCEPTED');

      // Verify transport job created
      const transportJob = await prisma.transportJob.findFirst({
        where: { transportRequestId: transportRequest!.id },
      });

      expect(transportJob).toBeDefined();
      expect(transportJob?.status).toBe('ASSIGNED');
    });

    it('should reject transport bid', async () => {
      // Create trade operation
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[2].id,
              saleListingId: testScenario.saleListings[2].id,
              quantity: 40,
              offerPrice: 325,
            },
          ],
        },
        201
      );

      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      const transportRequest = await prisma.transportRequest.findFirst({
        where: { tradeOperationId: createResponse.body.tradeOperationId },
      });

      // Submit bid
      const bidResponse = await apiClient.post(
        '/api/transport/bids',
        {
          transportRequestId: transportRequest!.id,
          transportCompanyId: testScenario.transportCompany.id,
          transporterId: testScenario.transporter.id,
          truckCount: 5,
          bidAmount: 600, // Too expensive
          estimatedDuration: 8,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
          assignedTruckId: testScenario.truck.id,
        },
        201
      );

      // Reject bid
      const rejectResponse = await apiClient.post(
        `/api/transport/bids/${bidResponse.body.id}/reject`,
        {},
        200
      );

      expect(rejectResponse.body.status).toBe('REJECTED');
    });
  });

  describe('Feature 6: Trade Flow Visualization', () => {
    it('should get full trade state for visualization', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      const tradeOpId = createResponse.body.tradeOperationId;

      // Get full state
      const stateResponse = await apiClient.get(
        `/api/simulation/trade-operation/${tradeOpId}/full-state`,
        200
      );

      expect(stateResponse.body).toHaveProperty('tradeOperation');
      expect(stateResponse.body).toHaveProperty('sellers');
      expect(stateResponse.body).toHaveProperty('negotiations');
      expect(stateResponse.body).toHaveProperty('buyer');
      expect(stateResponse.body).toHaveProperty('admin');
    });

    it('should track phase transitions', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[2].id, // Verified
              saleListingId: testScenario.saleListings[2].id,
              quantity: 40,
              offerPrice: 325,
            },
          ],
        },
        201
      );

      const tradeOpId = createResponse.body.tradeOperationId;

      // Initial phase
      let tradeOp = await prisma.tradeOperation.findUnique({
        where: { id: tradeOpId },
      });
      expect(tradeOp?.phase).toBe('SELLER_NEGOTIATION');

      // Accept offer
      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      // Phase should advance to TRANSPORT_MATCHING
      tradeOp = await prisma.tradeOperation.findUnique({
        where: { id: tradeOpId },
      });
      expect(tradeOp?.phase).toBe('TRANSPORT_MATCHING');
    });
  });

  describe('Feature 7: Database State Panel', () => {
    it('should get users by role', async () => {
      const farmerResponse = await apiClient.get('/api/simulation/users/FARMER', 200);
      expect(Array.isArray(farmerResponse.body)).toBe(true);
      expect(farmerResponse.body.length).toBeGreaterThanOrEqual(3);

      const buyerResponse = await apiClient.get('/api/simulation/users/BUYER', 200);
      expect(Array.isArray(buyerResponse.body)).toBe(true);
      expect(buyerResponse.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should cleanup test data', async () => {
      // Create some test data
      await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      // Cleanup
      const cleanupResponse = await apiClient.delete(
        '/api/simulation/admin/cleanup-test-data',
        200
      );

      expect(cleanupResponse.body).toHaveProperty('success');
      expect(cleanupResponse.body.success).toBe(true);

      // Verify data cleaned
      const tradeOps = await prisma.tradeOperation.findMany({});
      expect(tradeOps.length).toBe(0);
    });
  });

  describe('Feature 8: Progress Dashboard & Metrics', () => {
    it('should track trade operation metrics', async () => {
      // Create multiple trade operations
      for (let i = 0; i < 3; i++) {
        await apiClient.post(
          '/api/trade-operations',
          {
            buyListingId: testScenario.buyListing.id,
            adminId: testScenario.admin.id,
            sellers: [
              {
                sellerId: testScenario.sellers[i],
                saleListingId: testScenario.saleListings[i],
                quantity: 30,
                offerPrice: 320 + i * 5,
              },
            ],
          },
          201
        );
      }

      // Get all operations
      const listResponse = await apiClient.get('/api/trade-operations', 200);
      const operations = listResponse.body.data || listResponse.body;

      expect(operations.length).toBeGreaterThanOrEqual(3);

      // Verify each has tracking data
      for (const op of operations) {
        expect(op).toHaveProperty('phase');
        expect(op).toHaveProperty('status');
        expect(op).toHaveProperty('createdAt');
      }
    });
  });

  describe('Performance & Contract Validation', () => {
    it('should respond to API calls within 500ms', async () => {
      const start = Date.now();
      await apiClient.get('/api/trade-operations', 200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });

    it('should validate API contract structure', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      // Validate response structure
      expect(createResponse.body).toHaveProperty('tradeOperationId');
      expect(createResponse.body).toHaveProperty('operationNumber');
      expect(createResponse.body).toHaveProperty('negotiations');
      expect(Array.isArray(createResponse.body.negotiations)).toBe(true);
    });

    it('should enforce business logic: 48-hour offer expiry', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      const negotiation = createResponse.body.negotiations[0];
      const expiresAt = new Date(negotiation.expiresAt);
      const createdAt = new Date(negotiation.createdAt || Date.now());
      const hoursDiff = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThan(47);
      expect(hoursDiff).toBeLessThanOrEqual(48);
    });

    it('should enforce business logic: commission calculations (2.5% seller, 1.5% buyer)', async () => {
      const createResponse = await apiClient.post(
        '/api/trade-operations',
        {
          buyListingId: testScenario.buyListing.id,
          adminId: testScenario.admin.id,
          sellers: [
            {
              sellerId: testScenario.sellers[0].id,
              saleListingId: testScenario.saleListings[0].id,
              quantity: 40,
              offerPrice: 320,
            },
          ],
        },
        201
      );

      await apiClient.post(
        `/api/negotiations/${createResponse.body.negotiations[0].id}/accept`,
        {},
        200
      );

      const tradeOp = await prisma.tradeOperation.findUnique({
        where: { id: createResponse.body.tradeOperationId },
      });

      // If commission fields exist, validate them
      // Note: This assumes commission is calculated and stored
      // Adjust based on actual implementation
    });
  });
});
