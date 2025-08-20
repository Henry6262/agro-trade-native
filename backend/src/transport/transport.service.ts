import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement transport and bidding system
  async findAllJobs() {
    return this.prisma.transportJob.findMany({
      include: {
        deal: true,
        bids: true,
        createdBy: true,
        assignedTransporter: true,
      },
    });
  }
}