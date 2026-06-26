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
  private defaultBaseUrl = 'http://127.0.0.1:1234'

  getModels(): Observable<LmStudioModelsResponse> {
    return from(this.settingsService.getBaseUrl()).pipe(
      switchMap(baseUrl => {
        const url = `${baseUrl ?? this.defaultBaseUrl}/v1/models`;
        console.log(url);
        return this.http.get<LmStudioModelsResponse>(url);
      })
    );
  }
  sendChat(body: LmStudioChatRequest): Observable<LmStudioChatResponse> {
    return from(this.settingsService.getBaseUrl()).pipe(
      switchMap(baseUrl => {
        const url = `${baseUrl ?? this.defaultBaseUrl}/v1/chat/completions`;
        return this.http.post<LmStudioChatResponse>(url, body);
      })
    );
  }
}
