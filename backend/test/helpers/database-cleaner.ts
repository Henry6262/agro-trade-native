import { PrismaService } from '../../src/prisma/prisma.service';

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
      'offerRound',
      'tradeNote',
      'tradeStateHistory',
      'profitEstimation',
      'transportCostCalculation',
      'transportJob',
      'transportBid',
      'transportRequest',
      'inspectionRequest',
      'offerNegotiation',
      'tradeSeller',
      'tradeTransporter',
      'tradeOperation',

      // Marketplace
      'offer',
      'listingSpec',
      'saleListing',
      'buyListing',

      // Transport & Drivers
      'driverDocument',
      'companyDocument',
      'driver',
      'truck',
      'companyAdmin',
      'transportCompany',

      // Location & Products
      'regionalPrice',
      'address',
      'city',
      'region',
      'productSpecTemplate',
      'specificationType',
      'product',

      // Company & Users (last)
      'company',
      'user',

      // Settings
      'transportCostSettings',
    ];

    for (const table of tables) {
      try {
        await (this.prisma as any)[table].deleteMany({});
      } catch (error) {
        // Silently ignore errors (table might not exist or be empty)
        // In production tests, we might want to log these
      }
    }
  }

  /**
   * Clean only trade operation data (preserves users, products, etc.)
   */
  async cleanTradeOperations() {
    const tables = [
      'offerRound',
      'tradeNote',
      'tradeStateHistory',
      'profitEstimation',
      'transportCostCalculation',
      'transportJob',
      'transportBid',
      'transportRequest',
      'inspectionRequest',
      'offerNegotiation',
      'tradeSeller',
      'tradeTransporter',
      'tradeOperation',
    ];

    for (const table of tables) {
      try {
        await (this.prisma as any)[table].deleteMany({});
      } catch (error) {
        // Silently ignore
      }
    }
  }

  /**
   * Clean only marketplace listings
   */
  async cleanMarketplace() {
    const tables = ['offer', 'listingSpec', 'saleListing', 'buyListing'];

    for (const table of tables) {
      try {
        await (this.prisma as any)[table].deleteMany({});
      } catch (error) {
        // Silently ignore
      }
    }
  }

  /**
   * Clean only transport related data
   */
  async cleanTransport() {
    const tables = [
      'transportJob',
      'transportBid',
      'transportRequest',
      'driverDocument',
      'driver',
      'truck',
    ];

    for (const table of tables) {
      try {
        await (this.prisma as any)[table].deleteMany({});
      } catch (error) {
        // Silently ignore
      }
    }
  }

  /**
   * Clean only inspection data
   */
  async cleanInspections() {
    try {
      await this.prisma.inspectionRequest.deleteMany({});
    } catch (error) {
      // Silently ignore
    }
  }

  /**
   * Clean only negotiation data
   */
  async cleanNegotiations() {
    const tables = ['offerRound', 'offerNegotiation'];

    for (const table of tables) {
      try {
        await (this.prisma as any)[table].deleteMany({});
      } catch (error) {
        // Silently ignore
      }
    }
  }

  /**
   * Reset auto-increment sequences (if needed)
   */
  async resetSequences() {
    // PostgreSQL specific - reset sequences for tables with auto-increment IDs
    // This ensures predictable IDs in tests
    try {
      await this.prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('"users"', 'id'), 1, false);
      `);
    } catch (error) {
      // Silently ignore - not all tables use sequences
    }
  }

  /**
   * Verify database is clean
   */
  async verifyClean(): Promise<{
    isClean: boolean;
    remainingRecords: Record<string, number>;
  }> {
    const tables = [
      'tradeOperation',
      'tradeSeller',
      'offerNegotiation',
      'inspectionRequest',
      'transportRequest',
      'transportBid',
      'transportJob',
    ];

    const remainingRecords: Record<string, number> = {};
    let isClean = true;

    for (const table of tables) {
      try {
        const count = await (this.prisma as any)[table].count();
        if (count > 0) {
          remainingRecords[table] = count;
          isClean = false;
        }
      } catch (error) {
        // Table doesn't exist
      }
    }

    return { isClean, remainingRecords };
  }

  /**
   * Clean specific trade operation and all related data
   */
  async cleanTradeOperationById(tradeOperationId: string) {
    // Delete in order of dependencies
    await this.prisma.offerRound.deleteMany({
      where: {
        negotiation: {
          tradeOperationId,
        },
      },
    });

    await this.prisma.offerNegotiation.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.inspectionRequest.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.transportJob.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.transportBid.deleteMany({
      where: { tradeOperationId },
    });

    await this.prisma.transportRequest.deleteMany({
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
