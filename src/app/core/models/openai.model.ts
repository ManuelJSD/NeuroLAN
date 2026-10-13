export interface OpenAIModel {
  id: string;
  object: string;
  owned_by: string;
}

export interface OpenAIChatModelsResponse {
  object: string;
  data: OpenAIModel[];
}

// --- Tool Calling ---

// Parámetros de una función (JSON Schema)
export interface ToolFunctionParameters {
  type: 'object';
  properties: Record<string, { type: string; description: string }>;
  required?: string[];
}

// Definición de una función que el modelo puede llamar
export interface ToolFunction {
  name: string;
  description: string;
  parameters: ToolFunctionParameters;
}

// Tool definition sent to the model in the request
export interface Tool {
  type: 'function';
  function: ToolFunction;
}

// Tool call returned by the model when it wants to invoke a function
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON serializado; usar JSON.parse() para leerlo
  };
}

// 'tool' is used to send the result of a tool call back to the model
export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface MemoryActionRecord {
  action: 'add' | 'update' | 'delete';
  content: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  // --- Tool Calling ---
  // Present in 'assistant' messages when the model wants to invoke a tool
  tool_calls?: ToolCall[];
  // Present in 'tool' messages to link the result back to the original call
  tool_call_id?: string;
  // --- UI metadata (not sent to the API) ---
  responseTime?: number;
  ttft?: number;
  tokensPerSecond?: number;
  tokensCount?: number;
  // Web search sources attached to the final assistant response
  sources?: { title: string; url: string; snippet: string }[];
  // Memorias detectadas y actualizadas en este turno
  memoryActions?: MemoryActionRecord[];
  showMemoryDetails?: boolean;
}

export interface OpenAIChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  // --- Tool Calling ---
  // List of tools available to the model
  tools?: Tool[];
  // 'auto': model decides; 'none': disables tools; 'required': forces tool use
  tool_choice?: 'auto' | 'none' | 'required';
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
