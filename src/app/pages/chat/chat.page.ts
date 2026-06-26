import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSelect, IonSelectOption, IonContent, IonLabel, IonButton, IonTextarea, IonSpinner, IonChip } from "@ionic/angular/standalone";
import { LmStudioService } from 'src/app/core/services/lm-studio';
import { ChatMessage, OpenAIModel, UsageTokens } from 'src/app/core/models/lmstudio.model';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonChip, IonButton, IonLabel, IonContent,
    CommonModule,
    FormsModule,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    MarkdownComponent],
})
export class ChatPage implements OnInit {
  private lmStudioService = inject(LmStudioService);
  models: OpenAIModel[] = [];
  selectedModelKey: string = '';

  messages: ChatMessage[] = [];
  usage?: UsageTokens;
  userInput: string = '';
  isSending = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.loadModels();
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

  sendMessage() {

    const userText = this.userInput.trim();

    // ¿Texto vacio? Salir
    if (userText === '') return;

    // Checkeo de modelo
    if (!this.selectedModelKey) {
      this.errorMessage = 'Debes seleccionar un modelo';
      return;
    }

    //Insermos el mensaje del usuario
    this.messages.push({
      role: 'user',
      content: userText
    });

    //Limpiamos el Input
    this.userInput = '';
    this.isSending = true;
    this.errorMessage = null;

    this.lmStudioService.sendChat({
      model: this.selectedModelKey,
      messages: this.messages
    }).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          content: res.choices[0].message.content
        });
        this.usage = res.usage;
        this.isSending = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error al enviar el mensaje';
        this.isSending = false;
      }
    });

  }

}
