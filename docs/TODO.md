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

## v1.1 — Streaming and chat UX

- [x] Response streaming (SSE), enabled by default with a toggle in Settings.
- [x] Delete all conversation history from Settings with a confirmation dialog.
- [x] Streaming metrics: Time to First Token (TTFT) and tokens per second (tok/s).
- [x] Copy message and code blocks to clipboard.
- [x] Search across conversation history.
- [x] Import / export conversations (JSON or Markdown).
- [ ] Message editing, regeneration, and turn cancellation.

## v1.2 — Model & System Management

- [ ] Multiple server profiles (save several URLs/ports and switch between them).
- [ ] View models currently loaded in memory (VRAM/RAM).
- [ ] Load and unload models from memory.
- [ ] Model details: quantization, disk size, estimated VRAM usage.
- [ ] Real-time CPU and RAM usage.
- [ ] GPU/VRAM monitoring (best-effort, depends on OS and drivers).
- [ ] Backend connection status indicator.
- [ ] Per-model saved parameters (temperature, system prompt, thinking level).

## v1.3 — Advanced Chat & Multimodal

- [ ] System prompt and per-conversation parameters (temperature, max tokens, top_p).
- [ ] Voice input (Speech-to-Text) and response reading (Text-to-Speech).
- [ ] Thinking traces UI: collapsible reasoning blocks and thinking level controls.
- [ ] Multimodal support (drag and drop images for vision models).

## v2.0 — Agents, Tools & Extensibility

- [ ] Web search and external tool support (Function Calling).
- [ ] Artifacts Sandbox: real-time preview environment for generated HTML/JS/CSS.
- [ ] Visual inspection: allow vision models to take screenshots of the sandbox for autonomous styling.
- [ ] Architecture extensible for other API protocols (e.g. Anthropic).

## v2.x (Future) — RAG & Documents

- [ ] Attach files to the chat (PDF, TXT, source code).
- [ ] Local semantic search / RAG over documents.
- [ ] Show sources and citations in responses.
