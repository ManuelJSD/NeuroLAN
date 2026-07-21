# Notas de arquitectura

## ¿Por qué la API compatible con OpenAI?

La API REST de OpenAI se ha convertido en el estándar de facto para servidores de inferencia locales. Tanto LM Studio como Ollama exponen un endpoint `/v1/chat/completions` que sigue el mismo formato de petición y respuesta que la API en la nube de OpenAI.

Usar este protocolo como capa de comunicación implica:

- Sin código específico de ningún proveedor. Un solo servicio, múltiples backends.
- Fácil de ampliar para soportar otros servidores compatibles en el futuro.
- Formato familiar para cualquiera que haya trabajado con el SDK de OpenAI.

Si en el futuro se necesita soporte para un protocolo distinto (por ejemplo `/v1/messages` de Anthropic), el enfoque sería crear un servicio separado junto a `OpenAIService` y dejar que el usuario elija el protocolo en Ajustes — no modificar el servicio existente.

---

## Capa de servicios

### `OpenAIService` (`src/app/core/services/openai.ts`)

Gestiona toda la comunicación HTTP con el servidor de inferencia. Lee la `baseUrl` configurada en `SettingsService` antes de cada petición, de forma que el servidor puede cambiarse en tiempo de ejecución sin reiniciar la app.

Métodos actuales:
- `getModels()` — llama a `/v1/models` y devuelve la lista de modelos disponibles.
- `sendChat(body)` — envía una petición de completado de chat a `/v1/chat/completions`.

Planificado:
- `sendChatStream(body)` — versión con streaming usando la API nativa `fetch` y `ReadableStream`, que devuelve un `Observable<string>` el cual emite tokens a medida que llegan del servidor.

### `ConversationService` (`src/app/core/services/conversation.ts`)

Gestiona la lista de conversaciones usando [LocalForage](https://localforage.github.io/localForage/) para persistencia offline. Expone un observable reactivo `conversations$` que actualiza la barra lateral automáticamente cada vez que se guarda o elimina una conversación.

### `SettingsService` (`src/app/core/services/settings.ts`)

Envuelve `@ionic/storage` para persistir las preferencias del usuario (URL del servidor, idioma). Gestiona la inicialización asíncrona del almacenamiento internamente, de forma que otros servicios pueden llamar siempre a `getBaseUrl()` sin preocuparse por el orden de inicialización.

---

## Modelos de datos

### `openai.model.ts`

Contiene interfaces TypeScript que replican el formato de peticiones y respuestas de la API de OpenAI:

- `OpenAIChatRequest` / `OpenAIChatResponse` — chat completions estándar (sin streaming).
- `OpenAIChatChunkResponse` *(planificado)* — formato de chunk para streaming. En modo streaming, el contenido llega token a token en `choices[0].delta.content` en lugar de `choices[0].message.content`.
- `OpenAIModel` / `OpenAIChatModelsResponse` — listado de modelos (`/v1/models`).
- `ChatMessage` / `ChatRole` — formato de mensaje compartido en toda la app.
- `UsageTokens` — estadísticas de tokens incluidas en la respuesta de la API.

### `conversation.model.ts`

La interfaz `Conversation` usada para el almacenamiento local:

```typescript
interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}
```

---

## Diseño del streaming (planificado para v1.1)

La implementación del streaming usará la API nativa `fetch` con `ReadableStream` en lugar del `HttpClient` de Angular. `HttpClient` no es adecuado para consumir respuestas parciales de forma incremental — almacena toda la respuesta en memoria antes de emitirla.

El flujo:
1. `OpenAIService.sendChatStream()` envía una petición POST con `stream: true` en el cuerpo.
2. Lee el cuerpo de la respuesta como un `ReadableStream` y decodifica cada fragmento con `TextDecoder`.
3. Extrae y parsea como JSON cada línea que comienza por `data:`.
4. El campo `delta.content` de cada fragmento se emite mediante un `Observable<string>`.
5. El componente de chat se suscribe al observable y añade cada token al mensaje actual del asistente en tiempo real.
6. Cuando el servidor envía `data: [DONE]`, el stream finaliza y la conversación se guarda.

El streaming estará **activado por defecto** y podrá desactivarse en Ajustes (almacenado a través de `SettingsService`).

---

## Estructura de carpetas

```text
src/app/
 ├── core/
 │    ├── models/         # Interfaces TypeScript y modelos de datos
 │    └── services/       # Lógica de negocio y comunicación con la API
 └── pages/
      ├── chat/           # Vista principal de chat
      ├── conversations/  # Lista de conversaciones en la barra lateral
      └── settings/       # URL del servidor, idioma y preferencias
```
