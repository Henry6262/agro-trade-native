export class PlatformImpactDto {
  totalTrades: number;
  totalVolumeKg: number;
  uniqueFarmers: number;
  regionsActive: number;
  estimatedIncomeGenerated: number;
}

export class CommodityBreakdownItemDto {
  commodityCode: string;
  totalVolumeKg: number;
  tradeCount: number;
  avgPricePerKg: number;
}

export class RegionalHeatmapItemDto {
  regionCode: string;
  eventCount: number;
  tradeCount: number;
}

export class TimelinePointDto {
  date: string;
  eventCount: number;
  completedTrades: number;
}
