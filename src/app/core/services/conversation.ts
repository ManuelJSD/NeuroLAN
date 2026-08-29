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
    this.loadConversartions().then((convs) =>
      this.conversationsSubject.next(convs),
    );
  }

  async saveConversation(conversation: Conversation) {
    const conversations = await this.loadConversartions();

    const index = conversations.findIndex((c) => c.id === conversation.id);

    if (index !== -1) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }

    conversations.sort((a, b) => b.createdAt - a.createdAt);

    await localforage.setItem(this.STORAGE_KEY, conversations);
    // Notify all subscribers with the updated list
    this.conversationsSubject.next(conversations);
  }

  async loadConversartions(): Promise<Conversation[]> {
    const stored = await localforage.getItem<Conversation[]>(this.STORAGE_KEY);
    const conversations = stored ?? [];

    return conversations.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getConversationsbyId(id: string): Promise<Conversation | undefined> {
    const conversations = await this.loadConversartions();

    return conversations.find((c) => c.id === id);
  }

  async deleteConversation(id: string): Promise<Conversation | undefined> {
    const conversations = await this.loadConversartions();
    const deleted = conversations.find((c) => c.id === id);

    if (deleted) {
      const filtered = conversations.filter((c) => c.id !== id);
      await localforage.setItem(this.STORAGE_KEY, filtered);
      this.conversationsSubject.next(filtered);
    }
    return deleted;
  }

  async getConversationTitle(id: string): Promise<string | null> {
    const conversation = await this.getConversationsbyId(id);
    return conversation?.title ?? null;
  }

  async updateConversationTitle(id: string, newTitle: string): Promise<void> {
    const conversation = await this.getConversationsbyId(id);

    if (conversation) {
      conversation.title = newTitle;
      await this.saveConversation(conversation);
    }
  }

  async deleteAllConversations() {
    await localforage.removeItem(this.STORAGE_KEY);
    this.conversationsSubject.next([]);
  }

  async searchConversations(
    query: string,
  ): Promise<Conversation[] | undefined> {
    const conversations = await this.loadConversartions();

    return conversations.filter((conversation) => {
      const titleMatches = conversation.title.toLowerCase().includes(query);

      const messageMatches = conversation.messages.some((message) =>
        message.content.toLowerCase().includes(query),
      );
      return titleMatches || messageMatches;
    });
  }
}
