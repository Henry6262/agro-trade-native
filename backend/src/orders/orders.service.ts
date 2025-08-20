import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement order management methods
  async findAll() {
    return this.prisma.order.findMany({
      include: {
        product: true,
        category: true,
        seller: true,
        buyer: true,
      },
    });
  }
}