import { newsService } from '../newsService';

global.fetch = jest.fn();

describe('newsService', () => {
  const ORIGINAL_KEY = process.env['EXPO_PUBLIC_GNEWS_KEY'];

  beforeEach(() => {
    jest.clearAllMocks();
    process.env['EXPO_PUBLIC_GNEWS_KEY'] = 'test-key';
  });

  afterEach(() => {
    process.env['EXPO_PUBLIC_GNEWS_KEY'] = ORIGINAL_KEY;
  });

  it('maps GNews article to NewsArticle shape with imageUrl', () => {
    const raw = {
      title: 'Wheat prices surge amid dry weather',
      description: 'Global wheat futures climbed on concerns...',
      content: '',
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
      content: '',
      url: 'https://bloomberg.com/1',
      image: null,
      publishedAt: '2026-03-03T09:00:00Z',
      source: { name: 'Bloomberg', url: 'https://bloomberg.com' },
    };

    const result = newsService.parseArticle(raw);

    expect(result.imageUrl).toBe('');
  });

  it('filters articles with missing title or url', async () => {
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

    const results = await newsService.getAgriNews();
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Wheat update');
  });

  it('returns empty array when API key is missing', async () => {
    process.env['EXPO_PUBLIC_GNEWS_KEY'] = '';
    const results = await newsService.getAgriNews();
    expect(results).toHaveLength(0);
    // afterEach restores the key
  });

  it('returns empty array when fetch fails', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const results = await newsService.getAgriNews();
    expect(results).toHaveLength(0);
  });
});
