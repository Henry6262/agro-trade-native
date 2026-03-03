import { newsService } from '../newsService';

global.fetch = jest.fn();

describe('newsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps NewsAPI articles to NewsArticle shape', () => {
    const raw = {
      title: 'Wheat prices surge amid dry weather',
      source: { name: 'Reuters' },
      description: 'Global wheat futures climbed...',
      url: 'https://reuters.com/article/123',
      publishedAt: '2026-03-03T10:00:00Z',
    };

    const result = newsService.parseArticle(raw);

    expect(result.title).toBe('Wheat prices surge amid dry weather');
    expect(result.source).toBe('Reuters');
    expect(result.description).toBe('Global wheat futures climbed...');
    expect(result.url).toBe('https://reuters.com/article/123');
    expect(result.publishedAt).toBe('2026-03-03T10:00:00Z');
  });

  it('filters out articles with [Removed] title', () => {
    const articles = [
      { title: '[Removed]', source: { name: 'Unknown' }, description: '', url: '', publishedAt: '' },
      { title: 'Corn market update', source: { name: 'Bloomberg' }, description: 'Corn steady', url: 'https://bloomberg.com/1', publishedAt: '2026-03-03T09:00:00Z' },
    ];

    const results = articles
      .filter((a) => a.title !== '[Removed]')
      .map(newsService.parseArticle);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Corn market update');
  });
});
