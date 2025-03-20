import { ClientOptions as OpenAiClientOptions } from 'openai';
import { ClientOptions as ClaudeClientOption } from '@anthropic-ai/sdk';
import { LLMProvider } from './llm.types';
import { Tool } from './action.types';
import { WorkflowCallback } from './workflow.types';

export interface ClaudeConfig {
  llm: 'claude';
  apiKey: string;
  modelName?: string;
  options?: ClaudeClientOption;
}

export interface OpenaiConfig {
  llm: 'openai';
  apiKey: string;
  modelName?: string;
  options?: OpenAiClientOptions;
}

export type ClaudeApiKey = string;

export type LLMConfig = ClaudeApiKey | ClaudeConfig | OpenaiConfig | LLMProvider;

export interface LyvoConfig {
  workingWindowId?: number,
  callback?: WorkflowCallback,
}

export interface LyvoInvokeParam {
  tools?: Array<string> | Array<Tool<any, any>>;
}
