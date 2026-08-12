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
} from '@ionic/angular/standalone';
import { OpenAIService } from 'src/app/core/services/openai';
import {
  ChatMessage,
  OpenAIModel,
  UsageTokens,
} from 'src/app/core/models/openai.model';
import { MarkdownComponent } from 'ngx-markdown';
import { addIcons } from 'ionicons';
import { createOutline, refreshOutline, menuOutline } from 'ionicons/icons';
import { ConversationService } from 'src/app/core/services/conversation';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiService } from 'src/app/core/services/ui-service';
import { SettingsService } from 'src/app/core/services/settings';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
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

  private streamSubscription?: Subscription;

  models: OpenAIModel[] = [];
  selectedModelKey: string = '';

  messages: ChatMessage[] = [];
  usage?: UsageTokens;
  userInput: string = '';
  isSending = false;
  errorMessage: string | null = null;
  currentConversationId: string = this.generateId();
  currentConversationCreatedAt: number = Date.now();

  constructor() {
    addIcons({ createOutline, refreshOutline, menuOutline });
  }

  ngOnInit(): void {
    this.loadModels();

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
        console.log(res);
        this.models = res.data;
        this.selectedModelKey = res.data[0].id;
      },
      error: (err) => console.error(err),
    });
  }

  newChat() {
    this.messages = [];
    this.userInput = '';
    this.usage = undefined;
    this.errorMessage = null;
    this.isSending = false;
    this.currentConversationId = this.generateId();
    this.currentConversationCreatedAt = Date.now();
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
    this.isSending = true;
    this.errorMessage = null;

    const startTime = Date.now();

    const streaming = (await this.settingsService.getStreamMode()) ?? true;

    if (!streaming) {
      this.openAIService
        .sendChat({
          model: this.selectedModelKey,
          messages: this.messages,
        })
        .subscribe({
          next: (res) => {
            const responseTime = (Date.now() - startTime) / 1000;
            this.messages.push({
              role: 'assistant',
              content: res.choices[0].message.content,
              responseTime: responseTime,
            });
            this.usage = res.usage;
            this.isSending = false;

            //Save Conversation
            this.conversationService.saveConversation({
              id: this.currentConversationId,
              title: this.messages[0].content.substring(0, 50),
              messages: this.messages,
              createdAt: this.currentConversationCreatedAt,
            });
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = this.translateService.instant(
              'CHAT.ERROR_SEND_FAILED',
            );
            this.isSending = false;
          },
        });
    } else {
      const messagesToSend = [...this.messages];
      this.messages.push({ role: 'assistant', content: '' });

      this.streamSubscription = this.openAIService
        .sendChatStream({
          model: this.selectedModelKey,
          messages: messagesToSend,
        })
        .subscribe({
          next: (chunk) => {
            this.ngZone.run(() => {
              this.messages[this.messages.length - 1].content += chunk;
            });
          },
          complete: () => {
            this.isSending = false;

            const responseTime = (Date.now() - startTime) / 1000;
            this.messages[this.messages.length - 1].responseTime = responseTime;

            //Save Conversation
            this.conversationService.saveConversation({
              id: this.currentConversationId,
              title: this.messages[0].content.substring(0, 50),
              messages: this.messages,
              createdAt: this.currentConversationCreatedAt,
            });
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = this.translateService.instant(
              'CHAT.ERROR_SEND_FAILED',
            );
            this.isSending = false;
          },
        });
    }
  }

  onEnterKey(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngOnDestroy() {
    this.streamSubscription?.unsubscribe();
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
}
