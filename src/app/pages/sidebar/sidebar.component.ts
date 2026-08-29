import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonMenu,
  IonContent,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

import { ConversationsPage } from '../conversations/conversations.page';
import { TranslatePipe } from '@ngx-translate/core';
import { UiService } from 'src/app/core/services/ui-service';
import { ConversationService } from 'src/app/core/services/conversation';
import { Conversation } from 'src/app/core/models/conversation.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    IonSearchbar,
    RouterLink,
    RouterLinkActive,
    IonContent,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    ConversationsPage,
    TranslatePipe,
  ],
})
export class SidebarComponent {
  private conversationService = inject(ConversationService);
  public uiService = inject(UiService);

  public appPages = [
    { title: 'Chat', url: 'chat', icon: 'chatbubbles-outline' },
    { title: 'Settings', url: 'settings', icon: 'settings-outline' },
  ];

  searchResult: Conversation[] | undefined;

  constructor() {
    addIcons({ chevronBackOutline });
  }

  async searchInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value?.toLowerCase() || '';

    if (query) {
      this.searchResult =
        await this.conversationService.searchConversations(query);
    } else {
      this.searchResult = undefined;
    }
  }
}
