/**
 * Unit tests for OrdersService.
 *
 * Zero external dependencies — no Postgres, no AppModule, no PrismaModule.
 * All DB calls are intercepted by mockPrismaService.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../prisma/__mocks__/prisma.service';
import {
  tradeOperationFactory,
  buyListingFactory,
  productFactory,
} from '../common/test-factories';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    // Ensure mock state is clean between tests
    jest.clearAllMocks();
  });

  // ─── getOrders ──────────────────────────────────────────────────────────────

  describe('getOrders', () => {
    it('returns paginated orders for a buyer', async () => {
      const userId = 'buyer-user-1';
      const ops = [
        tradeOperationFactory({
          buyListing: buyListingFactory({ buyerId: userId }),
        }),
        tradeOperationFactory({
          buyListing: buyListingFactory({ buyerId: userId }),
        }),
      ];

      (mockPrismaService.tradeOperation.findMany as jest.Mock).mockResolvedValue(ops);
      (mockPrismaService.tradeOperation.count as jest.Mock).mockResolvedValue(2);

      const result = await service.getOrders({ userId, page: 1, limit: 20 });

      expect(result.orders).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(mockPrismaService.tradeOperation.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.tradeOperation.count).toHaveBeenCalledTimes(1);
    });

    it('applies status filter when provided', async () => {
      const userId = 'buyer-user-2';

      (mockPrismaService.tradeOperation.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.tradeOperation.count as jest.Mock).mockResolvedValue(0);

      await service.getOrders({ userId, status: 'COMPLETED' });

      const callArgs = (
        mockPrismaService.tradeOperation.findMany as jest.Mock
      ).mock.calls[0][0];

      expect(callArgs.where).toMatchObject({ status: 'COMPLETED' });
    });

    it('returns empty orders with correct pagination shape', async () => {
      (mockPrismaService.tradeOperation.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrismaService.tradeOperation.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getOrders({ userId: 'ghost' });

      expect(result.orders).toEqual([]);
      expect(result.pagination).toMatchObject({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });
  });

  // ─── getOrderStats ───────────────────────────────────────────────────────────

  describe('getOrderStats', () => {
    it('returns correct stats aggregation', async () => {
      (mockPrismaService.tradeOperation.count as jest.Mock)
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(4)   // pending / ACTIVE
        .mockResolvedValueOnce(5)   // completed
        .mockResolvedValueOnce(1);  // cancelled

      const stats = await service.getOrderStats('buyer-user-3');

      expect(stats).toEqual({
        total: 10,
        pending: 4,
        completed: 5,
        cancelled: 1,
      });
      // All 4 counts run in parallel — count called 4 times total
      expect(mockPrismaService.tradeOperation.count).toHaveBeenCalledTimes(4);
    });

    it('returns all-zero stats for a new user', async () => {
      (mockPrismaService.tradeOperation.count as jest.Mock).mockResolvedValue(0);

      const stats = await service.getOrderStats('new-user');

      expect(stats).toEqual({ total: 0, pending: 0, completed: 0, cancelled: 0 });
    });
  });
});
