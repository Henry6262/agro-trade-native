// GNews Open Platform API — https://gnews.io/docs/v4
// Free tier: 100 req/day, works from any device/origin
const BASE_URL = 'https://gnews.io/api/v4/search';

const SEARCH_QUERY = 'wheat OR corn OR cotton OR sugar OR coffee OR agriculture';

// Indirection prevents babel-preset-expo from statically inlining the value
// as `undefined` at transform time, keeping it readable at runtime in tests.
const GNEWS_KEY_NAME = 'EXPO_PUBLIC_GNEWS_KEY';

export interface NewsArticle {
  title: string;
  source: string;
  description: string;
  url: string;
  publishedAt: string;
  imageUrl: string;
}

interface GNewsSource {
  name: string;
  url: string;
}

interface GNewsArticle {
  title: string | null;
  description: string | null;
  content?: string;
  url: string | null;
  image: string | null;
  publishedAt: string | null;
  source?: GNewsSource | null;
}

interface GNewsResponse {
  articles: GNewsArticle[];
}

function parseArticle(raw: GNewsArticle): NewsArticle {
  return {
    title: raw.title ?? '',
    source: raw.source?.name ?? 'GNews',
    description: raw.description ?? '',
    url: raw.url ?? '',
    publishedAt: raw.publishedAt ?? '',
    imageUrl: raw.image ?? '',
  };
}

async function getAgriNews(): Promise<NewsArticle[]> {
  const apiKey = process.env[GNEWS_KEY_NAME] ?? '';

  if (!apiKey) {
    console.warn('[newsService] No GNews API key set');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: SEARCH_QUERY,
      lang: 'en',
      max: '10',
      apikey: apiKey,
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      console.warn(`[newsService] GNews fetch failed: ${response.status}`);
      return [];
    }

    const json = (await response.json()) as GNewsResponse;
    const articles = json?.articles ?? [];

    return articles.filter((a) => a.title && a.url).map(parseArticle);
  } catch (error) {
    console.warn('[newsService] Error:', error);
    return [];
  }
}

export const newsService = {
  getAgriNews,
  parseArticle,
};
