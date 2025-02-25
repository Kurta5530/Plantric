import { ActionImpl } from '../../src/models/action';
import { Tool, ExecutionContext, InputSchema } from '../../src/types/action.types';
import { NodeInput, NodeOutput } from '../../src/types/workflow.types';
import { LLMProvider, Message, LLMParameters, LLMStreamHandler } from '../../src/types/llm.types';

// Mock tool for testing
class MockTool implements Tool<any, any> {
  constructor(
    public name: string,
    public description: string = 'Mock tool for testing',
    public shouldFail: boolean = false
  ) {}

  input_schema = {
    type: 'object',
    properties: {
      testParam: { type: 'string' },
    },
    required: ['testParam'],
  } as InputSchema;

  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    if (this.shouldFail) {
      throw new Error('Tool execution failed');
    }
    return { success: true, params };
  }
}

// Mock LLM provider
class MockLLMProvider implements LLMProvider {
  constructor(
    private toolCallResponses: Array<{ name: string; input: any }> = [],
    public shouldFail: boolean = false,
    public counter: number = 0
  ) {}

  async generateText(): Promise<any> {
    if (this.shouldFail) {
      throw new Error('LLM generation failed');
    }
    return {
      content: 'Test response',
      toolCalls: this.toolCallResponses,
    };
  }

  async generateStream(
    messages: Message[],
    params: LLMParameters,
    handler: LLMStreamHandler
  ): Promise<void> {
    if (this.shouldFail) {
      handler.onError?.(new Error('Stream generation failed'));
      return;
    }

    // Simulate thinking output
    handler.onContent?.('Thinking about the task...');

    // Process each tool call
    const toolCall = this.toolCallResponses[this.counter++];
    handler.onToolUse?.({
      id: `tool-${Math.random()}`,
      name: toolCall.name,
      input: toolCall.input,
    });

    // Final response
    handler.onComplete?.({
        content: [
          { type: 'text', text: 'Thinking about the task...' },
          {
            type: 'tool_use',
            id: `tool-${Math.random()}`,
            name: toolCall.name,
            input: toolCall.input
          }
        ],
        toolCalls: [{
          id: `tool-${Math.random()}`,
          name: toolCall.name,
          input: toolCall.input
        }],
        stop_reason: 'tool_use',
        textContent: null  // No text content when using tools
      });
  }
}

describe('ActionImpl', () => {
  let mockTool: MockTool;
  let mockLLMProvider: MockLLMProvider;
  let context: ExecutionContext;

  beforeEach(() => {
    mockTool = new MockTool('test_tool');
    mockLLMProvider = new MockLLMProvider();
    context = {
      llmProvider: mockLLMProvider,
      variables: new Map<string, unknown>(),
      tools: new Map<string, Tool<any, any>>(),
    };
  });

  describe('constructor', () => {
    it('should create an action with tools including write_context', () => {
      const action = ActionImpl.createPromptAction('test_action', 'This is an action for testing purposes', [mockTool], mockLLMProvider);

      expect(action.tools).toHaveLength(2); // Original tool + write_context
      expect(action.tools.some((t) => t.name === 'write_context')).toBeTruthy();
      expect(action.tools.some((t) => t.name === 'test_tool')).toBeTruthy();
    });
  });

  describe('execute', () => {
    it('should handle successful tool execution', async () => {
      // Setup LLM to make a tool call
      mockLLMProvider = new MockLLMProvider([
        { name: 'test_tool', input: { testParam: 'test' } },
        { name: 'return_output', input: { value: 'test return' } },
      ]);

      const action = ActionImpl.createPromptAction('test_action', 'This is an action for testing purposes', [mockTool], mockLLMProvider);

      const nodeInput: NodeInput = { items: [] };
      nodeInput.items.push({ name: 'test_input', description: 'Test input' } as NodeOutput);
      await action.execute(nodeInput, context);
      // Tool was successful, no errors thrown
    });

    it('should handle tool execution failure', async () => {
      // Setup failing tool
      mockTool = new MockTool('test_tool', 'Mock tool', true);
      mockLLMProvider = new MockLLMProvider([
        { name: 'test_tool', input: { testParam: 'test' } },
        { name: 'return_output', input: { value: 'test return' } },
    ]);

      const action = ActionImpl.createPromptAction('test_action', 'This is an action for testing purposes', [mockTool], mockLLMProvider);

      await action.execute('Test input', context);
      // Should handle tool failure gracefully, no error thrown
    });

    it('should handle LLM provider failure', async () => {
      mockLLMProvider = new MockLLMProvider([], true);

      const action = ActionImpl.createPromptAction('test_action', 'This is an action for testing purposes', [mockTool], mockLLMProvider);

      await expect(action.execute('Test input', context)).resolves.toBeDefined();
      // Should handle LLM failure gracefully
    });

    it('should properly use write_context tool', async () => {
      // Setup LLM to make a write_context call
      mockLLMProvider = new MockLLMProvider([
        {
          name: 'write_context',
          input: { key: 'test_key', value: JSON.stringify({ data: 'test' }) },
        },
        { name: 'return_output', input: { value: 'test return' } },
      ]);

      const action = ActionImpl.createPromptAction('test_action', 'This is an action for testing purposes', [mockTool], mockLLMProvider);

      await action.execute('Test input', context);

      // Check if value was written to context
      expect(context.variables.get('test_key')).toEqual({ data: 'test' });
    });

    it('should handle non-JSON values in write_context', async () => {
      // Setup LLM to make a write_context call with string value
      mockLLMProvider = new MockLLMProvider([
        {
          name: 'write_context',
          input: { key: 'test_key', value: 'plain text value' },
        },
        { name: 'return_output', input: { value: 'test return' } },
      ]);

      const action = ActionImpl.createPromptAction('test_action', 'This is an action for testing purposes', [mockTool], mockLLMProvider);

      await action.execute('Test input', context);

      // Check if value was written to context as string
      expect(context.variables.get('test_key')).toBe('plain text value');
    });

    it('should include context variables in user prompt', async () => {
      // Setup context with some variables
      context.variables.set('existingVar', 'test value');

      // Create mock LLM provider that captures messages
      const capturedMessages: Message[] = [];
      const mockLLMProviderWithCapture = new MockLLMProvider();
      mockLLMProviderWithCapture.generateStream = async (messages, params, handler) => {
        capturedMessages.push(...messages);
        // Continue with normal stream handling
        await handler.onContent?.('Test content');
      };

      const action = ActionImpl.createPromptAction(
        'test_action', 'This is an action for testing purposes',
        [mockTool],
        mockLLMProviderWithCapture
      );

      await action.execute('Test input', context);

      // Verify system prompt includes context variables
      const initialPrompt = capturedMessages[1].content as string;
      expect(initialPrompt).toContain('existingVar');
      expect(initialPrompt).toContain('test value');
    });

    it('should merge action tools with context tools', async () => {
      const contextTool = new MockTool('context_tool');
      context.tools?.set(contextTool.name, contextTool);

      mockLLMProvider = new MockLLMProvider([
        { name: 'context_tool', input: { testParam: 'test' } },
        { name: 'test_tool', input: { testParam: 'test' } },
        { name: 'return_output', input: { value: 'test return' } },
      ]);

      const action = ActionImpl.createPromptAction('test_action', 'This is an action for testing purposes', [mockTool], mockLLMProvider);

      await action.execute('Test input', context);
      // Both tools should have been accessible
    });
  });
});
