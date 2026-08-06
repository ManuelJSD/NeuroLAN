import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonMenu,
  IonContent,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';

import { ConversationsPage } from '../conversations/conversations.page';
import { TranslatePipe } from '@ngx-translate/core';
import { UiService } from 'src/app/core/services/ui-service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
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
export class SidebarComponent implements OnInit {
  public uiService = inject(UiService);

  public appPages = [
    { title: 'Chat', url: 'chat', icon: 'chatbubbles-outline' },
    { title: 'Settings', url: 'settings', icon: 'settings-outline' },
  ];

  constructor() {
    addIcons({ chevronBackOutline });
  }

  ngOnInit() {}
}
