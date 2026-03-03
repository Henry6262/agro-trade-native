// Using The Guardian Open Platform API (free, works from mobile devices)
// Get a free key at: https://open-platform.theguardian.com/access/
// The 'test' key works for development (100 req/day)
const BASE_URL = 'https://content.guardianapis.com/search';

const SEARCH_QUERY = 'wheat OR corn OR cotton OR sugar OR coffee OR agricultural commodities';

export interface NewsArticle {
  title: string;
  source: string;
  description: string;
  url: string;
  publishedAt: string;
}

interface GuardianField {
  trailText?: string;
}

interface GuardianResult {
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  fields?: GuardianField;
}

interface GuardianResponse {
  response: {
    results: GuardianResult[];
  };
}

function parseArticle(raw: GuardianResult): NewsArticle {
  return {
    title: raw.webTitle ?? '',
    source: 'The Guardian',
    description: raw.fields?.trailText ?? '',
    url: raw.webUrl ?? '',
    publishedAt: raw.webPublicationDate ?? '',
  };
}

async function getAgriNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.EXPO_PUBLIC_NEWS_API_KEY ?? 'test';

  try {
    const params = new URLSearchParams({
      q: SEARCH_QUERY,
      'show-fields': 'trailText',
      'order-by': 'newest',
      'page-size': '20',
      'api-key': apiKey,
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      console.warn(`[newsService] Guardian fetch failed: ${response.status}`);
      return [];
    }

    const json = (await response.json()) as GuardianResponse;
    const results = json?.response?.results ?? [];

    return results.filter((r) => r.webTitle && r.webUrl).map(parseArticle);
  } catch (error) {
    console.warn('[newsService] Error:', error);
    return [];
  }
}

export const newsService = {
  getAgriNews,
  parseArticle, // exported for testing
};
