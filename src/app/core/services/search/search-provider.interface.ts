// Result from a single web search hit
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Current state of a search operation (used to update the UI)
export type SearchState = 'idle' | 'searching' | 'done' | 'error';

export interface SearchStatus {
  state: SearchState;
  query?: string;
  resultsCount?: number;
  error?: string;
}

// Contract that every search provider must implement.
// Adding a new provider (e.g. Tavily) only requires creating a new class
// that implements this interface — no changes needed in WebSearchService.
export interface SearchProvider {
  /** Human-readable name shown in Settings (e.g. "Brave Search") */
  readonly name: string;

  /** Unique identifier used to persist the user's choice (e.g. "brave") */
  readonly id: string;

  /**
   * Execute a search query and return a list of results.
   * Should throw an error (or return []) on failure.
   */
  search(query: string, apiKey: string, signal?: AbortSignal): Promise<SearchResult[]>;
}
