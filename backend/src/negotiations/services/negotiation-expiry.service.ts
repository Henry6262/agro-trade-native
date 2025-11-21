import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { NegotiationStatus, SellerStatus } from "@prisma/client";

@Injectable()
export class NegotiationExpiryService {
  private readonly logger = new Logger(NegotiationExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireOverdueNegotiations(): Promise<void> {
    const now = new Date();

    const overdueNegotiations = await this.prisma.offerNegotiation.findMany({
      where: {
        status: {
          in: [NegotiationStatus.PENDING, NegotiationStatus.COUNTERED],
        },
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        tradeSellerId: true,
        tradeOperationId: true,
      },
      take: 200,
    });

    if (!overdueNegotiations.length) {
      return;
    }

    this.logger.log(`Expiring ${overdueNegotiations.length} negotiations`);

    for (const negotiation of overdueNegotiations) {
      await this.prisma.$transaction([
        this.prisma.offerNegotiation.update({
          where: { id: negotiation.id },
          data: {
            status: NegotiationStatus.EXPIRED,
            respondedAt: now,
            concludedAt: now,
          },
        }),
        this.prisma.tradeSeller.update({
          where: { id: negotiation.tradeSellerId },
          data: {
            status: SellerStatus.REJECTED,
          },
        }),
      ]);
    }
  }
}
