import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import {
  OpenAIChatModelsResponse,
  OpenAIChatRequest,
  OpenAIChatResponse,
} from '../models/openai.model';
import { SettingsService } from './settings';

@Injectable({
  providedIn: 'root',
})
export class OpenAIService {
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

  getModels(): Observable<OpenAIChatModelsResponse> {
    return from(this.settingsService.getBaseUrl()).pipe(
      switchMap((baseUrl) => {
        const cleanBaseUrl = this.getCleanUrl(baseUrl);
        const url = `${cleanBaseUrl}/v1/models`;
        console.log('Requesting models from:', url);
        return this.http.get<OpenAIChatModelsResponse>(url);
      }),
    );
  }
  sendChat(body: OpenAIChatRequest): Observable<OpenAIChatResponse> {
    return from(this.settingsService.getBaseUrl()).pipe(
      switchMap((baseUrl) => {
        const cleanBaseUrl = this.getCleanUrl(baseUrl);
        const url = `${cleanBaseUrl}/v1/chat/completions`;
        console.log('Sending chat to:', url);
        return this.http.post<OpenAIChatResponse>(url, body);
      }),
    );
  }

  sendChatStream(body: OpenAIChatRequest): Observable<string> {
    return new Observable((observer) => {
      const controller = new AbortController();

      this.settingsService.getBaseUrl().then((baseUrl) => {
        const cleanBaseUrl = this.getCleanUrl(baseUrl);
        const url = `${cleanBaseUrl}/v1/chat/completions`;
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, stream: true }),
          signal: controller.signal,
        }).then((r) => {
          const reader = r.body!.getReader();
          const decoder = new TextDecoder();

          function read() {
            reader.read().then(({ done, value }) => {
              if (done) {
                observer.complete();
                return;
              }
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const json = JSON.parse(data);
                  const text = json.choices?.[0]?.delta?.content;
                  if (text) observer.next(text);
                } catch {}
              }

              read();
            });
          }

          read();
        });
      });

      // Cleanup: abort the fetch when the subscriber unsubscribes
      return () => controller.abort();
    });
  }
}
