import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import {
  LmStudioModelsResponse,
  LmStudioChatRequest,
  LmStudioChatResponse,
} from '../models/lmstudio.model';
import { SettingsService } from './settings';

@Injectable({
  providedIn: 'root',
})
export class LmStudioService {

  private http = inject(HttpClient);
  private settingsService = inject(SettingsService);
  private defaultBaseUrl = 'http://127.0.0.1:1234';

  private getCleanUrl(baseUrl: string | null): string {
    let cleanUrl = (baseUrl ?? this.defaultBaseUrl).trim();
    // Remove trailing slash
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    // Prepend http:// if no protocol scheme is specified
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'http://' + cleanUrl;
    }
    return cleanUrl;
  }

  getModels(): Observable<LmStudioModelsResponse> {
    return from(this.settingsService.getBaseUrl()).pipe(
      switchMap(baseUrl => {
        const cleanBaseUrl = this.getCleanUrl(baseUrl);
        const url = `${cleanBaseUrl}/v1/models`;
        console.log('Requesting models from:', url);
        return this.http.get<LmStudioModelsResponse>(url);
      })
    );
  }
  sendChat(body: LmStudioChatRequest): Observable<LmStudioChatResponse> {
    return from(this.settingsService.getBaseUrl()).pipe(
      switchMap(baseUrl => {
        const cleanBaseUrl = this.getCleanUrl(baseUrl);
        const url = `${cleanBaseUrl}/v1/chat/completions`;
        console.log('Sending chat to:', url);
        return this.http.post<LmStudioChatResponse>(url, body);
      })
    );
  }
}
