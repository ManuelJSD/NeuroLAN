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
import { refreshOutline } from 'ionicons/icons';
import { OpenAIService } from 'src/app/core/services/openai';
import { Router } from '@angular/router';

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
  private openAIService = inject(OpenAIService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  models: { id: string }[] = [];
  selectedModelKey: string = '';
  userInput: string = '';

  // Sugerencias de ejemplo — puedes adaptar los textos via i18n
  suggestions: string[] = [
    'HOME.SUGGESTIONS.CONCEPT',
    'HOME.SUGGESTIONS.CODE',
    'HOME.SUGGESTIONS.SUMMARY',
    'HOME.SUGGESTIONS.BRAINSTORM',
    'HOME.SUGGESTIONS.TRANSLATE',
  ];

  constructor() {
    addIcons({ refreshOutline });
  }

  ngOnInit() {
    this.loadModels();
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

  sendMessage() {
    if (this.userInput.trim() === '') return;

    const newId = this.generateId();

    this.router.navigate(['/chat', newId], {
      state: {
        message: this.userInput,
        model: this.selectedModelKey,
      },
    });

    this.userInput = '';
  }
}
