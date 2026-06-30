import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Conversation } from '../models/conversation.model';
import localforage from 'localforage';

@Injectable({
  providedIn: 'root',
})
export class ConversationService {

  private readonly STORAGE_KEY = 'conversations';

  // Reactive stream: emits the list whenever it changes
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  readonly conversations$ = this.conversationsSubject.asObservable();

  constructor() {
    // Initial load when the service starts up
    this.loadConversartions().then(convs => this.conversationsSubject.next(convs));
  }

  async saveConversation(conversation: Conversation) {
    const conversations = await this.loadConversartions();

    const index = conversations.findIndex(c => c.id === conversation.id);

    if (index !== -1) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }

    await localforage.setItem(this.STORAGE_KEY, conversations);
    // Notify all subscribers with the updated list
    this.conversationsSubject.next(conversations);
  }

  async loadConversartions(): Promise<Conversation[]> {
    const stored = await localforage.getItem<Conversation[]>(this.STORAGE_KEY);
    return stored ?? [];
  }

}
