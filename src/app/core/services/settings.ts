import { Injectable, inject } from '@angular/core';

import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private _storage: Storage | null = null;
  private _initPromise: Promise<Storage> | null = null;

  constructor(private storage: Storage) {
    this._initPromise = this.init();
  }

  async init(): Promise<Storage> {
    const storage = await this.storage.create();
    this._storage = storage;
    return storage;
  }

  async ensureStorage() {
    if (this._storage) {
      return this._storage;
    }
    if (this._initPromise) {
      return this._initPromise;
    }
    this._initPromise = this.init();
    return this._initPromise;
  }

  async setBaseUrl(baseUrl: string): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('base_url', baseUrl);
  }

  async getBaseUrl(): Promise<string | null> {
    await this.ensureStorage();
    return (await this._storage?.get('base_url')) ?? null;
  }

  async setLanguage(lang: string): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('language', lang);
  }

  async getLanguage(): Promise<string | null> {
    const storage = await this.ensureStorage();
    return (await this._storage?.get('language')) ?? null;
  }

  async setStreamMode(isStream: boolean): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('stream_mode', isStream);
  }

  async getStreamMode(): Promise<boolean | null> {
    const storage = await this.ensureStorage();
    return (await this._storage?.get('stream_mode')) ?? null;
  }

  // --- Web Search settings ---

  async setWebSearchEnabled(enabled: boolean): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('web_search_enabled', enabled);
  }

  async getWebSearchEnabled(): Promise<boolean> {
    await this.ensureStorage();
    return (await this._storage?.get('web_search_enabled')) ?? false;
  }

  async setSearchApiKey(key: string): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('search_api_key', key);
  }

  async getSearchApiKey(): Promise<string | null> {
    await this.ensureStorage();
    return (await this._storage?.get('search_api_key')) ?? null;
  }

  // Stores the selected provider id (e.g. 'brave', 'tavily')
  async setSearchProviderId(id: string): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('search_provider_id', id);
  }

  async getSearchProviderId(): Promise<string> {
    await this.ensureStorage();
    return (await this._storage?.get('search_provider_id')) ?? 'brave';
  }

  // --- Search mode ---
  // 'native': the model decides when to call the web_search tool (requires tool calling support).
  // 'rag':    the app searches before calling the model and injects the results as context
  //           (works with any model, including uncensored ones that ignore the tools parameter).

  async setSearchMode(mode: 'native' | 'rag'): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('search_mode', mode);
  }

  async getSearchMode(): Promise<'native' | 'rag'> {
    await this.ensureStorage();
    return (await this._storage?.get('search_mode')) ?? 'native';
  }

  // --- Memory settings ---

  async setMemoryEnabled(enabled: boolean): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('memory_enabled', enabled);
  }

  async getMemoryEnabled(): Promise<boolean> {
    await this.ensureStorage();
    return (await this._storage?.get('memory_enabled')) ?? true;
  }

  /**
   * Maximum number of memories to keep. Oldest are discarded when exceeded.
   * 0 means unlimited.
   */
  async setMemoryLimit(limit: number): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('memory_limit', limit);
  }

  async getMemoryLimit(): Promise<number> {
    await this.ensureStorage();
    return (await this._storage?.get('memory_limit')) ?? 50;
  }

  /**
   * How often (every N assistant turns) the app runs memory extraction.
   * 1 = every turn, 2 = every other turn, etc.
   * 0 is treated as 1 (always extract).
   */
  async setMemoryExtractionFrequency(n: number): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('memory_extraction_freq', n);
  }

  async getMemoryExtractionFrequency(): Promise<number> {
    await this.ensureStorage();
    return (await this._storage?.get('memory_extraction_freq')) ?? 2;
  }

  // --- Skin / Theme ---

  async setSkin(skin: string): Promise<void> {
    await this.ensureStorage();
    await this._storage?.set('app_skin', skin);
  }

  async getSkin(): Promise<'dark' | 'light' | 'whatsapp'> {
    await this.ensureStorage();
    return (await this._storage?.get('app_skin')) ?? 'dark';
  }

}
