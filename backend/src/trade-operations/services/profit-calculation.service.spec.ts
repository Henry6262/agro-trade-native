import { NotFoundException } from '@nestjs/common';
import { ProfitCalculationService } from './profit-calculation.service';
import { PrismaService } from '../../prisma/prisma.service';

const makeTrade = (overrides: Record<string, unknown> = {}) => ({
  id: 'trade-1',
  buyListing: { quantity: 100 },
  sellers: [],
  transportCostCalculations: [],
  sellingPrice: 400,
  totalRevenue: 40000,
  estimatedTransportCost: 100,
  actualTransportCost: null,
  totalDistanceKm: null,
  currency: 'EUR',
  phase: 'SELLER_NEGOTIATION',
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  ...overrides,
});

describe('ProfitCalculationService', () => {
  let findUnique: jest.Mock;
  let service: ProfitCalculationService;

  beforeEach(() => {
    findUnique = jest.fn();
    service = new ProfitCalculationService({
      tradeOperation: { findUnique },
    } as unknown as PrismaService);
  });

  it('aggregates only sellers with both agreed quantity and agreed price', async () => {
    findUnique.mockResolvedValue(
      makeTrade({
        // Deliberately stale full-listing revenue: the calculation must use the
        // agreed quantity instead of trusting this persisted aggregate.
        totalRevenue: 40000,
        sellers: [
          {
            sellerId: 'accepted-seller',
            status: 'ACCEPTED',
            requestedQuantity: 40,
            agreedQuantity: 40,
            agreedPrice: 300,
          },
          {
            sellerId: 'pending-seller',
            status: 'NEGOTIATING',
            requestedQuantity: 60,
            agreedQuantity: null,
            agreedPrice: null,
          },
        ],
      }),
    );

    const result = await service.calculateProfit('trade-1');

    expect(result.revenue).toEqual({
      sellingPrice: 400,
      quantity: 40,
      totalRevenue: 16000,
    });
    expect(result.costs.purchases).toEqual({
      totalCost: 12000,
      avgPrice: 300,
      breakdown: [
        {
          sellerId: 'accepted-seller',
          quantity: 40,
          price: 300,
          totalCost: 12000,
        },
      ],
    });
    expect(result.profit.netProfit).toBe(3900);
  });

  it('uses the buy-listing quantity only when no seller has agreed terms', async () => {
    findUnique.mockResolvedValue(
      makeTrade({
        totalRevenue: 1,
        sellers: [
          {
            sellerId: 'pending-seller',
            status: 'NEGOTIATING',
            requestedQuantity: 60,
            agreedQuantity: null,
            agreedPrice: null,
          },
        ],
      }),
    );

    const result = await service.calculateProfit('trade-1');

    expect(result.revenue).toEqual({
      sellingPrice: 400,
      quantity: 100,
      totalRevenue: 40000,
    });
    expect(result.costs.purchases).toEqual({
      totalCost: 0,
      avgPrice: 0,
      breakdown: [],
    });
  });

  it('throws for an unknown trade operation', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.calculateProfit('missing')).rejects.toThrow(NotFoundException);
  });
});
