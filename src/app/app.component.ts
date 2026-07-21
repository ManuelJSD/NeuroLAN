
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, timeOutline, chatbubbleOutline, addCircleOutline, chatbubblesOutline } from 'ionicons/icons';
import { OpenAIService } from './core/services/openai';
import { SettingsService } from './core/services/settings';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConversationsPage } from "./pages/conversations/conversations.page";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    ConversationsPage,
    TranslatePipe
  ]
})
export class AppComponent {

  public appPages = [
    { title: 'Chat', url: 'chat', icon: 'chatbubbles-outline' },
    { title: 'Settings', url: 'settings', icon: 'settings-outline' },
  ];

  public labels = ['Chat 1', 'Chat 2', 'Chat 3', 'Chat 4', 'Chat 5', 'Chat 6'];

  private openAIService = inject(OpenAIService);
  private settingsService = inject(SettingsService);
  private translateService = inject(TranslateService);

  ngOnInit() {
    this.openAIService.getModels().subscribe({
      next: rest => console.log(rest),
      error: err => console.error('Error getting models ', err),
    });
    this.initLanguage();
  }

  constructor() {
    addIcons({ settingsOutline, timeOutline, chatbubbleOutline, addCircleOutline, chatbubblesOutline });
    this.loadModels();
  }

  async initLanguage() {
    const lang = await this.settingsService.getLanguage();
    if (lang) {
      this.translateService.use(lang);
    } else {
      this.translateService.use('en');
    }
  }

  loadModels() {

  }

}

