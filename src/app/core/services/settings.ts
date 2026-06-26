import { Injectable, inject } from '@angular/core';

import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {

  private _storage: Storage | null = null;
  private _initPromise: Promise<Storage> | null = null;

  constructor(private storage: Storage){
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
    const storage = await this.ensureStorage();
    await this._storage?.set('base_url', baseUrl);
  }

  async getBaseUrl(): Promise<string | null> {
    const storage = await this.ensureStorage();
    return (await this._storage?.get('base_url')) ?? null;
  }

}
