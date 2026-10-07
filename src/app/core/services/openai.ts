import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import {
  OpenAIChatModelsResponse,
  OpenAIChatRequest,
  OpenAIChatResponse,
  ToolCall,
} from '../models/openai.model';
import { SettingsService } from './settings';

// Discriminated union emitted by sendChatStream.
// Callers switch on `type` to handle text tokens vs tool call results.
export type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'tool_calls'; toolCalls: ToolCall[] }
  | { type: 'done' };

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

  /**
   * Sends a chat request with SSE streaming.
   *
   * Emits StreamChunk values:
   *  - { type: 'text', content }      — a text token from the model
   *  - { type: 'tool_calls', toolCalls } — emitted once when the model finishes
   *                                        requesting one or more tool calls
   *  - { type: 'done' }               — stream completed (subscriber should complete)
   *
   * Tool call arguments arrive split across multiple SSE chunks, so they are
   * accumulated in-memory and only emitted as a complete object when the stream ends.
   */
  sendChatStream(body: OpenAIChatRequest): Observable<StreamChunk> {
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
        })
          .then((response) => {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            // Accumulator for streamed tool call fragments.
            // Keyed by index (models may request multiple tool calls in parallel).
            const toolCallAccumulator: Record<number, ToolCall> = {};

            function read() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  // If the model requested tool calls, emit them now that the
                  // arguments string is fully assembled.
                  const accumulated = Object.values(toolCallAccumulator);
                  if (accumulated.length > 0) {
                    observer.next({ type: 'tool_calls', toolCalls: accumulated });
                  }
                  observer.next({ type: 'done' });
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
                    const delta = json.choices?.[0]?.delta;
                    if (!delta) continue;

                    // --- Text token ---
                    if (delta.content) {
                      observer.next({ type: 'text', content: delta.content });
                    }

                    // --- Tool call delta ---
                    // The model sends tool_calls in fragments: first the id/name,
                    // then the arguments string piece by piece.
                    if (delta.tool_calls) {
                      for (const tcDelta of delta.tool_calls) {
                        const idx: number = tcDelta.index ?? 0;

                        if (!toolCallAccumulator[idx]) {
                          // First delta for this tool call — initialise the entry
                          toolCallAccumulator[idx] = {
                            id: tcDelta.id ?? '',
                            type: 'function',
                            function: {
                              name: tcDelta.function?.name ?? '',
                              arguments: tcDelta.function?.arguments ?? '',
                            },
                          };
                        } else {
                          // Subsequent deltas — append to the arguments string
                          toolCallAccumulator[idx].function.arguments +=
                            tcDelta.function?.arguments ?? '';
                        }
                      }
                    }
                  } catch {
                    // Ignore malformed JSON chunks
                  }
                }

                read();
              });
            }

            read();
          })
          .catch((err) => {
            if (err?.name !== 'AbortError') {
              observer.error(err);
            }
          });
      });

      // Cleanup: abort the fetch when the subscriber unsubscribes
      return () => controller.abort();
    });
  }
}

