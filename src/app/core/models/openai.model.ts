export interface OpenAIModel {
  id: string;
  object: string;
  owned_by: string;
}

export interface OpenAIChatModelsResponse {
  object: string;
  data: OpenAIModel[];
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  responseTime?: number;
}

export interface OpenAIChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenAIChatChoice {
  index: number;
  message: ChatMessage;
}

export interface UsageTokens {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChatChoice[];
  usage?: UsageTokens;
}
