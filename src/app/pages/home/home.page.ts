import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  refreshOutline,
  hourglassOutline,
  attachOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { OpenAIService } from 'src/app/core/services/openai';
import { Router } from '@angular/router';
import { UiService } from 'src/app/core/services/ui-service';
import { SettingsService } from 'src/app/core/services/settings';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    FormsModule,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonIcon,
    TranslatePipe,
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
  attachedImages: string[] = [];
  temporaryChat: boolean = false;

  // Web search opt-in toggle for the first message
  webSearchEnabled: boolean = false;
  searchThisMessage: boolean = false;

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
      refreshOutline,
      hourglassOutline,
      attachOutline,
      closeCircleOutline,
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
        console.log(res);
        this.models = res.data;
        this.selectedModelKey = res.data[0].id;
      },
      error: (err) => console.error(err),
    });
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

  onEnterKey(event: KeyboardEvent) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  triggerImagePicker(): void {
    const input = document.getElementById(
      'home-image-file-input',
    ) as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    input.value = '';

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.attachedImages = [...this.attachedImages, dataUrl];
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.attachedImages = this.attachedImages.filter((_, i) => i !== index);
  }

  sendMessage() {
    const userText = this.userInput.trim();
    if (userText === '' && this.attachedImages.length === 0) return;

    const newId = this.generateId();

    this.router.navigate(['/chat', newId], {
      state: {
        message: userText,
        attachedImages: [...this.attachedImages],
        model: this.selectedModelKey,
        temporaryChat: this.temporaryChat,
        searchThisMessage: this.searchThisMessage,
      },
    });

    this.userInput = '';
    this.attachedImages = [];
    this.searchThisMessage = false; // reset after navigate
  }
}
