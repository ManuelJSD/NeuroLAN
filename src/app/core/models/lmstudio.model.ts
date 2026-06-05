export interface LmStudioModelsResponse {
  models: LmStudioModel[];
}

export type LmStudioModelType = 'llm' | 'embedding';

export interface LmStudioModel {
  key: string;
  display_name: string;
  type: LmStudioModelType;
  params_string?: string | null;
  size_bytes?: number;
  description?: string | null;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface LmStudioChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface LmStudioChatChoice {
  index: number;
  message: ChatMessage;
}

export interface LmStudioChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LmStudioChatChoice[];
}
