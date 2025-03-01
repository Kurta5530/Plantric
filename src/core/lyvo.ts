import { WorkflowGenerator } from '../services/workflow/generator';
import { ClaudeProvider } from '../services/llm/claude-provider';
import { OpenaiProvider } from '../services/llm/openai-provider';
import {
  LyvoConfig,
  LyvoInvokeParam,
  LLMProvider,
  Tool,
  Workflow,
  ClaudeConfig,
  OpenaiConfig,
  WorkflowCallback,
  NodeOutput,
} from '../types';
import { ToolRegistry } from './tool-registry';

/**
 * Lyvo core
 */
export class Lyvo {
  public static tools: Map<string, Tool<any, any>> = new Map();

  private llmProvider: LLMProvider;
  private toolRegistry = new ToolRegistry();
  private workflowGeneratorMap = new Map<Workflow, WorkflowGenerator>();

  constructor(config: LyvoConfig) {
    if (typeof config == 'string') {
      this.llmProvider = new ClaudeProvider(config);
    } else if ('llm' in config) {
      if (config.llm == 'claude') {
        let claudeConfig = config as ClaudeConfig;
        this.llmProvider = new ClaudeProvider(
          claudeConfig.apiKey,
          claudeConfig.modelName,
          claudeConfig.options
        );
      } else if (config.llm == 'openai') {
        let openaiConfig = config as OpenaiConfig;
        this.llmProvider = new OpenaiProvider(
          openaiConfig.apiKey,
          openaiConfig.modelName,
          openaiConfig.options
        );
      } else {
        throw new Error('Unknown parameter: llm > ' + config['llm']);
      }
    } else {
      this.llmProvider = config as LLMProvider;
    }
    Lyvo.tools.forEach((tool) => this.toolRegistry.registerTool(tool));
  }

  public async generate(prompt: string, param?: LyvoInvokeParam): Promise<Workflow> {
    let toolRegistry = this.toolRegistry;
    if (param && param.tools && param.tools.length > 0) {
      toolRegistry = new ToolRegistry();
      for (let i = 0; i < param.tools.length; i++) {
        let tool = param.tools[i];
        if (typeof tool == 'string') {
          toolRegistry.registerTool(this.getTool(tool));
        } else {
          toolRegistry.registerTool(tool);
        }
      }
    }
    const generator = new WorkflowGenerator(this.llmProvider, toolRegistry);
    const workflow = await generator.generateWorkflow(prompt);
    this.workflowGeneratorMap.set(workflow, generator);
    return workflow;
  }

  public async execute(workflow: Workflow, callback?: WorkflowCallback): Promise<NodeOutput[]> {
    // Inject LLM provider at workflow level
    workflow.llmProvider = this.llmProvider;

    // Process each node's action
    for (const node of workflow.nodes) {
      if (node.action.type === 'prompt') {
        // Inject LLM provider
        node.action.llmProvider = this.llmProvider;

        // Resolve tools
        node.action.tools = node.action.tools.map(tool => {
          if (typeof tool === 'string') {
            return this.toolRegistry.getTool(tool);
          }
          return tool;
        });
      }
    }

    return await workflow.execute(callback);
  }

  public async modify(workflow: Workflow, prompt: string): Promise<Workflow> {
    const generator = this.workflowGeneratorMap.get(workflow) as WorkflowGenerator;
    workflow = await generator.modifyWorkflow(prompt);
    this.workflowGeneratorMap.set(workflow, generator);
    return workflow;
  }

  private getTool(toolName: string) {
    let tool: Tool<any, any>;
    if (this.toolRegistry.hasTools([toolName])) {
      tool = this.toolRegistry.getTool(toolName);
    } else if (Lyvo.tools.has(toolName)) {
      tool = Lyvo.tools.get(toolName) as Tool<any, any>;
    } else {
      throw new Error(`Tool with name ${toolName} not found`);
    }
    return tool;
  }

  public async callTool(toolName: string, input: object, callback?: WorkflowCallback): Promise<any>;
  public async callTool(
    tool: Tool<any, any>,
    input: object,
    callback?: WorkflowCallback
  ): Promise<any>;

  public async callTool(
    tool: Tool<any, any> | string,
    input: object,
    callback?: WorkflowCallback
  ): Promise<any> {
    if (typeof tool === 'string') {
      tool = this.getTool(tool);
    }
    let context = {
      llmProvider: this.llmProvider,
      variables: new Map<string, unknown>(),
      tools: new Map<string, Tool<any, any>>(),
      callback,
    };
    let result = await tool.execute(context, input);
    if (tool.destroy) {
      tool.destroy(context);
    }
    return result;
  }

  public registerTool(tool: Tool<any, any>): void {
    this.toolRegistry.registerTool(tool);
  }

  public unregisterTool(toolName: string): void {
    this.toolRegistry.unregisterTool(toolName);
  }
}

export default Lyvo;
