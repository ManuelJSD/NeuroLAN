# TODO / Roadmap

## v1.0 — MVP (Done)

- [x] Functional chat (send and receive messages).
- [x] OpenAI-compatible API support (`/v1/models` and `/v1/chat/completions`).
- [x] LM Studio and Ollama support via configurable `baseUrl`.
- [x] Model selector in the UI.
- [x] Response time measurement per message.
- [x] Conversation management (create, rename, delete).
- [x] Local persistence with LocalForage.
- [x] Loading states, error handling and auto-scroll.
- [x] Rename services and models from LM Studio-specific to OpenAI-compatible naming.

## v1.1 — Streaming and chat improvements

- [ ] Response streaming (SSE), enabled by default with a toggle in Settings.
- [ ] Streaming metrics: Time to First Token (TTFT) and tokens per second (tok/s).
- [ ] Copy message and code blocks to clipboard.
- [ ] Search across conversation history.
- [ ] Import / export conversations (JSON or Markdown).

## Model and server management

- [ ] Multiple server profiles (save several URLs/ports and switch between them).
- [ ] View models currently loaded in memory (VRAM/RAM).
- [ ] Load and unload models from memory.
- [ ] Model details: quantization, disk size, estimated VRAM usage.

## System monitoring

- [ ] Real-time CPU and RAM usage.
- [ ] GPU/VRAM monitoring (best-effort, depends on OS and drivers).
- [ ] Backend connection status indicator.

## RAG and documents (future)

- [ ] Attach files to the chat (PDF, TXT, source code).
- [ ] Local semantic search / RAG over documents.
- [ ] Show sources and citations in responses.

## Advanced settings and tools

- [ ] System prompt and per-conversation parameters (temperature, max tokens, top_p).
- [ ] Voice input (Speech-to-Text) and response reading (Text-to-Speech).
- [ ] Web search and external tool support (Function Calling).
- [ ] Architecture extensible for other API protocols (e.g. Anthropic).
