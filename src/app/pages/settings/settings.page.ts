import { UiService } from './../../core/services/ui-service';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonToast,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonAlert,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline,
  serverOutline,
  globeOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  languageOutline,
  wifiOutline,
  trashOutline,
} from 'ionicons/icons';
import { SettingsService } from 'src/app/core/services/settings';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConversationService } from 'src/app/core/services/conversation';
import { WebSearchService } from 'src/app/core/services/search/web-search.service';
import { MemoryService } from 'src/app/core/services/memory.service';
import { Memory } from 'src/app/core/models/memory.model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonAlert,
    IonToggle,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    IonInput,
    IonContent,
    IonButton,
    IonToast,
    IonIcon,
    IonSelect,
    IonSelectOption,
  ],
})
export class SettingsPage implements OnInit {
  public uiService = inject(UiService);

  private conversationService = inject(ConversationService);
  private settingsService = inject(SettingsService);
  private translateService = inject(TranslateService);
  private formBuilder = inject(FormBuilder);
  public memoryService = inject(MemoryService);

  isToastOpen: boolean = false;
  toastMessage: string = '';

  isDeleteAlertOpen: boolean = false;
  isDeleteMemoriesAlertOpen: boolean = false;

  // Memory state
  memoryEnabled: boolean = true;
  memoryLimit: number = 50;
  memoryExtractionFreq: number = 2;
  memories: Memory[] = [];
  newMemoryText: string = '';
  editingMemoryId: string | null = null;
  editingMemoryText: string = '';

  baseUrl: string | null = '';
  selectedlanguage: string | null = '';
  streaming: boolean = true;

  languages = [
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' },
  ];

  // Web Search state
  webSearchEnabled: boolean = false;
  searchApiKey: string = '';
  searchProviderId: string = 'brave';
  // 'native' → model decides via tool_calls; 'rag' → app pre-searches and injects context
  searchMode: 'native' | 'rag' = 'native';
  // Injected so the template can iterate availableProviders
  public webSearchService = inject(WebSearchService);

  settingsForm = this.formBuilder.group({
    serverAddress: [''],
    languageSelect: [''],
  });

  constructor() {
    addIcons({
      settingsOutline,
      serverOutline,
      globeOutline,
      checkmarkCircleOutline,
      informationCircleOutline,
      languageOutline,
      wifiOutline,
      trashOutline,
    });
  }

  ngOnInit() {
    this.getSettings();
  }

  async getSettings() {
    this.baseUrl = await this.settingsService.getBaseUrl();
    const lang = await this.settingsService.getLanguage();
    this.selectedlanguage = lang ? lang : 'en';
    const streaming = await this.settingsService.getStreamMode();
    this.streaming = streaming ?? true;

    // Web Search
    this.webSearchEnabled = await this.settingsService.getWebSearchEnabled();
    this.searchApiKey = (await this.settingsService.getSearchApiKey()) ?? '';
    this.searchProviderId = await this.settingsService.getSearchProviderId();
    this.searchMode = await this.settingsService.getSearchMode();

    // Memory
    this.memoryEnabled = await this.settingsService.getMemoryEnabled();
    this.memoryLimit = await this.settingsService.getMemoryLimit();
    this.memoryExtractionFreq = await this.settingsService.getMemoryExtractionFrequency();
    this.memories = await this.memoryService.loadMemories();
    this.memoryService.memories$.subscribe((mems) => (this.memories = mems));

    this.settingsForm.setValue({
      serverAddress: this.baseUrl ?? 'http://127.0.0.1:1234',
      languageSelect: this.selectedlanguage,
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

  setStreaming(streaming: boolean) {
    this.streaming = streaming;
    this.settingsService.setStreamMode(streaming);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  setWebSearchEnabled(enabled: boolean) {
    this.webSearchEnabled = enabled;
    this.settingsService.setWebSearchEnabled(enabled);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  setSearchApiKey(key: string) {
    this.searchApiKey = key;
    this.settingsService.setSearchApiKey(key);
  }

  saveSearchApiKey() {
    this.settingsService.setSearchApiKey(this.searchApiKey);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  setSearchProvider(providerId: string) {
    this.searchProviderId = providerId;
    this.settingsService.setSearchProviderId(providerId);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  setSearchMode(mode: 'native' | 'rag') {
    this.searchMode = mode;
    this.settingsService.setSearchMode(mode);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  async onDeleteAlertDismiss(event: any) {
    this.isDeleteAlertOpen = false;

    if (event.detail.role === 'confirm') {
      await this.conversationService.deleteAllConversations();
      this.setOpen(
        true,
        this.translateService.instant('SETTINGS.TOAST_SUCCESS'),
      );
    }
  }

  deleteAllConversations() {
    this.isDeleteAlertOpen = true;
  }

  // ── Memory ──────────────────────────────────────────────────────────────

  setMemoryEnabled(enabled: boolean) {
    this.memoryEnabled = enabled;
    this.settingsService.setMemoryEnabled(enabled);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  setMemoryLimit(limit: number) {
    const parsed = Math.max(0, Math.floor(limit));
    this.memoryLimit = parsed;
    this.settingsService.setMemoryLimit(parsed);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  setMemoryExtractionFreq(freq: number) {
    const parsed = Math.max(1, Math.floor(freq));
    this.memoryExtractionFreq = parsed;
    this.settingsService.setMemoryExtractionFrequency(parsed);
    this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
  }

  async addMemory() {
    const text = this.newMemoryText.trim();
    if (!text) return;
    await this.memoryService.addMemory(text, 'user');
    this.newMemoryText = '';
  }

  startEditMemory(memory: Memory) {
    this.editingMemoryId = memory.id;
    this.editingMemoryText = memory.content;
  }

  cancelEditMemory() {
    this.editingMemoryId = null;
    this.editingMemoryText = '';
  }

  async saveEditMemory() {
    if (!this.editingMemoryId || !this.editingMemoryText.trim()) return;
    await this.memoryService.updateMemory(this.editingMemoryId, this.editingMemoryText);
    this.cancelEditMemory();
  }

  async deleteMemory(id: string) {
    await this.memoryService.deleteMemory(id);
  }

  async onDeleteMemoriesAlertDismiss(event: any) {
    this.isDeleteMemoriesAlertOpen = false;
    if (event.detail.role === 'confirm') {
      await this.memoryService.deleteAllMemories();
      this.setOpen(true, this.translateService.instant('SETTINGS.TOAST_SUCCESS'));
    }
  }

  deleteAllMemories() {
    this.isDeleteMemoriesAlertOpen = true;
  }
}
