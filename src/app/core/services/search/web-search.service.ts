import { Injectable, signal, inject } from '@angular/core';
import { SearchProvider, SearchResult, SearchStatus } from './search-provider.interface';
import { BraveSearchProvider } from './brave-search.provider';
import { TavilySearchProvider } from './tavily-search.provider';
import { SettingsService } from '../settings';

// Search timeout in milliseconds
const SEARCH_TIMEOUT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class WebSearchService {
  private settingsService = inject(SettingsService);

  // --- Registered providers ---
  // To add a new provider: instantiate it here and push it to the array.
  // The Settings UI will automatically pick it up from `availableProviders`.
  readonly availableProviders: SearchProvider[] = [
    new BraveSearchProvider(),
    new TavilySearchProvider(),
  ];

  // Reactive signal: the UI subscribes to this to show search status
  readonly searchStatus = signal<SearchStatus>({ state: 'idle' });

  // Active AbortController so external callers (e.g. stop button) can cancel
  private abortController: AbortController | null = null;

  // Cached results from the last completed search (used to populate sources in the UI)
  private lastResults: SearchResult[] = [];

  /**
   * Execute a search using the provider selected in Settings.
   * Returns formatted results as a plain-text string ready to be sent to the model.
   */
  async search(query: string): Promise<string> {
    this.searchStatus.set({ state: 'searching', query });
    this.lastResults = [];

    // Create a new abort controller for this request
    this.abortController = new AbortController();

    // Auto-cancel after SEARCH_TIMEOUT_MS
    const timeoutId = setTimeout(() => this.abortController?.abort(), SEARCH_TIMEOUT_MS);

    try {
      const provider = await this.resolveProvider();
      const apiKey = await this.settingsService.getSearchApiKey();

      if (!apiKey) {
        throw new Error('No API key configured for web search.');
      }

      const results = await provider.search(query, apiKey, this.abortController.signal);
      clearTimeout(timeoutId);

      this.lastResults = results;
      this.searchStatus.set({ state: 'done', query, resultsCount: results.length });
      return this.formatResultsForModel(results);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const message = err?.message ?? 'Unknown search error';
      this.searchStatus.set({ state: 'error', query, error: message });
      throw err; // Re-throw so the caller (chat page) can handle it
    } finally {
      this.abortController = null;
    }
  }

  /** Returns the SearchResult objects from the last completed search */
  getLastResults(): SearchResult[] {
    return this.lastResults;
  }

  /** Cancel any in-progress search (called from the stop button) */
  cancel(): void {
    this.abortController?.abort();
    this.searchStatus.set({ state: 'idle' });
  }

  /** Reset status to idle (e.g. when starting a new conversation) */
  reset(): void {
    this.lastResults = [];
    this.searchStatus.set({ state: 'idle' });
  }

  // --- Private helpers ---

  /** Resolve which provider to use based on the persisted setting */
  private async resolveProvider(): Promise<SearchProvider> {
    const providerId = await this.settingsService.getSearchProviderId();
    const provider = this.availableProviders.find((p) => p.id === providerId);
    // Fall back to the first registered provider if the stored ID is unknown
    return provider ?? this.availableProviders[0];
  }

  /**
   * Format search results into a plain-text block the model can read.
   * Keeping it simple and structured avoids token waste.
   */
  private formatResultsForModel(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    return results
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`,
      )
      .join('\n\n');
  }
}
