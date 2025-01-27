export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  // Add other LLM-specific parameters
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
