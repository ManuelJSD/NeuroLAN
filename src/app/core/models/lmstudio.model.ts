export interface OpenAIModel {
  id: string;
  object: string;
  owned_by: string;
}

export interface LmStudioModelsResponse {
  object: string;
  data: OpenAIModel[];
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  responseTime?: number;
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

export interface UsageTokens {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LmStudioChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LmStudioChatChoice[];
  usage?: UsageTokens;
}
