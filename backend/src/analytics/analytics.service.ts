import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformImpact() {
    const [completedTrades, volumeResult, farmerGroups, regionGroups] = await Promise.all([
      this.prisma.tradeEvent.count({ where: { eventType: "PAYMENT_RELEASED" } }),
      this.prisma.tradeEvent.aggregate({
        _sum: { quantityKg: true },
        where: { quantityKg: { not: null } },
      }),
      this.prisma.tradeEvent.groupBy({
        by: ["actorId"],
        where: { actorRole: "FARMER", actorId: { not: null } },
      }),
      this.prisma.tradeEvent.groupBy({
        by: ["regionCode"],
        where: { regionCode: { not: null } },
      }),
    ]);

    const totalVolumeKg = volumeResult._sum.quantityKg ?? 0;
    const estimatedIncomeGenerated = totalVolumeKg * 0.22; // avg €0.22/kg for agri goods

    return {
      totalTrades: completedTrades,
      totalVolumeKg,
      uniqueFarmers: farmerGroups.length,
      regionsActive: regionGroups.length,
      estimatedIncomeGenerated: Math.round(estimatedIncomeGenerated * 100) / 100,
    };
  }

  async getCommodityBreakdown() {
    const groups = await this.prisma.tradeEvent.groupBy({
      by: ["commodityCode"],
      where: { commodityCode: { not: null } },
      _sum: { quantityKg: true },
      _avg: { pricePerKg: true },
      _count: { id: true },
      orderBy: { _sum: { quantityKg: "desc" } },
      take: 10,
    });

    return groups.map((g) => ({
      commodityCode: g.commodityCode,
      totalVolumeKg: g._sum.quantityKg ?? 0,
      tradeCount: g._count.id,
      avgPricePerKg: g._avg.pricePerKg ?? 0,
    }));
  }

  async getRegionalHeatmap() {
    const groups = await this.prisma.tradeEvent.groupBy({
      by: ["regionCode"],
      where: { regionCode: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const completedByRegion = await this.prisma.tradeEvent.groupBy({
      by: ["regionCode"],
      where: { regionCode: { not: null }, eventType: "PAYMENT_RELEASED" },
      _count: { id: true },
    });

    const completedMap = new Map(completedByRegion.map((r) => [r.regionCode, r._count.id]));

    return groups.map((g) => ({
      regionCode: g.regionCode,
      eventCount: g._count.id,
      tradeCount: completedMap.get(g.regionCode) ?? 0,
    }));
  }

  async getTimeline(period: string = "30d") {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await this.prisma.tradeEvent.findMany({
      where: { timestamp: { gte: since } },
      select: { timestamp: true, eventType: true },
      orderBy: { timestamp: "asc" },
    });

    // Group by date
    const byDate = new Map<string, { eventCount: number; completedTrades: number }>();
    for (const ev of events) {
      const date = ev.timestamp.toISOString().split("T")[0];
      if (!byDate.has(date)) byDate.set(date, { eventCount: 0, completedTrades: 0 });
      const entry = byDate.get(date)!;
      entry.eventCount++;
      if (ev.eventType === "PAYMENT_RELEASED") entry.completedTrades++;
    }

    return Array.from(byDate.entries()).map(([date, counts]) => ({ date, ...counts }));
  }
}
