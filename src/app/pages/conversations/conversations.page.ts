import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.page.html',
  styleUrls: ['./conversations.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule]
})
export class ConversationsPage implements OnInit {

  constructor() {
    addIcons({ chatbubblesOutline, arrowBackOutline });
  }

  ngOnInit() {
  }

}
