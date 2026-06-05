
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { LmStudioService } from './core/services/lm-studio';
import { ChatPage } from './pages/chat/chat.page';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterLink, IonRouterOutlet, ChatPage]
})
export class AppComponent {

  public appPages = [
    { title: 'Configuración', url: '/folder/inbox', icon: 'settings-outline' },
  ];

  public labels = ['Chat 1', 'Chat 2', 'Chat 3', 'Chat 4', 'Chat 5', 'Chat 6'];

  ngOnInit() {
    this.lmStudio.getModels().subscribe({
      next: rest => console.log(rest),
      error: err => console.error('Error getting models ', err),
    });
  }

  constructor(private lmStudio: LmStudioService) {
    addIcons({ settingsOutline });
    this.loadModels();
  }

  loadModels() {

  }


}
