// Yahoo Finance commodity futures — no API key, no rate limits
// Symbols: ZW=F (Wheat), ZC=F (Corn), CT=F (Cotton), SB=F (Sugar), KC=F (Coffee)
const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

export type CommoditySymbol = 'WHEAT' | 'CORN' | 'COTTON' | 'SUGAR' | 'COFFEE';

export interface CommodityPrice {
  symbol: CommoditySymbol;
  name: string;
  price: number;
  change: number;
  changePct: number;
  unit: string;
  updatedAt: string;
}

interface YahooMeta {
  symbol: string;
  regularMarketPrice: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
  longName?: string;
  shortName?: string;
  regularMarketTime?: number;
}

interface YahooChartResponse {
  chart: {
    result: { meta: YahooMeta }[] | null;
    error: { code: string; description: string } | null;
  };
}

const YAHOO_SYMBOLS: Record<CommoditySymbol, string> = {
  WHEAT: 'ZW=F',
  CORN: 'ZC=F',
  COTTON: 'CT=F',
  SUGAR: 'SB=F',
  COFFEE: 'KC=F',
};

const COMMODITY_UNITS: Record<CommoditySymbol, string> = {
  WHEAT: 'c/bu',
  CORN: 'c/bu',
  COTTON: 'c/lb',
  SUGAR: 'c/lb',
  COFFEE: 'c/lb',
};

const COMMODITY_NAMES: Record<CommoditySymbol, string> = {
  WHEAT: 'Wheat',
  CORN: 'Corn',
  COTTON: 'Cotton',
  SUGAR: 'Sugar',
  COFFEE: 'Coffee',
};

function parseMeta(symbol: CommoditySymbol, meta: YahooMeta): CommodityPrice {
  const price = meta.regularMarketPrice ?? 0;
  const previous = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = parseFloat((price - previous).toFixed(4));
  const changePct = previous === 0 ? 0 : parseFloat(((change / previous) * 100).toFixed(2));

  const updatedAt = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : new Date().toISOString();

  return {
    symbol,
    name: COMMODITY_NAMES[symbol],
    price,
    change,
    changePct,
    unit: COMMODITY_UNITS[symbol],
    updatedAt,
  };
}

async function fetchCommodity(symbol: CommoditySymbol): Promise<CommodityPrice | null> {
  const yahooSymbol = YAHOO_SYMBOLS[symbol];
  try {
    const url = `${BASE_URL}/${yahooSymbol}?interval=1d&range=5d`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[marketDataService] ${symbol} fetch failed: ${response.status}`);
      return null;
    }

    const json = (await response.json()) as YahooChartResponse;

    if (json.chart.error) {
      console.warn(`[marketDataService] ${symbol} error:`, json.chart.error.description);
      return null;
    }

    const meta = json.chart.result?.[0]?.meta;
    if (!meta) {
      console.warn(`[marketDataService] ${symbol} no result`);
      return null;
    }

    return parseMeta(symbol, meta);
  } catch (error) {
    console.warn(`[marketDataService] ${symbol} exception:`, error);
    return null;
  }
}

async function getPrices(onProgress?: (price: CommodityPrice) => void): Promise<CommodityPrice[]> {
  const symbols = Object.keys(YAHOO_SYMBOLS) as CommoditySymbol[];

  const results: CommodityPrice[] = [];

  // Fire all requests in parallel — no rate limit delays needed
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const price = await fetchCommodity(symbol);
      if (price) {
        results.push(price);
        onProgress?.(price);
      }
    })
  );

  return results;
}

export const marketDataService = {
  getPrices,
  parseMeta, // exported for testing
};
