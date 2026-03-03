const BASE_URL = 'https://www.alphavantage.co/query';

const COMMODITY_SYMBOLS = ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE'] as const;

// Delay between requests to stay within Alpha Vantage free tier (5 req/min)
const RATE_LIMIT_DELAY_MS = 13000; // 13 seconds between each request

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  Information?: string; // present when rate-limited or error
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

    if (json.Information) {
      console.warn(`[marketDataService] ${symbol} rate limited or error:`, json.Information);
      return null;
    }

    return parseResponse(symbol, json);
  } catch (error) {
    console.warn(`[marketDataService] ${symbol} error:`, error);
    return null;
  }
}

async function getPrices(onProgress?: (price: CommodityPrice) => void): Promise<CommodityPrice[]> {
  const apiKey = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_KEY ?? '';

  if (!apiKey) {
    console.warn('[marketDataService] No Alpha Vantage API key set');
    return [];
  }

  const results: CommodityPrice[] = [];

  for (let i = 0; i < COMMODITY_SYMBOLS.length; i++) {
    const symbol = COMMODITY_SYMBOLS[i];

    if (i > 0) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    const price = await fetchCommodity(symbol, apiKey);
    if (price) {
      results.push(price);
      onProgress?.(price); // progressively update caller
    }
  }

  return results;
}

export const marketDataService = {
  getPrices,
  parseResponse, // exported for testing
};
