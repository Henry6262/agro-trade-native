const BASE_URL = 'https://www.alphavantage.co/query';

const COMMODITY_SYMBOLS = ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE', 'NATURAL_GAS'] as const;

export type CommoditySymbol = (typeof COMMODITY_SYMBOLS)[number];

export interface CommodityPrice {
  symbol: CommoditySymbol;
  name: string;
  price: number;
  change: number;
  changePct: number;
  unit: string;
  updatedAt: string;
}

interface AlphaVantageDataPoint {
  date: string;
  value: string;
}

interface AlphaVantageResponse {
  name: string;
  unit: string;
  data: AlphaVantageDataPoint[];
}

function parseResponse(symbol: CommoditySymbol, raw: AlphaVantageResponse): CommodityPrice {
  const data = raw.data ?? [];
  const latestRaw = data[0]?.value ?? '.';
  const previousRaw = data[1]?.value ?? '.';

  const price = latestRaw === '.' ? 0 : parseFloat(latestRaw);
  const previous = previousRaw === '.' ? price : parseFloat(previousRaw);
  const change = parseFloat((price - previous).toFixed(4));
  const changePct = previous === 0 ? 0 : parseFloat(((change / previous) * 100).toFixed(2));

  return {
    symbol,
    name: raw.name ?? symbol,
    price,
    change,
    changePct,
    unit: raw.unit ?? '',
    updatedAt: data[0]?.date ?? new Date().toISOString(),
  };
}

async function fetchCommodity(
  symbol: CommoditySymbol,
  apiKey: string
): Promise<CommodityPrice | null> {
  try {
    const url = `${BASE_URL}?function=${symbol}&interval=monthly&apikey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[marketDataService] ${symbol} fetch failed: ${response.status}`);
      return null;
    }

    const json = (await response.json()) as AlphaVantageResponse;
    return parseResponse(symbol, json);
  } catch (error) {
    console.warn(`[marketDataService] ${symbol} error:`, error);
    return null;
  }
}

async function getPrices(): Promise<CommodityPrice[]> {
  const apiKey = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_KEY ?? '';

  if (!apiKey) {
    console.warn('[marketDataService] No Alpha Vantage API key set');
    return [];
  }

  const results = await Promise.all(
    COMMODITY_SYMBOLS.map((symbol) => fetchCommodity(symbol, apiKey))
  );

  return results.filter((r): r is CommodityPrice => r !== null);
}

export const marketDataService = {
  getPrices,
  parseResponse, // exported for testing
};
