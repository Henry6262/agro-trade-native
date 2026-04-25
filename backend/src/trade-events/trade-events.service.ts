import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTradeEventDto } from "./dto/create-trade-event.dto";

@Injectable()
export class TradeEventsService {
  private readonly logger = new Logger(TradeEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(data: CreateTradeEventDto): Promise<void> {
    try {
      const raw = data as CreateTradeEventDto & { message?: string };
      const { metadata, message, ...rest } = raw;
      const nextMetadata =
        message !== undefined
          ? {
              ...(metadata ?? {}),
              message,
            }
          : metadata;

      await this.prisma.tradeEvent.create({
        data: {
          ...rest,
          metadata: nextMetadata,
        } as any,
      });
    } catch (error) {
      // Never throw - event recording should not break main flows
      this.logger.error(`Failed to record trade event: ${error.message}`, error);
    }
  }

  async getByTrade(tradeOperationId: string) {
    return this.prisma.tradeEvent.findMany({
      where: { tradeOperationId },
      orderBy: { timestamp: "asc" },
    });
  }

  async getPlatformStats() {
    const [totalEvents, completedTrades, totalVolumeResult, farmerIds, regionCodes] =
      await Promise.all([
        this.prisma.tradeEvent.count(),
        this.prisma.tradeEvent.count({ where: { eventType: "PAYMENT_RELEASED" } }),
        this.prisma.tradeEvent.aggregate({ _sum: { quantityKg: true } }),
        this.prisma.tradeEvent
          .groupBy({ by: ["actorId"], where: { actorRole: "FARMER", actorId: { not: null } } })
          .then((r) => r.length),
        this.prisma.tradeEvent
          .groupBy({ by: ["regionCode"], where: { regionCode: { not: null } } })
          .then((r) => r.length),
      ]);

    return {
      totalEvents,
      completedTrades,
      totalVolumeKg: totalVolumeResult._sum.quantityKg ?? 0,
      uniqueFarmers: farmerIds,
      regionsActive: regionCodes,
    };
  }
}
