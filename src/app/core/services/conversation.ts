import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { Conversation } from '../models/conversation.model';
import localforage from 'localforage';

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  private readonly STORAGE_KEY = 'conversations';
  private toastController = inject(ToastController);
  private translateService = inject(TranslateService);

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

  async exportSingleConversationToJson(id: string) {
    const conversation = await this.getConversationsbyId(id);
    if (!conversation) return;

    // 1. Convert to JSON string
    const jsonString = JSON.stringify(conversation, null, 2);

    // 2. Create a Blob with the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 3. Create an object URL from the Blob
    const url = window.URL.createObjectURL(blob);

    // 4. Create a download link and trigger click
    const safeName = conversation.title.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `neuro-lan-conversation-${safeName}-${Date.now()}.json`;
    downloadLink.click();

    // 5. Revoke the object URL to free memory
    window.URL.revokeObjectURL(url);
  }

  private generateMarkdownContent(conversation: Conversation) {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n\n---\n\n`;

    conversation.messages.forEach((message) => {
      const roleLabel = message.role === 'user' ? 'You' : 'Assistant';
      markdown += `### ${roleLabel}\n\n`;
      markdown += `${message.content}\n\n`;
    });

    return markdown;
  }

  async exportSingleConversationToMarkdown(id: string) {
    const conversation = await this.getConversationsbyId(id);
    if (!conversation) return;

    // 1. Convert to Markdown
    const markdownContent = this.generateMarkdownContent(conversation);

    // 2. Create a Blob with the Markdown content
    const blob = new Blob([markdownContent], { type: 'text/markdown' });

    // 3. Create an object URL from the Blob
    const url = window.URL.createObjectURL(blob);

    // 4. Create a download link and trigger click
    const safeName = conversation.title.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `neuro-lan-conversation-${safeName}-${Date.now()}.md`;
    downloadLink.click();

    // 5. Revoke the object URL to free memory
    window.URL.revokeObjectURL(url);
  }

  async exportConversations() {
    // 1. Get all conversations
    const conversations = await this.loadConversartions();

    // 2. Convert to JSON string
    const jsonString = JSON.stringify(conversations, null, 2);

    // 3. Create a Blob with the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 4. Create an object URL from the Blob
    const url = window.URL.createObjectURL(blob);

    // 5. Create a download link and trigger click
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `neuro-lan-conversations-${Date.now()}.json`;
    downloadLink.click();

    // 6. Revoke the object URL to free memory
    window.URL.revokeObjectURL(url);
  }

  async importConversations() {
    // 1. Create a hidden file input to select the JSON file
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.click();

    // 2. Wait for the user to select the file
    fileInput.onchange = async (event: any) => {
      const file = event.target.files[0];

      if (!file) return;

      // 3. Read the JSON file
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        try {
          const jsonString = e.target.result;
          const importedConversations: Conversation[] = JSON.parse(jsonString);

          // 4. Validate the basic structure of the imported data
          if (
            !Array.isArray(importedConversations) ||
            importedConversations.some(
              (c) => !c.id || !c.createdAt || !c.title || !c.messages,
            )
          ) {
            const toast = await this.toastController.create({
              message: this.translateService.instant('CONVERSATIONS.IMPORT_ERROR_FORMAT'),
              duration: 3000,
              color: 'warning',
              position: 'bottom'
            });
            await toast.present();
            return;
          }

          // 5. Get current conversations and merge
          const currentConversations = await this.loadConversartions();

          const mergedConversations = [...currentConversations];

          // Add or update conversations from the imported file
          importedConversations.forEach((importedConv) => {
            const existingIndex = mergedConversations.findIndex(
              (c) => c.id === importedConv.id,
            );

            if (existingIndex !== -1) {
              // If it exists, keep the version with more messages
              const currentConv = mergedConversations[existingIndex];

              if (importedConv.messages.length > currentConv.messages.length) {
                currentConv.messages = importedConv.messages;
                currentConv.title = importedConv.title;
                currentConv.createdAt = importedConv.createdAt;
              }
            } else {
              // If it doesn't exist, add the new conversation
              mergedConversations.push(importedConv);
            }
          });

          // 6. Sort all conversations by most recent date
          mergedConversations.sort((a, b) => b.createdAt - a.createdAt);

          // 7. Save to localforage and update the observable
          await localforage.setItem(this.STORAGE_KEY, mergedConversations);
          this.conversationsSubject.next(mergedConversations);

          const toast = await this.toastController.create({
            message: this.translateService.instant('CONVERSATIONS.IMPORT_SUCCESS'),
            duration: 3000,
            color: 'success',
            position: 'bottom'
          });
          await toast.present();
        } catch (error) {
          console.error('Error al procesar el archivo JSON:', error);
          const toast = await this.toastController.create({
            message: this.translateService.instant('CONVERSATIONS.IMPORT_ERROR_CORRUPT'),
            duration: 3000,
            color: 'danger',
            position: 'bottom'
          });
          await toast.present();
        }
      };

      reader.readAsText(file);
    };
  }
}
