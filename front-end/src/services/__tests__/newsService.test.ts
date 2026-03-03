import { newsService } from '../newsService';

global.fetch = jest.fn();

describe('newsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps GNews article to NewsArticle shape with imageUrl', () => {
    const raw = {
      title: 'Wheat prices surge amid dry weather',
      description: 'Global wheat futures climbed on concerns...',
      url: 'https://reuters.com/article/123',
      image: 'https://example.com/wheat.jpg',
      publishedAt: '2026-03-03T10:00:00Z',
      source: { name: 'Reuters', url: 'https://reuters.com' },
    };

    const result = newsService.parseArticle(raw);

    expect(result.title).toBe('Wheat prices surge amid dry weather');
    expect(result.source).toBe('Reuters');
    expect(result.description).toBe('Global wheat futures climbed on concerns...');
    expect(result.url).toBe('https://reuters.com/article/123');
    expect(result.publishedAt).toBe('2026-03-03T10:00:00Z');
    expect(result.imageUrl).toBe('https://example.com/wheat.jpg');
  });

  it('returns empty imageUrl when image is null', () => {
    const raw = {
      title: 'Corn market update',
      description: 'Corn steady',
      url: 'https://bloomberg.com/1',
      image: null,
      publishedAt: '2026-03-03T09:00:00Z',
      source: { name: 'Bloomberg', url: 'https://bloomberg.com' },
    };

    const result = newsService.parseArticle(raw);

    expect(result.imageUrl).toBe('');
  });

  it('filters articles with missing title or url', () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [
          {
            title: '',
            description: 'No title',
            url: 'https://example.com',
            image: null,
            publishedAt: '2026-03-03T08:00:00Z',
            source: { name: 'Test', url: '' },
          },
          {
            title: 'Wheat update',
            description: 'Wheat news',
            url: 'https://reuters.com/wheat',
            image: 'https://img.example.com/wheat.jpg',
            publishedAt: '2026-03-03T08:00:00Z',
            source: { name: 'Reuters', url: 'https://reuters.com' },
          },
        ],
      }),
    });

    process.env.EXPO_PUBLIC_GNEWS_KEY = 'test-key';
    return newsService.getAgriNews().then((results) => {
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Wheat update');
    });
  });

  it('returns empty array when API key is missing', () => {
    const original = process.env.EXPO_PUBLIC_GNEWS_KEY;
    process.env.EXPO_PUBLIC_GNEWS_KEY = '';
    return newsService.getAgriNews().then((results) => {
      expect(results).toHaveLength(0);
      process.env.EXPO_PUBLIC_GNEWS_KEY = original;
    });
  });

  it('returns empty array when fetch fails', () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    process.env.EXPO_PUBLIC_GNEWS_KEY = 'test-key';
    return newsService.getAgriNews().then((results) => {
      expect(results).toHaveLength(0);
    });
  });
});
