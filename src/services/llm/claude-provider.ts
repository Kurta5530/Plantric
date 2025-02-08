import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMParameters, LLMResponse, Message, LLMStreamHandler, ToolCall } from '../../types/llm.types';

interface PartialToolUse {
  id: string;
  name: string;
  accumulatedJson: string;
}

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  private processResponse(response: Anthropic.Message): LLMResponse {
    const toolCalls = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
      .map((block) => ({
        id: block.id,
        name: block.name,
        input: block.input,
      })) as ToolCall[];

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      textContent: textContent || null,
      content: response.content,
      toolCalls,
      stop_reason: response.stop_reason,
    };
  }

  async generateText(messages: Message[], params: LLMParameters): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: params.model || this.defaultModel,
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature,
      messages: messages as Anthropic.MessageParam[],
      tools: params.tools as Anthropic.Tool[],
      tool_choice: params.toolChoice as Anthropic.ToolChoice,
    });

    return this.processResponse(response);
  }

  async generateStream(
    messages: Message[],
    params: LLMParameters,
    handler: LLMStreamHandler
  ): Promise<void> {
    const stream = await this.client.messages.stream({
      model: params.model || this.defaultModel,
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature,
      messages: messages as Anthropic.MessageParam[],
      tools: params.tools as Anthropic.Tool[],
      tool_choice: params.toolChoice as Anthropic.ToolChoice,
    });

    handler.onStart?.();

    let currentToolUse: PartialToolUse | null = null;

    try {
      for await (const event of stream) {
        switch (event.type) {
          case 'content_block_start':
            if (event.content_block.type === 'text') {
              handler.onContent?.('');
            } else if (event.content_block.type === 'tool_use') {
              currentToolUse = {
                id: event.content_block.id,
                name: event.content_block.name,
                accumulatedJson: '',
              };
            }
            break;

          case 'content_block_delta':
            if (event.delta.type === 'text_delta') {
              handler.onContent?.(event.delta.text);
            } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
              currentToolUse.accumulatedJson += event.delta.partial_json;
            }
            break;

          case 'content_block_stop':
            if (currentToolUse) {
              const toolCall: ToolCall = {
                id: currentToolUse.id,
                name: currentToolUse.name,
                input: JSON.parse(currentToolUse.accumulatedJson),
              };
              handler.onToolUse?.(toolCall);
              currentToolUse = null;
            }
            break;
        }
      }

      const message = await stream.finalMessage();
      handler.onComplete?.(this.processResponse(message));
    } catch (error) {
      handler.onError?.(error as Error);
    }
  }
}
