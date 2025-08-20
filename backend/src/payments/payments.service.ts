import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement Stripe payment integration
  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        deal: true,
        payer: true,
      },
    });
  }
}