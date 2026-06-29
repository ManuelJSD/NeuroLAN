import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Conversation {

  saveConversation(conversation: Conversation) {

  }

  loadConversartions(): Promise<Conversation[]> {
    return Promise.resolve([]);
  }

}
