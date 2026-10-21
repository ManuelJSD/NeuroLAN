import { Component, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonLabel,
  IonTextarea,
  IonSpinner,
  IonChip,
  IonIcon,
  IonButton,
  IonToast,
} from '@ionic/angular/standalone';
import { OpenAIService, StreamChunk } from 'src/app/core/services/openai';
import {
  ChatMessage,
  ImageContentPart,
  MessageContent,
  OpenAIModel,
  TextContentPart,
  Tool,
  ToolCall,
  UsageTokens,
} from 'src/app/core/models/openai.model';
import { MarkdownComponent } from 'ngx-markdown';
import { addIcons } from 'ionicons';
import {
  createOutline,
  refreshOutline,
  menuOutline,
  copyOutline,
  hourglassOutline,
  pencilOutline,
  chevronDownOutline,
  chevronUpOutline,
  settingsOutline,
  attachOutline,
  closeCircleOutline,
  documentTextOutline,
  codeSlashOutline,
} from 'ionicons/icons';
import { ConversationService } from 'src/app/core/services/conversation';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiService } from 'src/app/core/services/ui-service';
import { SettingsService } from 'src/app/core/services/settings';
import { WebSearchService } from 'src/app/core/services/search/web-search.service';
import { SearchResult } from 'src/app/core/services/search/search-provider.interface';
import { MemoryService } from 'src/app/core/services/memory.service';
import { FileAttachmentService, AttachedFile } from 'src/app/core/services/file-attachment.service';
import {
  ChatInputComponent,
  ChatInputPayload,
} from 'src/app/shared/components/chat-input/chat-input.component';
import { Subscription, firstValueFrom } from 'rxjs';

// Maximum number of tool-calling iterations before giving up (prevents infinite loops)
const MAX_TOOL_ITERATIONS = 5;

/**
 * Extracts a plain-text representation from any MessageContent value.
 * - If content is already a string, returns it as-is.
 * - If content is a multimodal array, concatenates the text parts.
 * Used wherever legacy string-only APIs (e.g. search queries, titles) need a string.
 */
function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') return content;
  return content
    .filter((p): p is TextContentPart => p.type === 'text')
    .map((p) => p.text)
    .join(' ');
}

/** Represents a single step in the processing status panel */
interface ProcessStep {
  label: string;
  state: 'active' | 'done';
}

// Tool definition sent to the model so it knows web search is available
const WEB_SEARCH_TOOL: Tool = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      'Search the web for up-to-date information. Use this when the user asks about current events, real-time data, or anything your training data may not cover.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to look up.',
        },
      },
      required: ['query'],
    },
  },
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    IonToast,
    IonButton,
    IonChip,
    IonLabel,
    IonContent,
    CommonModule,
    DecimalPipe,
    FormsModule,
    IonTextarea,
    IonSpinner,
    IonIcon,
    MarkdownComponent,
    TranslatePipe,
    ChatInputComponent,
  ],
})
export class ChatPage implements OnInit, OnDestroy {
  public uiService = inject(UiService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private openAIService = inject(OpenAIService);
  private settingsService = inject(SettingsService);
  private conversationService = inject(ConversationService);
  private translateService = inject(TranslateService);
  private ngZone = inject(NgZone);
  public webSearchService = inject(WebSearchService);
  private memoryService = inject(MemoryService);

  private activeSubscription?: Subscription;

  @ViewChild(ChatInputComponent) chatInput?: ChatInputComponent;

  models: OpenAIModel[] = [];
  selectedModelKey: string = '';

  messages: ChatMessage[] = [];
  userInput: string = '';
  temporaryChat: boolean = false;

  /** Exposed service so the template can call helpers (humanSize, categoryIcon, etc.) */
  public fileAttachmentService = inject(FileAttachmentService);

  // Web Search state
  webSearchEnabled: boolean = false;
  // Stores the sources from the last search to display them in the UI
  lastSearchSources: SearchResult[] = [];

  // Processing steps shown to the user while waiting for a response
  processingSteps: ProcessStep[] = [];

  // Opt-in web search toggle for the current message (resets after each send)
  searchThisMessage: boolean = false;

  get totalConversationTokens(): number {
    return this.messages.reduce(
      (total, msg) => total + (msg.tokensCount || 0),
      0,
    );
  }
  isSending = false;
  errorMessage: string | null = null;
  currentConversationId: string = this.generateId();
  currentConversationCreatedAt: number = Date.now();

  isCopyToastOpen = false;

  editingMessageIndex: number = -1;
  editingMessageText: string = '';

  constructor() {
    addIcons({
      createOutline,
      refreshOutline,
      menuOutline,
      copyOutline,
      hourglassOutline,
      pencilOutline,
      chevronDownOutline,
      chevronUpOutline,
      settingsOutline,
      attachOutline,
      closeCircleOutline,
      documentTextOutline,
      codeSlashOutline,
    });
  }

  ngOnInit(): void {
    this.loadModels();
    this.loadWebSearchSetting();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (id) {
        // 1. Try to load history if it's not the current chat
        if (this.currentConversationId !== id) {
          this.loadConversation(id);
        }
        // 2. Check if Home just sent a message through router state
        if (
          history.state &&
          (history.state.message ||
            (history.state.attachedImages &&
              history.state.attachedImages.length > 0) ||
            (history.state.attachedFiles &&
              history.state.attachedFiles.length > 0))
        ) {
          // Assign ID directly (since it's a new chat)
          this.currentConversationId = id;

          const initialPayload: ChatInputPayload = {
            text: history.state.message || '',
            images: history.state.attachedImages || [],
            files: history.state.attachedFiles || [],
            model: history.state.model || this.selectedModelKey,
            temporaryChat: history.state.temporaryChat ?? false,
            searchThisMessage: history.state.searchThisMessage ?? false,
          };

          this.temporaryChat = initialPayload.temporaryChat ?? false;
          if (initialPayload.model) {
            this.selectedModelKey = initialPayload.model;
          }

          history.replaceState(
            {
              ...history.state,
              message: null,
              attachedImages: null,
              attachedFiles: null,
            },
            '',
          );

          // Send request to OpenAI
          this.sendMessage(initialPayload);
        }
      } else {
        // Fallback security check for missing ID
        this.newChat();
      }
    });
  }

  loadModels() {
    this.openAIService.getModels().subscribe({
      next: (res) => {
        this.models = res.data;
        if (!this.selectedModelKey && res.data.length > 0) {
          this.selectedModelKey = res.data[0].id;
        }
      },
      error: (err) => console.error(err),
    });
  }

  /** Called whenever the model selector value changes in the chat view. */
  onModelChange(modelId: string) {
    this.selectedModelKey = modelId;
  }

  newChat() {
    this.messages = [];
    this.userInput = '';
    this.errorMessage = null;
    this.isSending = false;
    this.currentConversationId = this.generateId();
    this.currentConversationCreatedAt = Date.now();
    this.temporaryChat = false;
    this.lastSearchSources = [];
    this.searchThisMessage = false;
    this.webSearchService.reset();
    this.cancelEdit();
    this.chatInput?.clear();
  }

  loadConversation(id: string) {
    this.conversationService.getConversationsbyId(id).then((c) => {
      if (c) {
        this.currentConversationId = c.id;
        this.currentConversationCreatedAt = c.createdAt;
        this.messages = c.messages;
        this.searchThisMessage = false;
      }
    });
  }

  async sendMessage(payload?: ChatInputPayload) {
    const userText = (payload ? payload.text : this.userInput).trim();
    const images = payload ? payload.images : [];
    const files = payload ? payload.files : [];

    if (payload?.model) {
      this.selectedModelKey = payload.model;
    }
    if (payload?.searchThisMessage !== undefined) {
      this.searchThisMessage = payload.searchThisMessage;
    }

    // Exit if text, images, and files are all empty
    if (
      userText === '' &&
      images.length === 0 &&
      files.length === 0
    )
      return;

    // Check that a model is selected, fallback if needed
    if (!this.selectedModelKey) {
      if (this.models.length > 0) {
        this.selectedModelKey = this.models[0].id;
      } else {
        try {
          const res = await firstValueFrom(this.openAIService.getModels());
          this.models = res.data;
          this.selectedModelKey = res.data[0]?.id || '';
        } catch {}
      }
    }

    if (!this.selectedModelKey) {
      this.errorMessage = this.translateService.instant(
        'CHAT.ERROR_SELECT_MODEL',
      );
      return;
    }

    // Build content: plain string if no images, multimodal array otherwise
    let content: MessageContent;
    if (images.length === 0) {
      content = userText;
    } else {
      const parts: (TextContentPart | ImageContentPart)[] = [];
      if (userText) {
        parts.push({ type: 'text', text: userText });
      }
      for (const dataUrl of images) {
        parts.push({ type: 'image_url', image_url: { url: dataUrl } });
      }
      content = parts;
    }

    // Save file metadata for display in the message bubble (content stays in service)
    const filesMeta = files.map((f) => ({
      name: f.name,
      size: f.size,
      category: f.category,
    }));

    // Append the user's message
    this.messages.push({
      role: 'user',
      content,
      attachedFiles: filesMeta.length > 0 ? filesMeta : undefined,
    });

    // Clear input
    this.userInput = '';
    await this.sendToAPI(files);
  }

  onFileError(err: string): void {
    this.errorMessage = err;
    setTimeout(() => {
      if (this.errorMessage === err) this.errorMessage = null;
    }, 4000);
  }

  private async loadWebSearchSetting(): Promise<void> {
    this.webSearchEnabled = await this.settingsService.getWebSearchEnabled();
  }

  async sendToAPI(pendingFiles: AttachedFile[] = []) {
    this.isSending = true;
    this.errorMessage = null;
    this.lastSearchSources = [];
    this.processingSteps = [];
    this.webSearchService.reset();

    const startTime = Date.now();
    const streaming = (await this.settingsService.getStreamMode()) ?? true;
    const searchMode = await this.settingsService.getSearchMode();

    // Prepend memory system message if memories are enabled
    const memorySystemMsg = await this.memoryService.buildMemorySystemMessage();
    if (memorySystemMsg) {
      // Only inject once: remove any previous memory system message before re-adding
      const firstMsg = this.messages[0];
      if (firstMsg?.role === 'system' && getTextContent(firstMsg.content).startsWith('[USER MEMORY')) {
        this.messages.shift();
      }
      this.messages.unshift(memorySystemMsg);
    }

    // Inject file context into the last user message for this API call only.
    // We work on a shallow copy so this.messages (and the UI) are never mutated.
    let messagesWithFiles: ChatMessage[] = [...this.messages];
    if (pendingFiles.length > 0) {
      const fileContext = this.fileAttachmentService.buildFileContext(pendingFiles);
      if (fileContext) {
        const lastUserIdx = [...messagesWithFiles]
          .reverse()
          .findIndex((m) => m.role === 'user');
        if (lastUserIdx !== -1) {
          const realIdx = messagesWithFiles.length - 1 - lastUserIdx;
          const lastUser = messagesWithFiles[realIdx];
          const originalText = getTextContent(lastUser.content);
          messagesWithFiles = [
            ...messagesWithFiles.slice(0, realIdx),
            { ...lastUser, content: fileContext + originalText },
            ...messagesWithFiles.slice(realIdx + 1),
          ];
        }
      }
    }

    // In RAG mode, only search if the user explicitly activated the toggle.
    // The toggle remains active for subsequent messages until the user disables it.
    let ragMessages: ChatMessage[] | undefined;
    if (this.webSearchEnabled && searchMode === 'rag' && this.searchThisMessage) {
      // Pass the file-enriched messages as base so RAG also benefits from file context
      ragMessages = await this.buildRagMessages(messagesWithFiles);
    }

    // Show the "generating" step once web search (if any) is done
    this.addStep(this.translateService.instant('CHAT.STEPS.GENERATING'));

    // In native mode, pass the tools array so the model can decide when to search.
    const tools =
      this.webSearchEnabled && searchMode === 'native' ? [WEB_SEARCH_TOOL] : undefined;

    // Use messagesWithFiles as the base for the tool-calling loop
    const baseMessages = messagesWithFiles;

    // --- Tool-calling loop ---
    // Each iteration sends the current messages to the model.
    // If the model requests a tool, we execute it, append the result, and loop.
    // If the model returns text, we display it and exit.
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {

      if (!streaming) {
        // ── Non-streaming path ──────────────────────────────────────────────
        let response: any;
        try {
          response = await new Promise((resolve, reject) => {
            this.activeSubscription = this.openAIService
              .sendChat({ model: this.selectedModelKey, messages: ragMessages ?? baseMessages, tools })
              .subscribe({ next: resolve, error: reject });
          });
        } catch (err) {
          console.error(err);
          this.errorMessage = this.translateService.instant('CHAT.ERROR_SEND_FAILED');
          this.isSending = false;
          return;
        }

        const choice = response.choices[0];

        if (choice.message.tool_calls?.length) {
          // Model wants to call a tool — execute and continue the loop
          this.messages.push({ role: 'assistant', content: '', tool_calls: choice.message.tool_calls });
          await this.executeToolCalls(choice.message.tool_calls);
          continue;
        }

        // Model returned a final text response
        const responseTime = (Date.now() - startTime) / 1000;
        this.messages.push({
          role: 'assistant',
          content: choice.message.content,
          responseTime,
          tokensCount: response.usage?.completion_tokens,
          sources: [...this.lastSearchSources],
        });
        this.clearSteps();
        this.isSending = false;
        this.saveConversationIfNeeded();
        return;

      } else {
        // ── Streaming path ──────────────────────────────────────────────────
        let receivedToolCalls: ToolCall[] = [];
        let tokenCount = 0;
        let tokenStartTime = 0;
        // In RAG mode use the enriched copy; otherwise use the base messages (may include file context).
        const messagesToSend = ragMessages ?? [...baseMessages];
        this.messages.push({ role: 'assistant', content: '' });

        const streamResult = await new Promise<'text' | 'tool_calls'>((resolve, reject) => {
          this.activeSubscription = this.openAIService
            .sendChatStream({ model: this.selectedModelKey, messages: messagesToSend, tools })
            .subscribe({
              next: (chunk: StreamChunk) => {
                this.ngZone.run(() => {
                  if (chunk.type === 'text') {
                    this.messages[this.messages.length - 1].content += chunk.content;
                    if (tokenCount === 0) tokenStartTime = Date.now();
                    tokenCount++;
                  } else if (chunk.type === 'tool_calls') {
                    receivedToolCalls = chunk.toolCalls;
                  }
                });
              },
              complete: () => resolve(receivedToolCalls.length > 0 ? 'tool_calls' : 'text'),
              error: reject,
            });
        }).catch((err) => {
          console.error(err);
          this.errorMessage = this.translateService.instant('CHAT.ERROR_SEND_FAILED');
          this.isSending = false;
          return null;
        });

        if (streamResult === null) return; // Error occurred
        this.clearSteps();

        if (streamResult === 'tool_calls') {
          // Strip the empty placeholder message we added before streaming
          this.messages.pop();
          this.messages.push({ role: 'assistant', content: '', tool_calls: receivedToolCalls });
          await this.executeToolCalls(receivedToolCalls);
          continue;
        }

        // Model returned a final text response via stream
        const responseTime = (Date.now() - startTime) / 1000;
        const tokenResponseTime = (Date.now() - tokenStartTime) / 1000;
        const tokensPerSecond = tokenResponseTime > 0 ? tokenCount / tokenResponseTime : 0;
        const lastMsg = this.messages[this.messages.length - 1];
        lastMsg.responseTime = responseTime;
        lastMsg.ttft = (tokenStartTime - startTime) / 1000;
        lastMsg.tokensPerSecond = tokensPerSecond;
        lastMsg.tokensCount = tokenCount;
        lastMsg.sources = [...this.lastSearchSources];

        this.clearSteps();
        this.isSending = false;
        this.saveConversationIfNeeded();
        return;
      }
    }

    // Reached iteration limit without a final text response
    this.errorMessage = this.translateService.instant('CHAT.ERROR_SEND_FAILED');
    this.isSending = false;
  }

  /**
   * Execute a list of tool calls requested by the model.
   * Currently only 'web_search' is supported.
   * Appends a 'tool' message for each call so the model can read the results.
   */
  private async executeToolCalls(toolCalls: ToolCall[]): Promise<void> {
    for (const tc of toolCalls) {
      if (tc.function.name === 'web_search') {
        let args: { query?: string } = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = { query: '' };
        }

        const query = args.query ?? '';
        let resultContent: string;

        // Show step: searching (native tool-calling mode)
        this.clearSteps();
        this.addStep(this.translateService.instant('CHAT.STEPS.TOOL_SEARCHING', { query }));

        try {
          const results = await this.webSearchService.search(query);
          // Store sources for display in the UI
          this.lastSearchSources = this.webSearchService.getLastResults();
          resultContent = results;
          const count = this.lastSearchSources.length;
          this.completeLastStep(
            this.translateService.instant('CHAT.STEPS.TOOL_SEARCH_DONE', { count })
          );
        } catch (err: any) {
          resultContent = `Search failed: ${err?.message ?? 'unknown error'}`;
          this.completeLastStep(
            this.translateService.instant('CHAT.STEPS.SEARCH_FAILED')
          );
        }

        // Show "generating" step now that search is complete
        this.addStep(this.translateService.instant('CHAT.STEPS.GENERATING'));

        this.messages.push({
          role: 'tool',
          content: resultContent,
          tool_call_id: tc.id,
        });
      } else {
        // Unknown tool — return an error message so the model can recover
        this.messages.push({
          role: 'tool',
          content: `Error: unknown tool "${tc.function.name}"`,
          tool_call_id: tc.id,
        });
      }
    }
  }

  /**
   * RAG mode: builds a copy of the messages array where the last user message
   * is enriched with web search results. The original this.messages is never
   * mutated, so the chat UI always shows the original user text.
   */
  /**
   * Builds a context-aware search query (Option B).
   * If the last user message is short or lacks specific terms, it enriches
   * the query with recent conversation context so follow-up questions
   * (e.g. "¿y en 2004?") produce relevant search results.
   */
  private buildSearchQuery(): string {
    const userMsgs = this.messages.filter((m) => m.role === 'user');
    const lastMsg = userMsgs[userMsgs.length - 1];
    if (!lastMsg) return '';

    const currentText = getTextContent(lastMsg.content).trim();

    // Find the most recent previous user message that is specific enough
    // to act as a topic anchor for the search engine.
    const anchor = [...userMsgs]
      .slice(0, -1)      // all except the last (current) message
      .reverse()
      .find((m) => getTextContent(m.content).trim().length >= 40);

    // Always combine anchor topic + current question so the search engine
    // understands the conversational context even for short follow-ups
    // or long messages that lack explicit topic keywords (e.g. "monturas").
    if (anchor) {
      return `${getTextContent(anchor.content).substring(0, 150)} ${currentText}`;
    }

    return currentText;
  }


  private async buildRagMessages(baseMessages?: ChatMessage[]): Promise<ChatMessage[]> {
    const msgSource = baseMessages ?? this.messages;
    const lastUserMsg = [...msgSource].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return [...msgSource];

    const query = this.buildSearchQuery();
    let searchResults: string;

    // Step 1: Searching
    this.addStep(this.translateService.instant('CHAT.STEPS.SEARCHING', { query: getTextContent(lastUserMsg.content).substring(0, 60) }));

    try {
      searchResults = await this.webSearchService.search(query);
      this.lastSearchSources = this.webSearchService.getLastResults();
      const count = this.lastSearchSources.length;
      this.completeLastStep(
        this.translateService.instant('CHAT.STEPS.SEARCH_DONE', { count })
      );
    } catch {
      // If the search fails, fall back to the original messages (model answers from training data)
      this.completeLastStep(
        this.translateService.instant('CHAT.STEPS.SEARCH_FAILED')
      );
      return [...msgSource];
    }

    // Step 2: Preparing context
    this.addStep(this.translateService.instant('CHAT.STEPS.PREPARING_CONTEXT'));
    // (context building is synchronous, so we mark it done immediately)
    this.completeLastStep(
      this.translateService.instant('CHAT.STEPS.CONTEXT_READY')
    );

    // Return a shallow copy where only the last user message has enriched content
    return msgSource.map((m) => {
      if (m !== lastUserMsg) return m;
      return {
        ...m,
        content:
          `[INFORMACIÓN WEB ACTUALIZADA]:\n${searchResults}\n\n` +
          `Usa la información anterior para responder a la siguiente pregunta. ` +
          `Si la respuesta no está en el contexto, indícalo.\n\n` +
          `PREGUNTA: ${query}`,
      };
    });
  }


  // ── Processing Steps helpers ──────────────────────────────────────────────

  /** Adds a new active step to the processing panel */
  private addStep(label: string): void {
    this.processingSteps.push({ label, state: 'active' });
  }

  /**
   * Marks the last step as done (optionally updating its label)
   * and transitions it to the 'done' state with a check icon.
   */
  private completeLastStep(newLabel?: string): void {
    const last = this.processingSteps[this.processingSteps.length - 1];
    if (!last) return;
    if (newLabel) last.label = newLabel;
    last.state = 'done';
  }

  /** Clears all steps once the model's response has arrived */
  private clearSteps(): void {
    this.processingSteps = [];
  }



  ngOnDestroy() {
    this.activeSubscription?.unsubscribe();
  }

  private generateId() {
    // Use randomUUID if available (secure context); otherwise, generate a random ID.
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    }
  }

  copyMessage(content: string) {
    navigator.clipboard.writeText(content);
    this.isCopyToastOpen = true;
  }

  stopGeneration() {
    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.isSending = false;
      this.webSearchService.cancel();

      const lastMessage = this.messages[this.messages.length - 1];
      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        !lastMessage.content
      ) {
        this.messages.pop();
      }

      if (!this.temporaryChat) {
        const firstUserMsg = this.messages.find((m) => m.role === 'user');
        this.conversationService.saveConversation({
          id: this.currentConversationId,
          title: getTextContent(firstUserMsg?.content ?? '...').substring(0, 50),
          messages: this.messages,
          createdAt: this.currentConversationCreatedAt,
        });
      }
    }
  }

  private saveConversationIfNeeded(): void {
    if (!this.temporaryChat && this.messages.length > 0) {
      const firstUserMsg = this.messages.find((m) => m.role === 'user');
      this.conversationService.saveConversation({
        id: this.currentConversationId,
        title: getTextContent(firstUserMsg?.content ?? '...').substring(0, 50),
        messages: this.messages,
        createdAt: this.currentConversationCreatedAt,
      });

      // Fire-and-forget memory extraction after each assistant response.
      // If LM Studio/Ollama is down at this point, the error is silently swallowed.
      this.settingsService.getBaseUrl().then((baseUrl) => {
        if (baseUrl) {
          this.memoryService
            .extractAndSaveMemories(
              this.messages,
              this.selectedModelKey,
              baseUrl,
            )
            .then((appliedActions) => {
              if (appliedActions && appliedActions.length > 0) {
                const lastAssistant = [...this.messages]
                  .reverse()
                  .find((m) => m.role === 'assistant');
                if (lastAssistant) {
                  lastAssistant.memoryActions = [
                    ...(lastAssistant.memoryActions || []),
                    ...appliedActions,
                  ];
                  this.conversationService.saveConversation({
                    id: this.currentConversationId,
                    title: getTextContent(firstUserMsg?.content ?? '...').substring(0, 50),
                    messages: this.messages,
                    createdAt: this.currentConversationCreatedAt,
                  });
                }
              }
            });
        }
      });
    }
  }

  toggleMemoryDetails(msg: ChatMessage) {
    msg.showMemoryDetails = !msg.showMemoryDetails;
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  regenerateLastResponse() {
    if (this.isSending || this.messages.length === 0) return;

    const lastMessage = this.messages[this.messages.length - 1];

    if (lastMessage && lastMessage.role === 'assistant') {
      this.messages.pop();
    }

    this.sendToAPI();
  }

  editMessage(index: number, currentText: string) {
    this.editingMessageIndex = index;
    this.editingMessageText = currentText;
  }
  cancelEdit() {
    this.editingMessageIndex = -1;
    this.editingMessageText = '';
  }
  saveEdit(index: number) {
    if (
      this.editingMessageIndex === index &&
      this.editingMessageText.trim() != ''
    ) {
      this.messages.splice(index + 1);

      this.messages[index].content = this.editingMessageText; // editingMessageText is always a string

      this.sendToAPI();

      this.cancelEdit();
    } else {
      console.error('Edit index does not match');
      this.cancelEdit();
    }
  }

  onEditKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.saveEdit(index);
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }
}
