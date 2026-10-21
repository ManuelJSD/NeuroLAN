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

## v1.1 — Streaming and Chat UX (Done)

- [x] Response streaming (SSE), enabled by default with a toggle in Settings.
- [x] Delete all conversation history from Settings with a confirmation dialog.
- [x] Streaming metrics: Time to First Token (TTFT) and tokens per second (tok/s).
- [x] Copy message and code blocks to clipboard.
- [x] Search across conversation history.
- [x] Import / export conversations (JSON or Markdown).
- [x] Message editing, regeneration, and turn cancellation.
- [x] Temporary / no-save conversations.

## v1.2 — Web Search & Tools (Done)

### Web Search

- [x] Automatic web search.
- [x] Expose Web Search as a tool available to the model.
- [x] Allow the model to decide automatically when a search is necessary.
- [x] Execute search → return results to the model → generate final response.
- [x] Display search activity/status in the chat.
- [x] Show sources/citations for web results.
- [x] Open source links from the response.
- [x] Enable/disable Web Search from Settings.
- [x] Handle search errors, timeouts and cancellation.

### Tool infrastructure

- [x] Generic tool execution architecture.
- [x] Tool call state in the conversation.
- [x] Tool execution UI.
- [x] Tool errors and cancellation.
- [x] Support streamed tool calls.
- [x] Handle models with unsupported or unreliable tool calling.

## v1.3 — Long-term Memory (Done)

- [x] Automatic background memory extraction (fire-and-forget).
- [x] Local persistence of memories with LocalForage.
- [x] Contextual injection of user memories into system prompt.
- [x] Semantic deduplication and support for add, update, and delete memory actions.
- [x] Enable/disable memory toggle in Settings.
- [x] Configurable memory limit and extraction frequency (throttling) in Settings.
- [x] Manual memory management (create, edit, delete) in Settings.
- [x] ChatGPT-style user feedback badge in assistant messages with expandable details and direct link to Settings.

## v1.4 — Multimodal & Files

### Images

- [x] Image attachments.
- [x] Image preview before sending.
- [x] Remove images before sending.
- [x] Send images using the OpenAI-compatible multimodal format.
- [ ] Detect/configure model vision capability.
- [ ] Disable image attachment when the selected model does not support vision.
- [ ] Show vision capability in the model selector.

### Files

- [x] Generic file attachment system.
- [x] File type and size validation.
- [x] TXT files.
- [x] Source code files.
- [x] PDF text extraction.
- [x] Include extracted file contents in the model request.
- [x] File preview/removal before sending.
- [x] Show attached files in messages.

## v1.5 — Voice

### Speech-to-Text

- [ ] Voice input.
- [ ] Start/stop recording.
- [ ] Convert audio to text.
- [ ] Edit transcription before sending.
- [ ] Handle microphone permissions/errors.

### Text-to-Speech

- [ ] Read assistant responses aloud.
- [ ] Play/pause/stop controls.
- [ ] Voice/language configuration.

## v1.6 — Multi-Server & Model Management

### Server aggregation

- [ ] Configure multiple OpenAI-compatible servers.
- [ ] Check server availability.
- [ ] Retrieve models from all configured servers.
- [ ] Show all available models in a unified model selector.
- [ ] Show the server/provider associated with each model.
- [ ] Remember which server provides each model.
- [ ] Handle duplicate model names from different servers.
- [ ] Indicate unavailable/offline servers.

### Model capabilities

- [ ] Detect/store model capabilities where available.
- [ ] Vision capability.
- [ ] Tool/function calling capability.
- [ ] Reasoning/thinking capability.
- [ ] Streaming capability.
- [ ] Show relevant capabilities in the model selector and chat UI.

### Model configuration

- [ ] Per-model saved parameters.
- [ ] Temperature.
- [ ] System prompt.
- [ ] Thinking/reasoning level.
- [ ] Other model-specific parameters where supported.

## v1.7 — Advanced Chat

- [ ] System prompt per conversation.
- [ ] Temperature per conversation.
- [ ] Max tokens per conversation.
- [ ] Top_p and other sampling parameters.
- [ ] Thinking/reasoning UI.
- [ ] Collapsible reasoning blocks.
- [ ] Thinking level controls.
- [ ] Better tool-call visualization.
- [ ] Better handling of multimodal messages.

## v2.0 — Agents & Extensibility

- [ ] Multi-step tool execution.
- [ ] Agent execution loop.
- [ ] Multiple tools in the same conversation.
- [ ] Tool permissions/confirmation.
- [ ] Tool execution limits.
- [ ] Tool execution history.
- [ ] Extensible tool system.
- [ ] Support for additional API protocols (e.g. Anthropic).

### Artifacts

- [ ] Artifacts Sandbox.
- [ ] Real-time HTML/CSS/JS preview.
- [ ] Execute generated frontend code in an isolated environment.
- [ ] Visual inspection with vision models.
- [ ] Allow models to inspect screenshots of the sandbox.

## v2.x — Backend & Synchronization

- [ ] Optional backend mode.
- [ ] Keep local-only mode fully functional without a backend.
- [ ] User registration.
- [ ] Authentication.
- [ ] JWT authentication.
- [ ] Backend conversation storage.
- [ ] Synchronize conversations between devices.
- [ ] Conversation conflict handling.
- [ ] Backend ↔ LM Studio/OpenAI-compatible server communication.
- [ ] Optional backend proxy for model requests.

## v2.x — RAG & Document Library

- [ ] Persistent document library.
- [ ] Local document indexing.
- [ ] Embeddings.
- [ ] Local vector storage.
- [ ] Semantic search.
- [ ] RAG over documents.
- [ ] Retrieve relevant document chunks during conversations.
- [ ] Document sources/citations.
- [ ] Document management UI.
