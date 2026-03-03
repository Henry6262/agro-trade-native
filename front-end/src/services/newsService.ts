const BASE_URL = 'https://newsapi.org/v2/everything';

const QUERY =
  'agricultural commodities OR wheat prices OR corn market OR coffee futures OR cotton prices OR sugar prices';

export interface NewsArticle {
  title: string;
  source: string;
  description: string;
  url: string;
  publishedAt: string;
}

interface RawArticle {
  title: string;
  source: { name: string };
  description: string;
  url: string;
  publishedAt: string;
}

function parseArticle(raw: RawArticle): NewsArticle {
  return {
    title: raw.title ?? '',
    source: raw.source?.name ?? 'Unknown',
    description: raw.description ?? '',
    url: raw.url ?? '',
    publishedAt: raw.publishedAt ?? '',
  };
}

async function getAgriNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.EXPO_PUBLIC_NEWS_API_KEY ?? '';

  if (!apiKey) {
    console.warn('[newsService] No NewsAPI key set');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: QUERY,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: '20',
      apiKey,
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      console.warn(`[newsService] Fetch failed: ${response.status}`);
      return [];
    }

    const json = (await response.json()) as { articles: RawArticle[] };
    const articles = json.articles ?? [];

    return articles.filter((a) => a.title !== '[Removed]' && a.url).map(parseArticle);
  } catch (error) {
    console.warn('[newsService] Error:', error);
    return [];
  }
}

export const newsService = {
  getAgriNews,
  parseArticle, // exported for testing
};
