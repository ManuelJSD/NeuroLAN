import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';
import { OpenAIService } from 'src/app/core/services/openai';
import { UiService } from 'src/app/core/services/ui-service';
import { SettingsService } from 'src/app/core/services/settings';
import {
  ChatInputComponent,
  ChatInputPayload,
} from 'src/app/shared/components/chat-input/chat-input.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    TranslatePipe,
    ChatInputComponent,
  ],
})
export class HomePage implements OnInit {
  public uiService = inject(UiService);

  private openAIService = inject(OpenAIService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private settingsService = inject(SettingsService);

  models: { id: string }[] = [];
  selectedModelKey: string = '';
  userInput: string = '';

  // Web search opt-in toggle for the first message
  webSearchEnabled: boolean = false;

  // Example suggestions — you can adapt texts via i18n
  suggestions: string[] = [
    'HOME.SUGGESTIONS.CONCEPT',
    'HOME.SUGGESTIONS.CODE',
    'HOME.SUGGESTIONS.SUMMARY',
    'HOME.SUGGESTIONS.BRAINSTORM',
    'HOME.SUGGESTIONS.TRANSLATE',
  ];

  constructor() {
    addIcons({
      menuOutline,
    });
  }

  ngOnInit() {
    this.loadModels();
    this.settingsService.getWebSearchEnabled().then((enabled) => {
      this.webSearchEnabled = enabled;
    });
  }

  loadModels() {
    this.openAIService.getModels().subscribe({
      next: (res) => {
        this.models = res.data;
        if (res.data.length > 0 && !this.selectedModelKey) {
          this.selectedModelKey = res.data[0].id;
        }
      },
      error: (err) => console.error(err),
    });
  }

  /** Called whenever the model selector value changes. */
  onModelChange(modelId: string) {
    this.selectedModelKey = modelId;
  }

  private generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    }
  }

  useSuggestion(text: string) {
    const textTrans = this.translate.instant(text);
    this.userInput = textTrans;
  }

  onSendMessage(payload: ChatInputPayload) {
    const newId = this.generateId();

    this.router.navigate(['/chat', newId], {
      state: {
        message: payload.text,
        attachedImages: payload.images,
        attachedFiles: payload.files,
        model: payload.model || this.selectedModelKey,
        temporaryChat: payload.temporaryChat,
        searchThisMessage: payload.searchThisMessage,
      },
    });

    this.userInput = '';
  }
}
