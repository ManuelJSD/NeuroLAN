import { Component, inject, Input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  IonIcon,
  IonAlert,
  IonButton,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  arrowBackOutline,
  chatbubbleOutline,
  trashOutline,
  createOutline,
  ellipsisVerticalOutline,
  closeOutline,
  downloadOutline,
  cloudUploadOutline,
  documentTextOutline,
  codeSlashOutline,
} from 'ionicons/icons';
import { ConversationService } from 'src/app/core/services/conversation';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Conversation } from 'src/app/core/models/conversation.model';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.page.html',
  styleUrls: ['./conversations.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonAlert,
    IonIcon,
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
  ],
})
export class ConversationsPage {
  private router = inject(Router);
  private translateService = inject(TranslateService);

  private conversationService = inject(ConversationService);

  private actionSheetController = inject(ActionSheetController);

  // Delete Alert State
  isDeleteAlertOpen: boolean = false;
  private conversationIdToDelete: string | null = null;

  // Edit Alert State
  isEditAlertOpen: boolean = false;
  private conversationIdToEdit: string | null = null;
  private conversationTitleToEdit: string | null = null;

  alertEditInputs = [{}];

  @Input() searchResults: Conversation[] | undefined;

  // Observable that updates automatically whenever a conversation is saved
  readonly conversations$ = this.conversationService.conversations$;

  constructor() {
    addIcons({
      chatbubblesOutline,
      arrowBackOutline,
      chatbubbleOutline,
      trashOutline,
      createOutline,
      ellipsisVerticalOutline,
      closeOutline,
      downloadOutline,
      cloudUploadOutline,
      documentTextOutline,
      codeSlashOutline,
    });
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
        value: await this.conversationService.getConversationTitle(id),
      },
    ];
  }

  async onEditAlertDismiss(event: any) {
    this.isEditAlertOpen = false;

    if (event.detail.role === 'confirm' && this.conversationIdToEdit) {
      const newTitle = event.detail.data?.values?.title?.trim();

      if (newTitle) {
        await this.conversationService.updateConversationTitle(
          this.conversationIdToEdit,
          newTitle,
        );
      }
    }

    this.conversationIdToEdit = null;
  }

  async presentActionSheet(conversation: any, event: Event) {
    event.stopPropagation();

    const editLabel = this.translateService.instant('CONVERSATIONS.EDIT');
    const deleteLabel = this.translateService.instant('CONVERSATIONS.DELETE');
    const exportJsonLabel = this.translateService.instant('CONVERSATIONS.EXPORT_JSON');
    const exportMarkdownLabel = this.translateService.instant('CONVERSATIONS.EXPORT_MARKDOWN');

    const actionSheet = await this.actionSheetController.create({
      buttons: [
        {
          text: exportMarkdownLabel,
          icon: 'document-text-outline',
          handler: () => {
            this.conversationService.exportSingleConversationToMarkdown(conversation.id);
          },
        },
        {
          text: exportJsonLabel,
          icon: 'code-slash-outline',
          handler: () => {
            this.conversationService.exportSingleConversationToJson(conversation.id);
          },
        },
        {
          text: editLabel,
          icon: 'create-outline',
          handler: () => {
            this.presentEditConfirm(conversation.id);
          },
        },
        {
          text: deleteLabel,
          icon: 'trash-outline',
          handler: () => {
            this.presentDeleteConfirm(conversation.id);
          },
        },
      ],
    });
    await actionSheet.present();
  }

  exportConversations() {
    this.conversationService.exportConversations();
  }

  importConversations() {
    this.conversationService.importConversations();
  }
}
