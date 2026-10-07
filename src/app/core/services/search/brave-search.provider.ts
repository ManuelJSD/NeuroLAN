import { SearchProvider, SearchResult } from './search-provider.interface';

// Shape of the Brave Search API response (only the fields we use)
interface BraveSearchResponse {
  web?: {
    results?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

// Brave Search API provider.
// Docs: https://api.search.brave.com/app/documentation/web-search/get-started
export class BraveSearchProvider implements SearchProvider {
  readonly name = 'Brave Search';
  readonly id = 'brave';

  // Maximum number of results to request from the API
  private readonly MAX_RESULTS = 5;

  async search(query: string, apiKey: string, signal?: AbortSignal): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      count: String(this.MAX_RESULTS),
    });

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
    }

    const data: BraveSearchResponse = await response.json();
    const results = data.web?.results ?? [];

    return results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    }));
  }
}
