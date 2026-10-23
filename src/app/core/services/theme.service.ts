import { Injectable, signal, effect } from '@angular/core';
import { SettingsService } from './settings';

export type AppSkin = 'dark' | 'light' | 'whatsapp';

export interface SkinDefinition {
  id: AppSkin;
  labelKey: string;
  previewBg: string;
  previewBubbleUser: string;
  previewBubbleAi: string;
  previewText: string;
}

export const AVAILABLE_SKINS: SkinDefinition[] = [
  {
    id: 'dark',
    labelKey: 'SETTINGS.SKIN_DARK',
    previewBg: '#1e1e2e',
    previewBubbleUser: '#313244',
    previewBubbleAi: '#181825',
    previewText: '#cdd6f4',
  },
  {
    id: 'light',
    labelKey: 'SETTINGS.SKIN_LIGHT',
    previewBg: '#f5f5f5',
    previewBubbleUser: '#e0e0e0',
    previewBubbleAi: '#ffffff',
    previewText: '#1c1c1e',
  },
  {
    id: 'whatsapp',
    labelKey: 'SETTINGS.SKIN_WHATSAPP',
    previewBg: '#0b141a',
    previewBubbleUser: '#005c4b',
    previewBubbleAi: '#1f2c34',
    previewText: '#e9edef',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public activeSkin = signal<AppSkin>('dark');

  constructor(private settingsService: SettingsService) {
    // Apply skin reactively whenever signal changes
    effect(() => {
      this.applySkin(this.activeSkin());
    });
  }

  async init(): Promise<void> {
    const saved = await this.settingsService.getSkin();
    this.activeSkin.set(saved);
  }

  async setSkin(skin: AppSkin): Promise<void> {
    this.activeSkin.set(skin);
    await this.settingsService.setSkin(skin);
  }

  private applySkin(skin: AppSkin): void {
    const html = document.documentElement;
    // Remove any previous skin classes
    html.classList.remove('skin-dark', 'skin-light', 'skin-whatsapp');
    html.classList.add(`skin-${skin}`);
  }
}
