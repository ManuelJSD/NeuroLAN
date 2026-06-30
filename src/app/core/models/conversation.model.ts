import { ChatMessage } from "./lmstudio.model";

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}
