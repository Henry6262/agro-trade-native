import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfitCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma-backed calculation restored from the original trade-profit service.
   * Agreed seller quantities take precedence for partially sourced trades.
   */
  async calculateProfit(tradeOperationId: string) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: true,
        sellers: true,
        transportCostCalculations: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!trade) {
      throw new NotFoundException('Trade operation not found');
    }

    const agreedSellers = trade.sellers.filter(
      (seller) => seller.agreedQuantity != null && seller.agreedPrice != null,
    );
    const purchaseBreakdown = agreedSellers.map((seller) => {
      const quantity = Number(seller.agreedQuantity);
      const price = Number(seller.agreedPrice);
      return {
        sellerId: seller.sellerId,
        quantity,
        price,
        totalCost: quantity * price,
      };
    });
    const purchaseCost = purchaseBreakdown.reduce((sum, seller) => sum + seller.totalCost, 0);
    const agreedQuantity = purchaseBreakdown.reduce((sum, seller) => sum + seller.quantity, 0);
    const quantity = agreedSellers.length > 0 ? agreedQuantity : Number(trade.buyListing.quantity);
    const sellingPrice = Number(trade.sellingPrice ?? 0);
    const totalRevenue = sellingPrice * quantity;
    const estimatedTransportCost = Number(trade.estimatedTransportCost ?? 0);
    const actualTransportCost =
      trade.actualTransportCost == null ? undefined : Number(trade.actualTransportCost);
    const transportCost = actualTransportCost ?? estimatedTransportCost;
    const grossProfit = totalRevenue - purchaseCost;
    const netProfit = grossProfit - transportCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const latestTransportCalculation = trade.transportCostCalculations[0];

    return {
      tradeOperationId,
      revenue: {
        sellingPrice,
        quantity,
        totalRevenue,
      },
      costs: {
        purchases: {
          totalCost: purchaseCost,
          avgPrice: quantity > 0 ? purchaseCost / quantity : 0,
          breakdown: purchaseBreakdown,
        },
        transport: {
          estimatedCost: estimatedTransportCost,
          actualCost: actualTransportCost,
          distance: Number(trade.totalDistanceKm ?? latestTransportCalculation?.totalDistance ?? 0),
          ratePerKm: Number(latestTransportCalculation?.baseRatePerKm ?? 0.15),
        },
        totalCosts: purchaseCost + transportCost,
      },
      profit: {
        grossProfit,
        netProfit,
        profitMargin,
        currency: trade.currency || 'EUR',
      },
      status: {
        isEstimated: trade.phase !== 'COMPLETED',
        lastUpdated: trade.updatedAt,
      },
    };
  }
}
