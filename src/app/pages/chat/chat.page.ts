import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSelect, IonSelectOption, IonContent, IonLabel, IonButton, IonTextarea, IonSpinner, IonChip, IonMenuButton, IonIcon } from "@ionic/angular/standalone";
import { LmStudioService } from 'src/app/core/services/lm-studio';
import { ChatMessage, OpenAIModel, UsageTokens } from 'src/app/core/models/lmstudio.model';
import { MarkdownComponent } from 'ngx-markdown';
import { addIcons } from 'ionicons';
import { createOutline, refreshOutline } from 'ionicons/icons';
import { ConversationService } from 'src/app/core/services/conversation';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    IonChip,
    IonButton,
    IonLabel,
    IonContent,
    CommonModule,
    DecimalPipe,
    FormsModule,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    IonMenuButton,
    IonIcon,
    MarkdownComponent,
    TranslatePipe
  ],
})
export class ChatPage implements OnInit {

  private route = inject(ActivatedRoute);
  private lmStudioService = inject(LmStudioService);
  private conversationService = inject(ConversationService);
  private translateService = inject(TranslateService);

  models: OpenAIModel[] = [];
  selectedModelKey: string = '';

  messages: ChatMessage[] = []
  usage?: UsageTokens;
  userInput: string = '';
  isSending = false;
  errorMessage: string | null = null;
  currentConversationId: string = this.generateId();
  currentConversationCreatedAt: number = Date.now();

  constructor() {
    addIcons({ createOutline, refreshOutline });
  }
  ngOnInit(): void {
    this.loadModels();

  // Subscribe to URL parameter changes.
  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.loadConversation(id);
    } else {
      this.newChat(); // If there is no ID, clear the chat.
    }
  });
  }

  loadModels() {
    this.lmStudioService.getModels().subscribe({
      next: (res) => {
        console.log(res);
        this.models = res.data;
        this.selectedModelKey = res.data[0].id;
      },
      error: (err) => console.error(err),
    })
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
    this.conversationService.getConversationsbyId(id).then(c => {
      if (c) {
        this.currentConversationId = c.id;
        this.currentConversationCreatedAt = c.createdAt;
        this.messages = c.messages;
      }
    })
  }

  sendMessage() {

    const userText = this.userInput.trim();

    // Exit if input is empty
    if (userText === '') return;

    // Check that a model is selected
    if (!this.selectedModelKey) {
      this.errorMessage = this.translateService.instant('CHAT.ERROR_SELECT_MODEL');
      return;
    }

    // Append the user's message
    this.messages.push({
      role: 'user',
      content: userText
    });

    // Clear the input
    this.userInput = '';
    this.isSending = true;
    this.errorMessage = null;

    const startTime = Date.now();

    this.lmStudioService.sendChat({
      model: this.selectedModelKey,
      messages: this.messages
    }).subscribe({
      next: (res) => {
        const responseTime = (Date.now() - startTime)/1000;
        this.messages.push({
          role: 'assistant',
          content: res.choices[0].message.content,
          responseTime: responseTime
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
        this.errorMessage = this.translateService.instant('CHAT.ERROR_SEND_FAILED');
        this.isSending = false;
      }
    });

  }

  onEnterKey(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private generateId() {
    // Use randomUUID if available (secure context); otherwise, generate a random ID.
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();

    } else {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    }
  }

}
