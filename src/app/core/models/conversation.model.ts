import { ChatMessage } from "./lmstudio.model";

export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  messages: ChatMessage[];
}
