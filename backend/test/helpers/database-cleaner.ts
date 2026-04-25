import { PrismaService } from "../../src/prisma/prisma.service";

/**
 * Database Cleaner
 * Utility to clean database between tests while respecting foreign key constraints
 */
export class DatabaseCleaner {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clean all test data from the database in correct order
   */
  async cleanAll() {
    // Order matters! Must delete children before parents to avoid FK violations
    const tables = [
      // Trade operation related (deepest level first)
      "offerRound",
      "tradeNote",
      "tradeEvent",
      "tradeStateHistory",
      "investmentPosition",
      "userInvestmentPreference",
      "profitEstimation",
      "transportCostCalculation",
      "transportJob",
      "transportBid",
      "transportRequest",
      "inspectionRequest",
      "offerNegotiation",
      "tradeSeller",
      "tradeTransporter",
      "tradeOperation",

      // Marketplace
      "offer",
      "listingSpec",
      "saleListing",
      "buyListing",

      // Transport & Drivers
      "driverDocument",
      "companyDocument",
      "driver",
      "truck",
      "companyAdmin",
      "transportCompany",
      "company",

      // Location & Products
      "regionalPrice",
      "address",
      "city",
      "region",
      "productSpecTemplate",
      "specificationType",
      "product",

      // User & System
      "phoneOtp",
      "user",
      "transportCostSettings",
    ];

    for (const table of tables) {
      try {
        if ((this.prisma as any)[table]) {
          await (this.prisma as any)[table].deleteMany({});
        }
      } catch (error) {
        // console.error(`Failed to clean table ${table}:`, error.message);
      }
    }
  }

  /**
   * Delete specific trade operation and all its dependencies
   */
  async cleanTradeOperation(tradeOperationId: string) {
    await this.prisma.tradeEvent.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.tradeNote.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.tradeStateHistory.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.offerNegotiation.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.tradeSeller.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.tradeTransporter.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.tradeOperation.delete({
      where: { id: tradeOperationId },
    });
  }
}
