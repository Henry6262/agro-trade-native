import { marketDataService } from '../marketDataService';
import type { CommoditySymbol } from '../marketDataService';

global.fetch = jest.fn();

const mockMeta = {
  symbol: 'ZW=F',
  regularMarketPrice: 551.75,
  chartPreviousClose: 549.5,
  currency: 'USc',
  longName: 'Wheat Futures,Mar-2026',
  regularMarketTime: 1709481600,
};

describe('marketDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseMeta', () => {
    it('maps Yahoo meta to CommodityPrice shape', () => {
      const result = marketDataService.parseMeta('WHEAT', mockMeta);

      expect(result.symbol).toBe('WHEAT');
      expect(result.name).toBe('Wheat');
      expect(result.price).toBe(551.75);
      expect(result.unit).toBe('c/bu');
      expect(result.change).toBeCloseTo(2.25, 2);
      expect(result.changePct).toBeCloseTo(0.41, 1);
    });

    it('returns zero change when no previous close available', () => {
      const { chartPreviousClose: _cpc, ...meta } = mockMeta;
      const result = marketDataService.parseMeta('WHEAT', meta);

      expect(result.change).toBe(0);
      expect(result.changePct).toBe(0);
    });

    it('uses correct unit for each commodity', () => {
      const cases: [CommoditySymbol, string][] = [
        ['WHEAT', 'c/bu'],
        ['CORN', 'c/bu'],
        ['COTTON', 'c/lb'],
        ['SUGAR', 'c/lb'],
        ['COFFEE', 'c/lb'],
      ];

      cases.forEach(([symbol, expectedUnit]) => {
        const result = marketDataService.parseMeta(symbol, mockMeta);
        expect(result.unit).toBe(expectedUnit);
      });
    });

    it('derives updatedAt from regularMarketTime', () => {
      const result = marketDataService.parseMeta('WHEAT', mockMeta);
      expect(result.updatedAt).toBe(new Date(1709481600 * 1000).toISOString());
    });

    it('falls back to current time when regularMarketTime missing', () => {
      const before = Date.now();
      const { regularMarketTime: _rmt, ...meta } = mockMeta;
      const result = marketDataService.parseMeta('WHEAT', meta);
      const after = Date.now();

      const updatedMs = new Date(result.updatedAt).getTime();
      expect(updatedMs).toBeGreaterThanOrEqual(before);
      expect(updatedMs).toBeLessThanOrEqual(after);
    });
  });

  describe('getPrices', () => {
    const makeOkResponse = (symbol: string, price: number) => ({
      ok: true,
      json: async () => ({
        chart: {
          result: [{ meta: { symbol, regularMarketPrice: price, chartPreviousClose: price - 1 } }],
          error: null,
        },
      }),
    });

    it('fetches all 5 commodities and returns prices', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue(makeOkResponse('ZW=F', 551.75));

      const results = await marketDataService.getPrices();

      expect(results).toHaveLength(5);
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('calls onProgress for each successful commodity', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue(makeOkResponse('ZW=F', 551.75));

      const onProgress = jest.fn();
      await marketDataService.getPrices(onProgress);

      expect(onProgress).toHaveBeenCalledTimes(5);
    });

    it('skips failed fetches and returns partial results', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch
        .mockResolvedValueOnce(makeOkResponse('ZW=F', 551.75))
        .mockRejectedValue(new Error('Network error'));

      const results = await marketDataService.getPrices();

      // At least 1 succeeded, rest failed gracefully
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.length).toBeLessThan(5);
    });

    it('returns empty array when all fetches fail', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValue(new Error('Network error'));

      const results = await marketDataService.getPrices();

      expect(results).toHaveLength(0);
    });
  });
});
