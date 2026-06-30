import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, arrowBackOutline, chatbubbleOutline } from 'ionicons/icons';
import { ConversationService } from 'src/app/core/services/conversation';
import { Conversation } from 'src/app/core/models/conversation.model';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.page.html',
  styleUrls: ['./conversations.page.scss'],
  standalone: true,
  imports: [IonIcon, AsyncPipe]
})
export class ConversationsPage {

  private conversationService = inject(ConversationService);

  // Observable that updates automatically whenever a conversation is saved
  readonly conversations$ = this.conversationService.conversations$;

  constructor() {
    addIcons({ chatbubblesOutline, arrowBackOutline, chatbubbleOutline });
  }

}
