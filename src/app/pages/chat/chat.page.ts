import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSelect, IonList, IonItem, IonSelectOption, IonContent, IonLabel, IonButton, IonTextarea } from "@ionic/angular/standalone";
import { LmStudioService } from 'src/app/core/services/lm-studio';
import { ChatMessage, LmStudioModel } from 'src/app/core/models/lmstudio.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonButton, IonLabel, IonContent,
    CommonModule,
    FormsModule,
    IonSelect,
    IonList,
    IonItem,
    IonSelectOption,
    IonTextarea
  ],
})
export class ChatPage implements OnInit {
  private lmStudioService = inject(LmStudioService);
  models: LmStudioModel[] = [];
  selectedModelKey: string | undefined;

  messages: ChatMessage[] = [];
  userInput: string = '';
  isSending = false;
  errorMessage: String | null = null;

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels() {
    this.lmStudioService.getModels().subscribe({
      next: (res) => {
        console.log(res);
        this.models = res.models;
        this.selectedModelKey = res.models[0].key;
      },
      error: (err) => console.error(err),
    })
  }

  sendMessage() {

    const userText = this.userInput.trim();

    // ¿Texto vacio? Salir
    if (userText === '') return;

    //Insermos el mensaje del usuario
    this.messages.push({
      role: 'user',
      content: userText
    });

    //Respuesta dummy
    this.messages.push({
      role: 'assistant',
      content: 'Hola'
    })

  }

}
