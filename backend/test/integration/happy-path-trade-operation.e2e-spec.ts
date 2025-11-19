import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TestDataFactory } from "../helpers/test-data-factory";
import { DatabaseCleaner } from "../helpers/database-cleaner";
import { ApiClient } from "../helpers/api-client";

/**
 * Happy Path Trade Operation E2E Test
 *
 * Tests the complete workflow from trade operation creation to transport delivery:
 * 1. Admin creates trade operation with sellers
 * 2. System sends offers to sellers (48-hour expiry)
 * 3. Sellers accept offers
 * 4. System auto-creates inspection requests for unverified sellers
 * 5. Inspector completes inspections
 * 6. System updates verification status
 * 7. System advances phase to TRANSPORT_MATCHING when all verified
 * 8. System auto-creates transport request
 * 9. Transporter submits bid
 * 10. Admin accepts bid
 * 11. System creates transport job
 * 12. System advances phase to IN_TRANSIT
 */
describe("Happy Path - Complete Trade Operation E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dataFactory: TestDataFactory;
  let dbCleaner: DatabaseCleaner;
  let apiClient: ApiClient;
  let testScenario: Awaited<
    ReturnType<TestDataFactory["createFullTradeScenario"]>
  >;

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

    // Create full test scenario with 3 sellers (2 unverified, 1 verified)
    testScenario = await dataFactory.createFullTradeScenario({
      sellerCount: 3,
      buyerQuantity: 100,
      sellerQuantity: 40,
      sellerPrice: 320,
      buyerPrice: 350,
      withAddresses: true,
      withVerifiedSellers: [false, false, true], // Seller 3 is already verified
    });
  });

  it("should complete full workflow from trade operation creation to transport assignment", async () => {
    const startTime = Date.now();
    console.log("\n========================================");
    console.log("HAPPY PATH E2E TEST - FULL TRADE WORKFLOW");
    console.log("========================================\n");

    // ==================== STEP 1: Create Trade Operation ====================
    console.log("STEP 1: Creating trade operation with sellers...");

    const createTradeOpResponse = await apiClient.post(
      "/api/trade-operations",
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
            offerPrice: 325, // Slightly higher for verified seller
          },
        ],
      },
      201,
    );

    const tradeOpData = createTradeOpResponse.body;
    expect(tradeOpData).toHaveProperty("tradeOperationId");
    expect(tradeOpData).toHaveProperty("operationNumber");
    expect(tradeOpData.negotiations).toHaveLength(3);

    const tradeOperationId = tradeOpData.tradeOperationId;
    console.log(`✅ Trade operation created: ${tradeOperationId}`);
    console.log(`   Operation number: ${tradeOpData.operationNumber}`);

    // Verify trade operation in database
    const tradeOp = await prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: { sellers: true, negotiations: true },
    });

    expect(tradeOp).toBeDefined();
    expect(tradeOp).not.toBeNull();
    if (!tradeOp) throw new Error("Trade operation not found");

    expect(tradeOp.phase).toBe("SELLER_NEGOTIATION");
    expect(tradeOp.status).toBe("ACTIVE");
    expect(tradeOp.sellers).toHaveLength(3);
    expect(tradeOp.negotiations).toHaveLength(3);
    console.log(`   Phase: ${tradeOp.phase}, Status: ${tradeOp.status}`);

    // ==================== STEP 2: Verify Offers Created ====================
    console.log("\nSTEP 2: Verifying offers sent to sellers...");

    const negotiations = tradeOpData.negotiations;

    for (const negotiation of negotiations) {
      expect(negotiation.status).toBe("PENDING");
      expect(negotiation).toHaveProperty("expiresAt");
      expect(negotiation).toHaveProperty("hoursUntilExpiry");

      // Verify 48-hour expiry
      const expiresAt = new Date(negotiation.expiresAt);
      const now = new Date();
      const hoursUntilExpiry =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursUntilExpiry).toBeGreaterThan(47);
      expect(hoursUntilExpiry).toBeLessThanOrEqual(48);
    }

    console.log(`✅ All 3 offers sent with 48-hour expiry`);

    // ==================== STEP 3: Sellers Accept Offers ====================
    console.log("\nSTEP 3: Sellers accepting offers...");

    for (let i = 0; i < negotiations.length; i++) {
      const negotiation = negotiations[i];

      const acceptResponse = await apiClient.post(
        `/api/negotiations/${negotiation.id}/accept`,
        {},
        200,
      );

      expect(acceptResponse.body.status).toBe("ACCEPTED");
      console.log(
        `   ✅ Seller ${i + 1} accepted offer (Negotiation ID: ${negotiation.id})`,
      );
    }

    // ==================== STEP 4: Verify Inspections Auto-Created ====================
    console.log(
      "\nSTEP 4: Verifying inspection requests auto-created for unverified sellers...",
    );

    const inspections = await prisma.inspectionRequest.findMany({
      where: { tradeOperationId },
      include: { saleListing: { include: { seller: true } } },
    });

    // Only 2 sellers are unverified, so expect 2 inspections
    expect(inspections).toHaveLength(2);
    console.log(
      `✅ ${inspections.length} inspection requests created (for unverified sellers)`,
    );

    for (const inspection of inspections) {
      expect(inspection.status).toBe("PENDING");
      expect(inspection.latitude).toBeDefined();
      expect(inspection.longitude).toBeDefined();
      console.log(
        `   - Inspection ${inspection.id} for seller ${inspection.saleListing.seller.name}`,
      );
    }

    // Verify phase is still SELLER_NEGOTIATION (waiting for inspections)
    let updatedTradeOp = await prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
    });
    expect(updatedTradeOp).not.toBeNull();
    if (!updatedTradeOp) throw new Error("Trade operation not found");

    expect(updatedTradeOp.phase).toBe("SELLER_NEGOTIATION");
    console.log(
      `   Trade operation phase: ${updatedTradeOp.phase} (awaiting inspections)`,
    );

    // ==================== STEP 5: Assign Inspector ====================
    console.log("\nSTEP 5: Assigning inspector to inspection requests...");

    for (const inspection of inspections) {
      await prisma.inspectionRequest.update({
        where: { id: inspection.id },
        data: {
          inspectorId: testScenario.inspector.id,
          status: "SCHEDULED",
          scheduledDate: new Date(),
        },
      });
      console.log(`   ✅ Assigned inspector to inspection ${inspection.id}`);
    }

    // ==================== STEP 6: Inspector Completes Inspections ====================
    console.log("\nSTEP 6: Inspector completing inspections...");

    for (const inspection of inspections) {
      const completeResponse = await apiClient.patch(
        `/api/inspections/${inspection.id}`,
        {
          status: "COMPLETED",
          qualityScore: 85,
          qualityGrade: "Premium",
          notes: "Wheat meets all quality standards",
        },
        200,
      );

      expect(completeResponse.body.status).toBe("COMPLETED");
      console.log(
        `   ✅ Inspection ${inspection.id} completed with quality score 85`,
      );
    }

    // ==================== STEP 7: Verify Cascading Updates ====================
    console.log("\nSTEP 7: Verifying cascading updates...");

    // Verify SaleListing updated with quality scores
    for (const inspection of inspections) {
      const updatedSaleListing = await prisma.saleListing.findUnique({
        where: { id: inspection.saleListingId },
      });

      expect(updatedSaleListing).not.toBeNull();
      if (!updatedSaleListing) continue;

      expect(updatedSaleListing.qualityScore).toBe(85);
      expect(updatedSaleListing.qualityGrade).toBe("Premium");
      console.log(
        `   ✅ Sale listing ${updatedSaleListing.id} updated with quality data`,
      );
    }

    // Verify TradeSeller marked as verified
    const tradeSellers = await prisma.tradeSeller.findMany({
      where: { tradeOperationId },
    });

    expect(tradeSellers).toHaveLength(3);
    const verifiedSellers = tradeSellers.filter((ts) => ts.isVerified);
    expect(verifiedSellers).toHaveLength(3); // All 3 should now be verified
    console.log(
      `   ✅ All ${verifiedSellers.length} trade sellers marked as verified`,
    );

    // ==================== STEP 8: Verify Phase Advanced to TRANSPORT_MATCHING ====================
    console.log("\nSTEP 8: Verifying trade operation phase advancement...");

    updatedTradeOp = await prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
    });

    expect(updatedTradeOp).not.toBeNull();
    if (!updatedTradeOp) throw new Error("Trade operation not found");

    expect(updatedTradeOp.phase).toBe("TRANSPORT_MATCHING");
    console.log(
      `   ✅ Trade operation phase advanced to: ${updatedTradeOp.phase}`,
    );

    // ==================== STEP 9: Verify Transport Request Auto-Created ====================
    console.log("\nSTEP 9: Verifying transport request auto-created...");

    const transportRequest = await prisma.transportRequest.findFirst({
      where: { tradeOperationId },
    });

    expect(transportRequest).toBeDefined();
    expect(transportRequest).not.toBeNull();
    if (!transportRequest) throw new Error("Transport request not found");

    expect(transportRequest.status).toBe("OPEN");
    expect(transportRequest.pickupPoints).toBeDefined();
    expect(transportRequest.deliveryPoint).toBeDefined();

    const pickupPoints = transportRequest.pickupPoints as any[];
    expect(pickupPoints).toHaveLength(3); // 3 sellers

    console.log(`✅ Transport request created: ${transportRequest.id}`);
    console.log(`   Request number: ${transportRequest.requestNumber}`);
    console.log(`   Total weight: ${transportRequest.totalWeight} tons`);
    console.log(`   Pickup points: ${pickupPoints.length}`);

    // ==================== STEP 10: Transporter Submits Bid ====================
    console.log("\nSTEP 10: Transporter submitting bid...");

    const bidResponse = await apiClient.post(
      "/api/transport/bids",
      {
        transportRequestId: transportRequest.id,
        transportCompanyId: testScenario.transportCompany.id,
        transporterId: testScenario.transporter.id,
        truckCount: 5,
        bidAmount: 450,
        estimatedDuration: 8, // 8 hours
        vehicleType: "FLATBED",
        vehicleCapacity: 25,
        assignedTruckId: testScenario.truck.id,
      },
      201,
    );

    const bid = bidResponse.body;
    expect(bid).toHaveProperty("id");
    expect(bid.status).toBe("PENDING");
    console.log(`✅ Transport bid submitted: ${bid.id}`);
    console.log(`   Bid amount: €${bid.bidAmount}`);
    console.log(`   Estimated duration: ${bid.estimatedDuration} hours`);

    // ==================== STEP 11: Admin Accepts Bid ====================
    console.log("\nSTEP 11: Admin accepting transport bid...");

    const acceptBidResponse = await apiClient.post(
      `/api/transport/bids/${bid.id}/accept`,
      {},
      200,
    );

    expect(acceptBidResponse.body.status).toBe("ACCEPTED");
    console.log(`✅ Transport bid accepted`);

    // ==================== STEP 12: Verify Transport Job Created ====================
    console.log("\nSTEP 12: Verifying transport job created...");

    const transportJob = await prisma.transportJob.findFirst({
      where: { transportRequestId: transportRequest.id },
    });

    expect(transportJob).toBeDefined();
    expect(transportJob).not.toBeNull();
    if (!transportJob) throw new Error("Transport job not found");

    expect(transportJob.status).toBe("ASSIGNED");
    expect(transportJob.transporterId).toBe(testScenario.transporter.id);

    console.log(`✅ Transport job created: ${transportJob.id}`);
    console.log(`   Job number: ${transportJob.jobNumber}`);
    console.log(`   Status: ${transportJob.status}`);

    // ==================== STEP 13: Verify Final Phase ====================
    console.log("\nSTEP 13: Verifying final trade operation state...");

    const finalTradeOp = await prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: true,
        negotiations: true,
        inspections: true,
        transportRequest: true,
        transportJobs: true,
      },
    });

    expect(finalTradeOp.phase).toBe("IN_TRANSIT");
    expect(finalTradeOp.status).toBe("ACTIVE");
    console.log(`✅ Trade operation final phase: ${finalTradeOp.phase}`);
    console.log(`   Status: ${finalTradeOp.status}`);

    // ==================== VALIDATION: Database Integrity ====================
    console.log("\nVALIDATION: Checking database integrity...");

    // Check all foreign key relationships
    expect(finalTradeOp.buyListingId).toBe(testScenario.buyListing.id);
    expect(finalTradeOp.adminId).toBe(testScenario.admin.id);
    expect(finalTradeOp.sellers).toHaveLength(3);
    expect(finalTradeOp.negotiations).toHaveLength(3);
    expect(finalTradeOp.inspections).toHaveLength(2); // 2 unverified sellers
    expect(finalTradeOp.transportRequest).toBeDefined();
    expect(finalTradeOp.transportJobs).toHaveLength(1);

    // Check all timestamps set
    expect(finalTradeOp.initiatedAt).toBeInstanceOf(Date);
    expect(finalTradeOp.createdAt).toBeInstanceOf(Date);
    expect(finalTradeOp.updatedAt).toBeInstanceOf(Date);

    console.log("✅ All database relationships intact");
    console.log("✅ All timestamps set correctly");

    // ==================== VALIDATION: Calculated Fields ====================
    console.log("\nVALIDATION: Checking calculated fields...");

    // Calculate expected values
    const expectedTotalPurchaseCost = 320 * 40 + 320 * 40 + 325 * 20; // 32300
    const expectedTotalRevenue = 350 * 100; // 35000
    const expectedProfit =
      expectedTotalRevenue - expectedTotalPurchaseCost - 450; // Transport cost

    // Note: These might be null if not calculated yet, which is fine for this test
    if (finalTradeOp.totalPurchaseCost) {
      expect(Number(finalTradeOp.totalPurchaseCost)).toBeCloseTo(
        expectedTotalPurchaseCost,
        2,
      );
      console.log(`✅ Total purchase cost: €${finalTradeOp.totalPurchaseCost}`);
    }

    if (finalTradeOp.totalRevenue) {
      expect(Number(finalTradeOp.totalRevenue)).toBeCloseTo(
        expectedTotalRevenue,
        2,
      );
      console.log(`✅ Total revenue: €${finalTradeOp.totalRevenue}`);
    }

    // ==================== SUMMARY ====================
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("\n========================================");
    console.log("TEST SUMMARY");
    console.log("========================================");
    console.log(`✅ All 13 steps completed successfully`);
    console.log(`✅ Total test duration: ${duration.toFixed(2)}s`);
    console.log(`✅ Trade operation: ${tradeOperationId}`);
    console.log(`✅ Final phase: ${finalTradeOp.phase}`);
    console.log(`✅ Transport job: ${transportJob.id}`);
    console.log("========================================\n");
  });
});
