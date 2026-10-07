import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonSelect,
  IonSelectOption,
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
  OpenAIModel,
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
} from 'ionicons/icons';
import { ConversationService } from 'src/app/core/services/conversation';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiService } from 'src/app/core/services/ui-service';
import { SettingsService } from 'src/app/core/services/settings';
import { WebSearchService } from 'src/app/core/services/search/web-search.service';
import { SearchResult } from 'src/app/core/services/search/search-provider.interface';
import { Subscription } from 'rxjs';

// Maximum number of tool-calling iterations before giving up (prevents infinite loops)
const MAX_TOOL_ITERATIONS = 5;

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
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    IonIcon,
    MarkdownComponent,
    TranslatePipe,
  ],
})
export class ChatPage implements OnInit, OnDestroy {
  public uiService = inject(UiService);

  private route = inject(ActivatedRoute);
  private openAIService = inject(OpenAIService);
  private settingsService = inject(SettingsService);
  private conversationService = inject(ConversationService);
  private translateService = inject(TranslateService);
  private ngZone = inject(NgZone);
  public webSearchService = inject(WebSearchService);

  private activeSubscription?: Subscription;

  models: OpenAIModel[] = [];
  selectedModelKey: string = '';

  messages: ChatMessage[] = [];
  userInput: string = '';
  temporaryChat: boolean = false;

  // Web Search state
  webSearchEnabled: boolean = false;
  // Stores the sources from the last search to display them in the UI
  lastSearchSources: SearchResult[] = [];

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
        if (history.state && history.state.message) {
          // Assign ID directly (since it's a new chat)
          this.currentConversationId = id;

          this.userInput = history.state.message;
          this.selectedModelKey = history.state.model;
          this.temporaryChat = history.state.temporaryChat;

          history.replaceState({ ...history.state, message: null }, '');

          // Send request to OpenAI
          this.sendMessage();
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

  newChat() {
    this.messages = [];
    this.userInput = '';
    this.errorMessage = null;
    this.isSending = false;
    this.currentConversationId = this.generateId();
    this.currentConversationCreatedAt = Date.now();
    this.temporaryChat = false;
    this.lastSearchSources = [];
    this.webSearchService.reset();
    this.cancelEdit();
  }

  loadConversation(id: string) {
    this.conversationService.getConversationsbyId(id).then((c) => {
      if (c) {
        this.currentConversationId = c.id;
        this.currentConversationCreatedAt = c.createdAt;
        this.messages = c.messages;
      }
    });
  }

  async sendMessage() {
    const userText = this.userInput.trim();

    // Exit if input is empty
    if (userText === '') return;

    // Check that a model is selected
    if (!this.selectedModelKey) {
      this.errorMessage = this.translateService.instant(
        'CHAT.ERROR_SELECT_MODEL',
      );
      return;
    }

    // Append the user's message
    this.messages.push({
      role: 'user',
      content: userText,
    });

    // Clear the input
    this.userInput = '';
    await this.sendToAPI();
  }

  private async loadWebSearchSetting(): Promise<void> {
    this.webSearchEnabled = await this.settingsService.getWebSearchEnabled();
  }

  async sendToAPI() {
    this.isSending = true;
    this.errorMessage = null;
    this.lastSearchSources = [];
    this.webSearchService.reset();

    const startTime = Date.now();
    const streaming = (await this.settingsService.getStreamMode()) ?? true;
    const tools = this.webSearchEnabled ? [WEB_SEARCH_TOOL] : undefined;

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
              .sendChat({ model: this.selectedModelKey, messages: this.messages, tools })
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
        this.isSending = false;
        this.saveConversationIfNeeded();
        return;

      } else {
        // ── Streaming path ──────────────────────────────────────────────────
        let receivedToolCalls: ToolCall[] = [];
        let tokenCount = 0;
        let tokenStartTime = 0;
        const messagesToSend = [...this.messages];
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

        try {
          const results = await this.webSearchService.search(query);
          // Store sources for display in the UI
          this.lastSearchSources = this.webSearchService.getLastResults();
          resultContent = results;
        } catch (err: any) {
          resultContent = `Search failed: ${err?.message ?? 'unknown error'}`;
        }

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

  onEnterKey(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
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
        this.conversationService.saveConversation({
          id: this.currentConversationId,
          title: this.messages[0].content.substring(0, 50),
          messages: this.messages,
          createdAt: this.currentConversationCreatedAt,
        });
      }
    }
  }

  private saveConversationIfNeeded(): void {
    if (!this.temporaryChat && this.messages.length > 0) {
      this.conversationService.saveConversation({
        id: this.currentConversationId,
        title: this.messages[0].content.substring(0, 50),
        messages: this.messages,
        createdAt: this.currentConversationCreatedAt,
      });
    }
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

      this.messages[index].content = this.editingMessageText;

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
