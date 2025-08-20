import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement deal management with commission calculation
  async findAll() {
    return this.prisma.deal.findMany({
      include: {
        sellOrder: true,
        seller: true,
        buyer: true,
      },
    });
  }
}