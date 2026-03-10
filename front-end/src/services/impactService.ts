import apiClient from './api';

export interface PlatformImpact {
  totalTrades: number;
  totalVolumeKg: number;
  uniqueFarmers: number;
  regionsActive: number;
  estimatedIncomeGenerated: number;
}

export interface CommodityBreakdownItem {
  commodityCode: string | null;
  totalVolumeKg: number;
  tradeCount: number;
  avgPricePerKg: number;
}

export interface RegionalHeatmapItem {
  regionCode: string | null;
  eventCount: number;
  tradeCount: number;
}

export interface TimelinePoint {
  date: string;
  eventCount: number;
  completedTrades: number;
}

export const impactService = {
  async getPlatformImpact(): Promise<PlatformImpact> {
    const response = await apiClient.get('/analytics/platform-impact');
    return response.data;
  },

  async getCommodityBreakdown(): Promise<CommodityBreakdownItem[]> {
    const response = await apiClient.get('/analytics/commodity-breakdown');
    return response.data;
  },

  async getRegionalHeatmap(): Promise<RegionalHeatmapItem[]> {
    const response = await apiClient.get('/analytics/regional-heatmap');
    return response.data;
  },

  async getTimeline(period: '7d' | '30d' | '90d' = '30d'): Promise<TimelinePoint[]> {
    const response = await apiClient.get('/analytics/timeline', { params: { period } });
    return response.data;
  },
};
