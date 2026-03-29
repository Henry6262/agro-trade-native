import { Injectable, Logger } from '@nestjs/common';
import { TradeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface OrderFilters {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
}

interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrders(filters: OrderFilters) {
    const { userId, page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;

    // TradeOperation is linked to buyer through buyListing.buyerId
    const where = {
      buyListing: { buyerId: userId },
      ...(status && { status: status as TradeStatus }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.tradeOperation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' as const },
        include: {
          buyListing: { include: { product: true, buyer: true } },
          sellers: { include: { saleListing: true } },
        },
      }),
      this.prisma.tradeOperation.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderStats(userId: string): Promise<OrderStats> {
    // TradeOperation is linked to buyer through buyListing.buyerId
    const buyerWhere = { buyListing: { buyerId: userId } };
    const [total, pending, completed, cancelled] = await Promise.all([
      this.prisma.tradeOperation.count({ where: buyerWhere }),
      this.prisma.tradeOperation.count({ where: { ...buyerWhere, status: 'ACTIVE' } }),
      this.prisma.tradeOperation.count({ where: { ...buyerWhere, status: 'COMPLETED' } }),
      this.prisma.tradeOperation.count({ where: { ...buyerWhere, status: 'CANCELLED' } }),
    ]);

    return { total, pending, completed, cancelled };
  }
}
