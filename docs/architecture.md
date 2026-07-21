# Architecture notes

## Why the OpenAI-compatible API?

The OpenAI REST API has become the de facto standard for local inference servers. Both LM Studio and Ollama expose a `/v1/chat/completions` endpoint that follows the same request/response format as the OpenAI cloud API.

Using this protocol as the communication layer means:

- No vendor-specific code. One service, multiple backends.
- Easy to add support for other compatible servers in the future.
- Familiar format for anyone who has worked with the OpenAI SDK.

If support for a different protocol is needed in the future (e.g. Anthropic's `/v1/messages`), the approach would be to create a separate service alongside `OpenAIService` and let the user choose the protocol in Settings — not to modify the existing service.

---

## Service layer

### `OpenAIService` (`src/app/core/services/openai.ts`)

Handles all HTTP communication with the inference server. It reads the configured `baseUrl` from `SettingsService` before every request, so the server can be changed at runtime without restarting the app.

Current methods:
- `getModels()` — calls `/v1/models` and returns the list of available models.
- `sendChat(body)` — sends a chat completion request to `/v1/chat/completions`.

Planned:
- `sendChatStream(body)` — streaming version using the native `fetch` API and `ReadableStream`, returning an `Observable<string>` that emits tokens as they arrive from the server.

### `ConversationService` (`src/app/core/services/conversation.ts`)

Manages the conversation list using [LocalForage](https://localforage.github.io/localForage/) for offline persistence. Exposes a reactive `conversations$` observable so the sidebar updates automatically whenever a conversation is saved or deleted.

### `SettingsService` (`src/app/core/services/settings.ts`)

Wraps `@ionic/storage` to persist user preferences (server URL, language). It handles async storage initialization internally so other services can always call `getBaseUrl()` safely without worrying about initialization order.

---

## Data models

### `openai.model.ts`

Contains TypeScript interfaces that mirror the OpenAI API request and response shapes:

- `OpenAIChatRequest` / `OpenAIChatResponse` — standard (non-streaming) chat completions.
- `OpenAIChatChunkResponse` *(planned)* — streaming chunk format. In streaming mode, content arrives token by token in `choices[0].delta.content` instead of `choices[0].message.content`.
- `OpenAIModel` / `OpenAIChatModelsResponse` — model listing (`/v1/models`).
- `ChatMessage` / `ChatRole` — shared message format used across the app.
- `UsageTokens` — token usage stats included in the API response.

### `conversation.model.ts`

The `Conversation` interface used for local storage:

```typescript
interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}
```

---

## Streaming design (planned for v1.1)

The streaming implementation will use the native `fetch` API with `ReadableStream` instead of Angular's `HttpClient`. `HttpClient` is not suitable for consuming partial responses incrementally — it buffers the full response before emitting.

The flow:
1. `OpenAIService.sendChatStream()` sends a POST request with `stream: true` in the body.
2. It reads the response body as a `ReadableStream` and decodes each chunk with `TextDecoder`.
3. Each line starting with `data:` is extracted and parsed as JSON.
4. The `delta.content` field from each chunk is emitted via an `Observable<string>`.
5. The chat component subscribes to the observable and appends each token to the current assistant message in real time.
6. When the server sends `data: [DONE]`, the stream ends and the conversation is saved.

Streaming will be **enabled by default** and can be toggled off in Settings (stored via `SettingsService`).

---

## Folder structure

```text
src/app/
 ├── core/
 │    ├── models/         # TypeScript interfaces and data models
 │    └── services/       # Business logic and API communication
 └── pages/
      ├── chat/           # Main chat view
      ├── conversations/  # Sidebar conversation list
      └── settings/       # Server URL, language, and preferences
```
