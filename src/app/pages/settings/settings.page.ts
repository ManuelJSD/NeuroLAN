import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonToast
} from '@ionic/angular/standalone';
import { SettingsService } from 'src/app/core/services/settings';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonButton,
    CommonModule,
    ReactiveFormsModule,
    IonInput,
    IonItem,
    IonList,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  IonToast
  ]
})
export class SettingsPage implements OnInit {

  private settingsService = inject(SettingsService);
  private formBuilder = inject(FormBuilder);
  isToastOpen: boolean = false;
  toastMessage: string = '';

  baseUrl: string |null = '';

  settingsForm = this.formBuilder.group({
    serverAddress: [''],
  });

  constructor() { }

  ngOnInit() {
    this.getSettings();
  }

  async getSettings() {
    this.baseUrl = await this.settingsService.getBaseUrl();
    this.settingsForm.setValue({ serverAddress: this.baseUrl ?? 'http://127.0.0.1:1234' });
  }

  saveSettings() {
    this.baseUrl = this.settingsForm.value.serverAddress ?? null;

    if (!this.baseUrl) {
      this.setOpen(true, 'No URL base was specified');
      return;
    }

    this.settingsService.setBaseUrl(this.baseUrl);

    this.setOpen(true, 'Settings saved correctly');
  }

  setOpen(isOpen: boolean, message?: string) {
    this.isToastOpen = isOpen;

    if (message !== undefined) {
      this.toastMessage = message;
    }
  }

}
