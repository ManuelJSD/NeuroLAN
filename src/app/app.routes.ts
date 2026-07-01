import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'chat',
    pathMatch: 'full'
  },
  {
    path: 'conversations',
    loadComponent: () => import('./pages/conversations/conversations.page').then(m => m.ConversationsPage)
  },
  {
    path: 'chat',
    loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage)
  },
  {
    path: 'chat/:id',
    loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: '**',
    redirectTo: 'chat'
  }
];
