import { Component, inject } from '@angular/core';
import {
  IonApp,
  IonSplitPane,
  IonRouterOutlet,
  IonMenu,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline,
  timeOutline,
  chatbubbleOutline,
  addCircleOutline,
  chatbubblesOutline,
} from 'ionicons/icons';
import { OpenAIService } from './core/services/openai';
import { SettingsService } from './core/services/settings';
import { TranslateService } from '@ngx-translate/core';
import { SidebarComponent } from './pages/sidebar/sidebar.component';
import { UiService } from './core/services/ui-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [IonSplitPane, IonRouterOutlet, SidebarComponent, IonMenu, IonApp],
})
export class AppComponent {
  public uiService = inject(UiService);

  private openAIService = inject(OpenAIService);
  private settingsService = inject(SettingsService);
  private translateService = inject(TranslateService);

  ngOnInit() {
    this.openAIService.getModels().subscribe({
      next: (rest) => console.log(rest),
      error: (err) => console.error('Error getting models ', err),
    });
    this.initLanguage();
  }

  constructor() {
    addIcons({
      settingsOutline,
      timeOutline,
      chatbubbleOutline,
      addCircleOutline,
      chatbubblesOutline,
    });
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

  loadModels() {}
}
