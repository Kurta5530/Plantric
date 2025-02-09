// src/models/action.ts

import { Action, Tool, ExecutionContext, InputSchema } from '../types/action.types';
import { LLMProvider, Message, LLMParameters, LLMStreamHandler, ToolDefinition } from '../types/llm.types';

/**
 * Special tool that allows LLM to write values to context
 */
class WriteContextTool implements Tool {
  name = 'write_context';
  description = 'Write a value to the workflow context. Use this to store intermediate results or outputs.';
  input_schema = {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'The key to store the value under'
      },
      value: {
        type: 'string',
        description: 'The value to store (must be JSON stringified if object/array)'
      }
    },
    required: ['key', 'value']
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

export class ActionImpl implements Action {
  private writeContextTool: WriteContextTool;

  constructor(
    public type: 'prompt',  // Only support prompt type
    public name: string,
    public tools: Tool[],
    private llmProvider: LLMProvider,
    private llmConfig?: LLMParameters
  ) {
    this.writeContextTool = new WriteContextTool();
    this.tools = [...tools, this.writeContextTool];
  }

  async execute(input: unknown, context: ExecutionContext): Promise<unknown> {
    // Create tool map combining context tools and action tools
    const toolMap = new Map<string, Tool>();
    this.tools.forEach(tool => toolMap.set(tool.name, tool));
    context.tools.forEach(tool => toolMap.set(tool.name, tool));

    // Format system prompt with context information
    const systemPrompt = this.formatSystemPrompt(context);

    // Format user prompt with input
    const userPrompt = this.formatUserPrompt(input);

    // Prepare messages for the conversation
    const messages: Message[] = [
      { role: 'user', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Configure tool parameters
    const params: LLMParameters = {
      ...this.llmConfig,
      tools: Array.from(toolMap.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema
      })) as ToolDefinition[]
    };

    // Set up stream handler
    const handler: LLMStreamHandler = {
      onContent: (content) => {
        if (content.trim()) {
          console.log('LLM:', content);
        }
      },
      onToolUse: async (toolCall) => {
        console.log('Tool Call:', toolCall.name, toolCall.input);

        const tool = toolMap.get(toolCall.name);
        if (!tool) {
          throw new Error(`Tool not found: ${toolCall.name}`);
        }

        try {
          const result = await tool.execute(context, toolCall.input);
          messages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: [{ type: 'text', text: JSON.stringify(result) }]
            }]
          });
          console.log('Tool Result:', result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            messages.push({
              role: 'user',
              content: [{
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                is_error: true
              }]
            });
            console.error('Tool Error:', err);
        }
      },
      onError: (error) => {
        console.error('Stream Error:', error);
      }
    };

    // Execute streaming conversation
    await this.llmProvider.generateStream(messages, params, handler);

    // Return the final context
    return context.variables;
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
    tools: Tool[],
    llmProvider: LLMProvider,
    llmConfig?: LLMParameters
  ): Action {
    return new ActionImpl('prompt', name, tools, llmProvider, llmConfig);
  }
}
