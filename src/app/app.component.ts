
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, timeOutline, chatbubbleOutline, addCircleOutline, chatbubblesOutline } from 'ionicons/icons';
import { LmStudioService } from './core/services/lm-studio';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet]
})
export class AppComponent {

  public appPages = [
    { title: 'Chat', url: 'chat', icon: 'chatbubbles-outline' },
    { title: 'Configuración', url: 'settings', icon: 'settings-outline' },
  ];

  public labels = ['Chat 1', 'Chat 2', 'Chat 3', 'Chat 4', 'Chat 5', 'Chat 6'];

  ngOnInit() {
    this.lmStudio.getModels().subscribe({
      next: rest => console.log(rest),
      error: err => console.error('Error getting models ', err),
    });
  }

  constructor(private lmStudio: LmStudioService) {
    addIcons({ settingsOutline, timeOutline, chatbubbleOutline, addCircleOutline, chatbubblesOutline });
    this.loadModels();
  }

  loadModels() {

  }


}
