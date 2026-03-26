import { Injectable, Logger } from '@nestjs/common';
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

    const where = {
      buyerId: userId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.tradeOperation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' as const },
        include: {
          offer: { include: { product: true } },
          seller: true,
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
    const [total, pending, completed, cancelled] = await Promise.all([
      this.prisma.tradeOperation.count({ where: { buyerId: userId } }),
      this.prisma.tradeOperation.count({ where: { buyerId: userId, status: 'PENDING' } }),
      this.prisma.tradeOperation.count({ where: { buyerId: userId, status: 'COMPLETED' } }),
      this.prisma.tradeOperation.count({ where: { buyerId: userId, status: 'CANCELLED' } }),
    ]);

    return { total, pending, completed, cancelled };
  }
}
