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

  // Delete Alert State
  isDeleteAlertOpen: boolean = false;
  private conversationIdToDelete: string | null = null;

  // Edit Alert State
  isEditAlertOpen: boolean = false;
  private conversationIdToEdit: string | null = null;
  private conversationTitleToEdit: string | null = null;

  alertEditInputs = [{}];

  // Observable that updates automatically whenever a conversation is saved
  readonly conversations$ = this.conversationService.conversations$;

  constructor() {
    addIcons({ chatbubblesOutline, arrowBackOutline, chatbubbleOutline, trashOutline, createOutline });
  }

  // Delete Alert Methods
  presentDeleteConfirm(id: string) {
    this.conversationIdToDelete = id;
    this.isDeleteAlertOpen = true;
  }

  onDeleteAlertDismiss(event: any) {
    this.isDeleteAlertOpen = false;

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

 //Edit Alert Methods
  async presentEditConfirm(id: string) {
  this.conversationIdToEdit = id;
  this.isEditAlertOpen = true;

  this.alertEditInputs = [
    {
      name: 'title',
      type: 'text',
      value: await this.conversationService.getConversationTitle(id)
    }
  ];
 }

 async onEditAlertDismiss(event: any) {
  this.isEditAlertOpen = false;

  if (event.detail.role === 'confirm' && this.conversationIdToEdit) {
    const newTitle = event.detail.data?.values?.title?.trim();

    if (newTitle) {
      await this.conversationService.updateConversationTitle(this.conversationIdToEdit, newTitle);
    }
  }

  this.conversationIdToEdit = null;
 }

}
