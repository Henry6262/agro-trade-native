export interface MarketInsightCard {
  title: string;
  metric: string;
  trend?: 'up' | 'down' | 'flat';
}
