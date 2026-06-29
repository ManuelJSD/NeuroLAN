import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonToast,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, serverOutline, globeOutline, checkmarkCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { SettingsService } from 'src/app/core/services/settings';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonInput,
    IonContent,
    IonButton,
    IonToast,
    IonIcon,
  ]
})
export class SettingsPage implements OnInit {

  private settingsService = inject(SettingsService);
  private formBuilder = inject(FormBuilder);
  isToastOpen: boolean = false;
  toastMessage: string = '';

  baseUrl: string | null = '';

  settingsForm = this.formBuilder.group({
    serverAddress: [''],
  });

  constructor() {
    addIcons({ settingsOutline, serverOutline, globeOutline, checkmarkCircleOutline, informationCircleOutline });
  }

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
      this.setOpen(true, '⚠️ No se especificó una URL de servidor');
      return;
    }

    this.settingsService.setBaseUrl(this.baseUrl);
    this.setOpen(true, '✅ Configuración guardada correctamente');
  }

  setOpen(isOpen: boolean, message?: string) {
    this.isToastOpen = isOpen;

    if (message !== undefined) {
      this.toastMessage = message;
    }
  }

}
