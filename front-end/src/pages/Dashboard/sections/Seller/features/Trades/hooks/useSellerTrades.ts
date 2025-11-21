import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sellerTradesService } from '../service';
import type { EarningsSummary, SellerTrade } from '../types';
import type { SellerStats, SellerTradeRecord } from '@services/sellerService';
import { deriveStageFromStatus, getBuyerFlag } from '../utils';

const DEFAULT_SUMMARY: EarningsSummary = {
  totalEarnings: 0,
  monthlyEarnings: 0,
  completedTrades: 0,
  averagePerTrade: 0,
  topProduct: '—',
  growthRate: 0,
};

const mapTradeRecord = (record: SellerTradeRecord): SellerTrade => {
  const quantity = Number(record.agreedQuantity ?? record.quantity ?? 0);
  const unitPrice =
    Number(record.agreedPricePerTon ?? record.agreedPricePerUnit ?? record.agreedPrice ?? 0) || 0;

  const buyerCity = record.buyer?.city ?? null;
  const buyerCountry = record.buyer?.country ?? record.buyerCountry ?? null;
  const buyerLocation = [buyerCity, buyerCountry].filter(Boolean).join(', ');

  return {
    id: record.tradeOperationId ?? record.id,
    product: record.productName ?? record.product?.displayName ?? 'Trade',
    quantity,
    agreedPricePerTon: unitPrice,
    buyer: record.buyer?.name ?? record.buyerName ?? 'Buyer',
    buyerLocation: buyerLocation || record.buyerLocation || '—',
    buyerFlag: getBuyerFlag(buyerCountry),
    transporter: record.transporter?.name ?? 'Transporter assigned',
    transporterTrucks: Number(record.transporter?.fleetSize ?? 0),
    licensePlate: record.transporter?.licensePlate ?? 'N/A',
    status: record.status ?? 'Scheduled',
    pickupDate: record.pickupDate ?? record.scheduledPickup ?? '—',
    estimatedDeparture: record.pickupDate ?? record.updatedAt ?? '—',
    price: quantity * unitPrice,
    currentStage: deriveStageFromStatus(record.status),
  };
};

const buildSummary = (
  statsQueryData: SellerStats | undefined,
  trades: SellerTrade[]
): EarningsSummary => {
  if (!statsQueryData) {
    return {
      ...DEFAULT_SUMMARY,
      topProduct: trades[0]?.product ?? DEFAULT_SUMMARY.topProduct,
    };
  }

  const { totalRevenue, monthlyRevenue, completedTrades } = statsQueryData;
  const averagePerTrade =
    completedTrades > 0 ? Math.round(totalRevenue / Math.max(completedTrades, 1)) : 0;
  const growthRate =
    totalRevenue > 0 ? Number(((monthlyRevenue / Math.max(totalRevenue, 1)) * 100).toFixed(1)) : 0;

  const counts = trades.reduce<Record<string, number>>((acc, trade) => {
    if (!trade.product) {
      return acc;
    }
    acc[trade.product] = (acc[trade.product] ?? 0) + 1;
    return acc;
  }, {});

  const [topProductName] = Object.entries(counts).sort(([, a], [, b]) => b - a)[0] ?? [
    trades[0]?.product ?? DEFAULT_SUMMARY.topProduct,
  ];

  return {
    totalEarnings: totalRevenue,
    monthlyEarnings: monthlyRevenue,
    completedTrades,
    averagePerTrade,
    topProduct: topProductName ?? DEFAULT_SUMMARY.topProduct,
    growthRate,
  };
};

export const useSellerTrades = () => {
  const tradesQuery = useQuery({
    queryKey: ['seller', 'trades'],
    queryFn: sellerTradesService.fetchTrades,
  });

  const statsQuery = useQuery({
    queryKey: ['seller', 'stats'],
    queryFn: sellerTradesService.fetchStats,
  });

  const trades = useMemo(() => tradesQuery.data?.map(mapTradeRecord) ?? [], [tradesQuery.data]);
  const summary = useMemo(() => buildSummary(statsQuery.data, trades), [statsQuery.data, trades]);

  const isLoading = tradesQuery.isLoading || statsQuery.isLoading;

  return {
    trades,
    summary,
    isLoading,
    isError: tradesQuery.isError || statsQuery.isError,
    refresh: () => {
      void tradesQuery.refetch();
      void statsQuery.refetch();
    },
  };
};
