import Anthropic, { ClientOptions } from '@anthropic-ai/sdk';
import {
  LLMProvider,
  LLMParameters,
  LLMResponse,
  Message,
  LLMStreamHandler,
  ToolCall,
} from '../../types/llm.types';

interface PartialToolUse {
  id: string;
  name: string;
  accumulatedJson: string;
}

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel = 'claude-3-5-sonnet-20241022';

  constructor(options: ClientOptions, defaultModel?: string);
  constructor(apiKey: string, defaultModel?: string | null, options?: ClientOptions);

  constructor(
    param: string | ClientOptions,
    defaultModel?: string | null,
    options?: ClientOptions
  ) {
    if (defaultModel) {
      this.defaultModel = defaultModel;
    }
    if (typeof param == 'string') {
      this.client = new Anthropic({
        apiKey: param,
        dangerouslyAllowBrowser: true,
        ...options,
      });
    } else {
      this.client = new Anthropic(param);
    }
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

  private extractSystemAndUserMessages(messages: Message[]): {
    system?: string;
    userMessages: Anthropic.MessageParam[];
  } {
    const systemMessages: string[] = [];
    const userMessages: Anthropic.MessageParam[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // For system messages, we only support string content
        if (typeof message.content !== 'string') {
          throw new Error('System messages must have string content');
        }
        systemMessages.push(message.content);
      } else {
        // For user and assistant messages, we support both string and array content
        userMessages.push({
          role: message.role as 'user' | 'assistant',
          content: message.content as any,
        });
      }
  }
      // Combine all system messages into a single string if any exist
      const system = systemMessages.length > 0 ? systemMessages.join('\n') : undefined;

      return { system, userMessages };
    }

  async generateText(messages: Message[], params: LLMParameters): Promise<LLMResponse> {
<<<<<<< HEAD
    let system = messages
      .filter((s) => s.role == 'system')
      .map((s) => {
        if (typeof s.content == 'string') {
          return s.content;
        } else {
          return (s.content[0] as any).text as string;
        }
      })[0];
=======
    const { system, userMessages } = this.extractSystemAndUserMessages(messages);
>>>>>>> 76bbffb (refactor(action & llm-provider): streamline message formatting)
    const response = await this.client.messages.create({
      system,
      model: params.model || this.defaultModel,
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature,
<<<<<<< HEAD
      messages: messages.filter((s) => s.role != 'system') as Anthropic.MessageParam[],
=======
      system,
      messages: userMessages,
>>>>>>> 76bbffb (refactor(action & llm-provider): streamline message formatting)
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
    let system = messages
      .filter((s) => s.role == 'system')
      .map((s) => {
        if (typeof s.content == 'string') {
          return s.content;
        } else {
          return (s.content[0] as any).text as string;
        }
      })[0];
    const stream = await this.client.messages.stream({
      system,
      model: params.model || this.defaultModel,
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature,
      messages: messages.filter((s) => s.role != 'system') as Anthropic.MessageParam[],
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
