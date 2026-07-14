import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { IonIcon, IonAlert } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, arrowBackOutline, chatbubbleOutline, trashOutline, createOutline } from 'ionicons/icons';
import { ConversationService } from 'src/app/core/services/conversation';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.page.html',
  styleUrls: ['./conversations.page.scss'],
  standalone: true,
  imports: [IonAlert, IonIcon, AsyncPipe, RouterLink, RouterLinkActive, TranslatePipe]
})
export class ConversationsPage {

  private router = inject(Router);

  private conversationService = inject(ConversationService);

  isAlertOpen: boolean = false;
  private conversationIdToDelete: string | null = null;

  // Observable that updates automatically whenever a conversation is saved
  readonly conversations$ = this.conversationService.conversations$;

  constructor() {
    addIcons({ chatbubblesOutline, arrowBackOutline, chatbubbleOutline, trashOutline, createOutline });
  }

  presentDeleteConfirm(id: string) {
    this.conversationIdToDelete = id;
    this.isAlertOpen = true;
  }

  onAlertDismiss(event: any) {
    this.isAlertOpen = false;

    if (event.detail.role === 'confirm' && this.conversationIdToDelete) {
      this.deleteConversation(this.conversationIdToDelete);
    }

    this.conversationIdToDelete = null;
  }

  deleteConversation(id: string) {
    this.conversationService.deleteConversation(id);

    if (this.router.url.split('?')[0] === `/chat/${id}`) {
      this.router.navigate(['/']);
    }
  }



}
