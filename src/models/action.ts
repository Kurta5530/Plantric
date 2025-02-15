// src/models/action.ts

import { Action, Tool, ExecutionContext, InputSchema } from '../types/action.types';
import {
  LLMProvider,
  Message,
  LLMParameters,
  LLMStreamHandler,
  ToolDefinition,
  LLMResponse,
} from '../types/llm.types';

/**
 * Special tool that allows LLM to write values to context
 */
class WriteContextTool implements Tool<any, any> {
  name = 'write_context';
  description =
    'Write a value to the workflow context. Use this to store intermediate results or outputs.';
  input_schema = {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'The key to store the value under',
      },
      value: {
        type: 'string',
        description: 'The value to store (must be JSON stringified if object/array)',
      },
    },
    required: ['key', 'value'],
  } as InputSchema;

  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    const { key, value } = params as { key: string; value: string };
    try {
      // Try to parse the value as JSON
      const parsedValue = JSON.parse(value);
      context.variables.set(key, parsedValue);
    } catch {
      // If parsing fails, store as string
      context.variables.set(key, value);
    }
    return { success: true, key, value };
  }
}

function createReturnTool(outputSchema: unknown): Tool<any, any> {
  return {
    name: 'return_output',
    description:
      'Return the final output of this action. Use this to return a value matching the required output schema.',
    input_schema: {
      type: 'object',
      properties: {
        value: outputSchema || {
          // Default to accepting any JSON value
          type: ['string', 'number', 'boolean', 'object', 'null'],
          description: 'The output value',
        },
      } as unknown,
      required: ['value'],
    } as InputSchema,

    async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
      const { value } = params as { value: unknown };
      context.variables.set('__action_output', value);
      return { returned: value };
    },
  };
}

export class ActionImpl implements Action {
  private readonly maxRounds: number = 10; // Default max rounds
  private writeContextTool: WriteContextTool;

  constructor(
    public type: 'prompt', // Only support prompt type
    public name: string,
    public tools: Tool<any, any>[],
    private llmProvider: LLMProvider,
    private llmConfig?: LLMParameters,
    config?: { maxRounds?: number }
  ) {
    this.writeContextTool = new WriteContextTool();
    this.tools = [...tools, this.writeContextTool];
    if (config?.maxRounds) {
      this.maxRounds = config.maxRounds;
    }
  }

  private async executeSingleRound(
    messages: Message[],
    params: LLMParameters,
    toolMap: Map<string, Tool<any, any>>,
    context: ExecutionContext
  ): Promise<{
    response: LLMResponse | null;
    hasToolUse: boolean;
    roundMessages: Message[];
  }> {
    const roundMessages: Message[] = [];
    let hasToolUse = false;
    let response: LLMResponse | null = null;

    // Buffer to collect into roundMessages
    let assistantTextMessage = '';
    let toolUseMessage: Message | null = null;
    let toolResultMessage: Message | null = null;

    // Track tool execution promise
    let toolExecutionPromise: Promise<void> | null = null;

    const handler: LLMStreamHandler = {
      onContent: (content) => {
        if (content.trim()) {
          console.log('LLM:', content);
          assistantTextMessage += content;
        }
      },
      onToolUse: async (toolCall) => {
        console.log('Tool Call:', toolCall.name, toolCall.input);
        hasToolUse = true;

        const tool = toolMap.get(toolCall.name);
        if (!tool) {
          throw new Error(`Tool not found: ${toolCall.name}`);
        }

        toolUseMessage = {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: toolCall.id,
              name: tool.name,
              input: toolCall.input,
            },
          ],
        };

        // Store the promise of tool execution
        toolExecutionPromise = (async () => {
          try {
            const toolCallParam = {
              tool,
              name: toolCall.name,
              input: toolCall.input,
              output: undefined as any,
            };
            if (context.callback) {
              await context.callback(
                {
                  toolCall: toolCallParam,
                  isTask: () => false,
                  isToolCall: () => true,
                },
                'tool_start'
              );
              toolCall.input = toolCallParam.input;
            }
            let result = await tool.execute(context, toolCall.input);
            if (context.callback) {
              toolCallParam.output = result;
              await context.callback(
                {
                  toolCall: toolCallParam,
                  isTask: () => false,
                  isToolCall: () => true,
                },
                'tool_end'
              );
              result = toolCallParam.output;
            }
            const resultMessage: Message = {
              role: 'user',
              content: [
                result.image && result.image.type
                  ? {
                      type: 'tool_result',
                      tool_use_id: toolCall.id,
                      content: result.text
                        ? [
                            { type: 'image', source: result.image },
                            { type: 'text', text: result.text },
                          ]
                        : [{ type: 'image', source: result.image }],
                    }
                  : {
                      type: 'tool_result',
                      tool_use_id: toolCall.id,
                      content: [{ type: 'text', text: JSON.stringify(result) }],
                    },
              ],
            };
            toolResultMessage = resultMessage;
            console.log('Tool Result:', result);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            const errorResult: Message = {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                  is_error: true,
                },
              ],
            };
            toolResultMessage = errorResult;
            console.error('Tool Error:', err);
          }
        })();
      },
      onComplete: (llmResponse) => {
        response = llmResponse;
      },
      onError: (error) => {
        console.error('Stream Error:', error);
      },
    };

    // Wait for stream to complete
    await this.llmProvider.generateStream(messages, params, handler);

    // Wait for tool execution to complete if it was started
    if (toolExecutionPromise) {
      await toolExecutionPromise;
    }

    // Add messages in the correct order after everything is complete
    if (assistantTextMessage) {
      roundMessages.push({ role: 'assistant', content: assistantTextMessage });
    }
    if (toolUseMessage) {
      roundMessages.push(toolUseMessage);
    }
    if (toolResultMessage) {
      roundMessages.push(toolResultMessage);
    }

    return { response, hasToolUse, roundMessages };
  }

  async execute(
    input: unknown,
    context: ExecutionContext,
    outputSchema?: unknown
  ): Promise<unknown> {
    // Create return tool with output schema
    const returnTool = createReturnTool(outputSchema);

    // Create tool map combining context tools, action tools, and return tool
    const toolMap = new Map<string, Tool<any, any>>();
    this.tools.forEach((tool) => toolMap.set(tool.name, tool));
    context.tools.forEach((tool) => toolMap.set(tool.name, tool));
    toolMap.set(returnTool.name, returnTool);

    // Prepare initial messages
    const messages: Message[] =
      input && Object.keys(input).length > 0
        ? [
            { role: 'system', content: this.formatSystemPrompt(context) },
            { role: 'user', content: this.formatUserPrompt(input) },
          ]
        : [{ role: 'user', content: this.formatSystemPrompt(context) }];

    console.log('Starting LLM conversation...');
    console.log('Initial messages:', messages);
    console.log('Output schema:', outputSchema);

    // Configure tool parameters
    const params: LLMParameters = {
      ...this.llmConfig,
      tools: Array.from(toolMap.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      })) as ToolDefinition[],
    };

    let roundCount = 0;
    let lastResponse: LLMResponse | null = null;

    while (roundCount < this.maxRounds) {
      roundCount++;
      console.log(`Starting round ${roundCount} of ${this.maxRounds}`);

      console.log('Current conversation status:', JSON.stringify(messages, null, 2));
      const { response, hasToolUse, roundMessages } = await this.executeSingleRound(
        messages,
        params,
        toolMap,
        context
      );

      lastResponse = response;

      // Add round messages to conversation history
      messages.push(...roundMessages);

      // Check termination conditions
      if (!hasToolUse && response) {
        // LLM sent a message without using tools - request explicit return
        console.log('No tool use detected, requesting explicit return');
        const returnOnlyParams = {
          ...params,
          tools: [
            {
              name: returnTool.name,
              description: returnTool.description,
              input_schema: returnTool.input_schema,
            },
          ],
        } as LLMParameters;

        messages.push({
          role: 'user',
          content:
            'Please process the above information and return a final result using the return_output tool.',
        });

        const { roundMessages: finalRoundMessages } = await this.executeSingleRound(
          messages,
          returnOnlyParams,
          new Map([[returnTool.name, returnTool]]),
          context
        );
        messages.push(...finalRoundMessages);
        break;
      }

      if (response?.toolCalls.some((call) => call.name === 'return_output')) {
        console.log('Task completed with return_output tool');
        break;
      }

      // If this is the last round, force an explicit return
      if (roundCount === this.maxRounds) {
        console.log('Max rounds reached, requesting explicit return');
        const returnOnlyParams = {
          ...params,
          tools: [
            {
              name: returnTool.name,
              description: returnTool.description,
              input_schema: returnTool.input_schema,
            },
          ],
        } as LLMParameters;

        messages.push({
          role: 'user',
          content:
            'Maximum number of steps reached. Please return the best result possible with the return_output tool.',
        });

        const { roundMessages: finalRoundMessages } = await this.executeSingleRound(
          messages,
          returnOnlyParams,
          new Map([[returnTool.name, returnTool]]),
          context
        );
        messages.push(...finalRoundMessages);
      }
    }

    // Get and clean up output value
    const output = context.variables.get('__action_output');
    context.variables.delete('__action_output');

    if (output === undefined) {
      console.warn('Action completed without returning a value');
      return {};
    }

    return output;
  }

  private formatSystemPrompt(context: ExecutionContext): string {
    // Create a description of the current context
    const contextDescription = Array.from(context.variables.entries())
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return `You are executing the action "${this.name}". You have access to the following context:

${contextDescription || 'No context variables set'}

You can use the provided tools to accomplish your task. When you need to store results or outputs,
use the write_context tool to save them to the workflow context.

Remember to:
1. Use tools when needed to accomplish the task
2. Store important results using write_context
3. Think step by step about what needs to be done`;
  }

  private formatUserPrompt(input: unknown): string {
    if (typeof input === 'string') {
      return input;
    }
    return JSON.stringify(input, null, 2);
  }

  // Static factory method
  static createPromptAction(
    name: string,
    tools: Tool<any, any>[],
    llmProvider: LLMProvider,
    llmConfig?: LLMParameters
  ): Action {
    return new ActionImpl('prompt', name, tools, llmProvider, llmConfig);
  }
}
