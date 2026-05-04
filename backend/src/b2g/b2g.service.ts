import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

export interface AggregatedTradeData {
  reportingPeriod: string;
  region: string;
  commodityType: string;
  totalVolumeKg: number;
  avgPricePerKg: number;
  activeTrades: number;
  completedTrades: number;
  disputedTrades: number;
  avgInspectionScore: number;
  transportDistanceAvgKm: number;
}

@Injectable()
export class B2gService {
  private readonly logger = new Logger(B2gService.name);
  private readonly apiKeys: Set<string> = new Set();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const keys = this.config.get<string>("B2G_API_KEYS") || "";
    keys.split(",").forEach((k) => {
      if (k.trim()) this.apiKeys.add(k.trim());
    });
  }

  validateApiKey(key: string): boolean {
    return this.apiKeys.has(key);
  }

  /**
   * Aggregate anonymized trade data for public-sector reporting.
   * Compliant with EU Data Act Art. 14 — voluntary B2G data sharing endpoint.
   */
  async getAggregatedTradeData(params: {
    startDate: Date;
    endDate: Date;
    region?: string;
    commodityType?: string;
  }): Promise<AggregatedTradeData[]> {
    const { startDate, endDate, region, commodityType } = params;

    const trades = await this.prisma.tradeOperation.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        phase: { in: ["IN_TRANSIT", "DELIVERED", "COMPLETED"] },
      },
      include: {
        buyListing: { include: { product: true } },
        sellers: { include: { saleListing: { include: { product: true } } } },
        inspections: true,
        transportJobs: { include: { transportRequest: true } },
      },
    });

    const grouped = new Map<string, AggregatedTradeData>();

    for (const trade of trades) {
      const product = trade.buyListing?.product || trade.sellers[0]?.saleListing?.product;
      if (!product) continue;
      if (commodityType && product.category !== commodityType) continue;

      const deliveryRegion = trade.buyListing?.deliveryAddressId || "unknown";
      if (region && deliveryRegion !== region) continue;

      const key = `${deliveryRegion}|${product.category || "unknown"}`;
      const period = `${startDate.toISOString().slice(0, 7)}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          reportingPeriod: period,
          region: deliveryRegion,
          commodityType: product.category || "unknown",
          totalVolumeKg: 0,
          avgPricePerKg: 0,
          activeTrades: 0,
          completedTrades: 0,
          disputedTrades: 0,
          avgInspectionScore: 0,
          transportDistanceAvgKm: 0,
        });
      }

      const agg = grouped.get(key)!;
      const quantityKg = Number(trade.sellers[0]?.agreedQuantity || trade.sellers[0]?.offeredQuantity || 0) * 1000;
      agg.totalVolumeKg += quantityKg;
      agg.avgPricePerKg += trade.sellingPrice?.toNumber() || 0;
      agg.activeTrades += trade.phase === "IN_TRANSIT" ? 1 : 0;
      agg.completedTrades += trade.phase === "COMPLETED" || trade.phase === "DELIVERED" ? 1 : 0;
      agg.disputedTrades += trade.status === "DISPUTED" ? 1 : 0;

      const inspectionScore = trade.inspections[0]?.qualityScore;
      if (inspectionScore) {
        agg.avgInspectionScore += inspectionScore;
      }

      const distances = trade.transportJobs
        .map((t) => t.transportRequest?.estimatedDistance || 0)
        .filter((d) => d > 0);
      if (distances.length > 0) {
        agg.transportDistanceAvgKm +=
          distances.reduce((a, b) => a + b, 0) / distances.length;
      }
    }

    const results = Array.from(grouped.values()).map((agg) => ({
      ...agg,
      avgPricePerKg:
        agg.completedTrades > 0
          ? Number((agg.avgPricePerKg / agg.completedTrades).toFixed(2))
          : 0,
      avgInspectionScore:
        agg.completedTrades > 0
          ? Number((agg.avgInspectionScore / agg.completedTrades).toFixed(1))
          : 0,
      transportDistanceAvgKm:
        agg.completedTrades > 0
          ? Number((agg.transportDistanceAvgKm / agg.completedTrades).toFixed(1))
          : 0,
    }));

    this.logger.log(
      `B2G API queried: ${results.length} aggregate groups for ${startDate.toISOString().slice(0, 10)}–${endDate.toISOString().slice(0, 10)}`,
    );
    return results;
  }

  /**
   * Real-time food-security snapshot for DG AGRI "exceptional need" requests.
   * Returns top-level aggregates without PII.
   */
  async getFoodSecuritySnapshot(): Promise<{
    timestamp: string;
    totalActiveVolumeKg: number;
    commoditiesAtRisk: Array<{ commodity: string; volumeKg: number }>;
    avgDaysToDelivery: number;
  }> {
    const activeTrades = await this.prisma.tradeOperation.findMany({
      where: { phase: { in: ["IN_TRANSIT", "DELIVERED", "COMPLETED"] } },
      include: {
        buyListing: { include: { product: true } },
        sellers: { include: { saleListing: { include: { product: true } } } },
        transportJobs: { include: { transportRequest: true } },
      },
    });

    const totalActiveVolumeKg = activeTrades.reduce(
      (sum, t) =>
        sum +
        Number(t.sellers[0]?.agreedQuantity || t.sellers[0]?.offeredQuantity || 0) *
          1000,
      0,
    );

    const commodityMap = new Map<string, number>();
    for (const t of activeTrades) {
      const product = t.buyListing?.product || t.sellers[0]?.saleListing?.product;
      const c = product?.category || "unknown";
      const qty = Number(t.sellers[0]?.agreedQuantity || t.sellers[0]?.offeredQuantity || 0) * 1000;
      commodityMap.set(c, (commodityMap.get(c) || 0) + qty);
    }
    const commoditiesAtRisk = Array.from(commodityMap.entries())
      .map(([commodity, volumeKg]) => ({ commodity, volumeKg }))
      .sort((a, b) => b.volumeKg - a.volumeKg)
      .slice(0, 10);

    // Compute avg days to delivery from transport requests
    let totalDays = 0;
    let count = 0;
    for (const t of activeTrades) {
      for (const job of t.transportJobs) {
        const req = job.transportRequest;
        if (req?.pickupWindowStart && req?.deliveryDeadline) {
          const days =
            (new Date(req.deliveryDeadline).getTime() -
              new Date(req.pickupWindowStart).getTime()) /
            (1000 * 60 * 60 * 24);
          if (days > 0) {
            totalDays += days;
            count++;
          }
        }
      }
    }
    const avgDaysToDelivery = count > 0 ? Number((totalDays / count).toFixed(1)) : 0;

    return {
      timestamp: new Date().toISOString(),
      totalActiveVolumeKg,
      commoditiesAtRisk,
      avgDaysToDelivery,
    };
  }
}
