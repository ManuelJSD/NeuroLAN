import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LmStudioModelsResponse,
  LmStudioChatRequest,
  LmStudioChatResponse,
} from '../models/lmstudio.model';

@Injectable({
  providedIn: 'root',
})
export class LmStudioService {

  private http = inject(HttpClient);

  private readonly baseUrl = 'http://127.0.0.1:7788/v1';

  getModels(): Observable<LmStudioModelsResponse> {
    const url = `${this.baseUrl}/models`;
    return this.http.get<LmStudioModelsResponse>(url);
  }

  sendChat(body: LmStudioChatRequest): Observable<LmStudioChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    return this.http.post<LmStudioChatResponse>(url, body);
  }

}
