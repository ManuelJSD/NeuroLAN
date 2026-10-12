import { SearchProvider, SearchResult } from './search-provider.interface';

interface TavilyResponse {
  query: string;
  results: {
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
  }[];
}

export class TavilySearchProvider implements SearchProvider {
  readonly id = 'tavily';
  readonly name = 'Tavily Search API';
  
  // Endpoint for the Tavily API
  private readonly endpoint = 'https://api.tavily.com/search';

  async search(query: string, apiKey: string, signal?: AbortSignal): Promise<SearchResult[]> {
    const body = {
      api_key: apiKey,
      query: query,
      search_depth: 'basic',
      include_images: false,
      include_answer: false,
      max_results: 5
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      // Try to parse the error message from the response body if possible
      let errorMsg = `Tavily HTTP error ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody.detail) {
          errorMsg = `Tavily Error: ${errorBody.detail}`;
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }
      throw new Error(errorMsg);
    }

    const data = (await response.json()) as TavilyResponse;

    // Map the Tavily-specific response to our generic SearchResult format
    return data.results.map((item) => ({
      title: item.title || 'Untitled',
      url: item.url,
      snippet: item.content || ''
    }));
  }
}
