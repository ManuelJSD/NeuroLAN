import { Injectable, signal, inject, computed } from '@angular/core';
import { MenuController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private menuCtrl = inject(MenuController);
  
  // State signals
  public isDesktopSidebarOpen = signal(false);
  public isLargeScreen = signal(window.innerWidth >= 1024);

  constructor() {
    // Listen for window resize to adjust layout mode automatically
    window.addEventListener('resize', () => {
      const isNowLarge = window.innerWidth >= 1024;
      
      // If shrinking from large to small screen, ensure menu hides cleanly
      if (this.isLargeScreen() && !isNowLarge) {
        this.menuCtrl.close('main-menu');
        this.isDesktopSidebarOpen.set(false);
      }
      
      this.isLargeScreen.set(isNowLarge);
    });
  }

  // Only split the pane if the user wants it open AND the screen is large
  public splitPaneCondition = computed(() => {
    return this.isDesktopSidebarOpen() && this.isLargeScreen();
  });

  public toggleDesktopSidebar() {
    if (this.isLargeScreen()) {
      // Large screens: Toggle the split pane directly
      this.isDesktopSidebarOpen.update(v => !v);
    } else {
      // Small screens: Let MenuController handle the overlay animation
      this.menuCtrl.toggle('main-menu');
    }
  }
}
