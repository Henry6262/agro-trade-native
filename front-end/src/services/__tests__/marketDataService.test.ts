import { marketDataService } from '../marketDataService';

// Mock fetch since we're in a test environment
global.fetch = jest.fn();

describe('marketDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCommodityResponse', () => {
    it('extracts price and change from Alpha Vantage response', () => {
      const mockResponse = {
        name: 'Wheat',
        unit: 'dollar per bushel',
        data: [
          { date: '2026-03-03', value: '6.43' },
          { date: '2026-02-28', value: '6.31' },
        ],
      };

      const result = marketDataService.parseResponse('WHEAT', mockResponse);

      expect(result.symbol).toBe('WHEAT');
      expect(result.name).toBe('Wheat');
      expect(result.price).toBe(6.43);
      expect(result.change).toBeCloseTo(0.12, 1);
      expect(result.changePct).toBeCloseTo(1.9, 0);
      expect(result.unit).toBe('dollar per bushel');
    });

    it('handles single data point (no previous price)', () => {
      const mockResponse = {
        name: 'Corn',
        unit: 'dollar per bushel',
        data: [{ date: '2026-03-03', value: '4.87' }],
      };

      const result = marketDataService.parseResponse('CORN', mockResponse);

      expect(result.price).toBe(4.87);
      expect(result.change).toBe(0);
      expect(result.changePct).toBe(0);
    });

    it('handles missing or null value gracefully', () => {
      const mockResponse = {
        name: 'Cotton',
        unit: 'dollar per pound',
        data: [{ date: '2026-03-03', value: '.' }],
      };

      const result = marketDataService.parseResponse('COTTON', mockResponse);

      expect(result.price).toBe(0);
    });
  });
});
