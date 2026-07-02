import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonToast,
  IonIcon,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, serverOutline, globeOutline, checkmarkCircleOutline, informationCircleOutline, languageOutline } from 'ionicons/icons';
import { SettingsService } from 'src/app/core/services/settings';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    IonInput,
    IonContent,
    IonButton,
    IonToast,
    IonIcon,
    IonSelect,
    IonSelectOption,
  ]
})
export class SettingsPage implements OnInit {

  private settingsService = inject(SettingsService);
  private translateService = inject(TranslateService);
  private formBuilder = inject(FormBuilder);
  isToastOpen: boolean = false;
  toastMessage: string = '';

  baseUrl: string | null = '';
  selectedlanguage: string | null = '';

  languages = [
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' },
  ];

  settingsForm = this.formBuilder.group({
    serverAddress: [''],
    languageSelect: [''],
  });

  constructor() {
    addIcons({ settingsOutline, serverOutline, globeOutline, checkmarkCircleOutline, informationCircleOutline, languageOutline });
  }

  ngOnInit() {
    this.getSettings();
  }

  async getSettings() {
    this.baseUrl = await this.settingsService.getBaseUrl();
    const lang = await this.settingsService.getLanguage();
    this.selectedlanguage = lang ? lang : 'en';

    this.settingsForm.setValue({
      serverAddress: this.baseUrl ?? 'http://127.0.0.1:1234',
      languageSelect: this.selectedlanguage
    });

  }

  changeLanguage(event: CustomEvent) {
    const lang = event.detail.value as string;
    this.selectedlanguage = lang;
    this.translateService.use(lang);
    this.settingsService.setLanguage(lang);
  }

  saveSettings() {
    this.baseUrl = this.settingsForm.value.serverAddress ?? null;

    if (!this.baseUrl) {
      this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_ERROR'));
      return;
    }

    this.settingsService.setBaseUrl(this.baseUrl);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  setOpen(isOpen: boolean, message?: string) {
    this.isToastOpen = isOpen;

    if (message !== undefined) {
      this.toastMessage = message;
    }
  }

}

