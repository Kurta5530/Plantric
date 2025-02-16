import { WorkflowGenerator } from '../services/workflow/generator';
import { ClaudeProvider } from '../services/llm/claude-provider';
import { OpenaiProvider } from '../services/llm/openai-provider';
import * as fellouUtils from '../services/tools/fellou';
import {
  LyvoConfig,
  LyvoInvokeParam,
  LLMProvider,
  Tool,
  Workflow,
  ClaudeConfig,
  OpenaiConfig,
  WorkflowCallback,
} from '../types';
import { ToolRegistry } from './tool-registry';

/**
 * Lyvo core
 */
export class Lyvo {
  private llmProvider: LLMProvider;
  private toolRegistry = new ToolRegistry();

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
  }

  public async generateWorkflow(prompt: string, param?: LyvoInvokeParam): Promise<Workflow> {
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
    return await generator.generateWorkflow(prompt);
  }

  public async execute(workflow: Workflow, callback?: WorkflowCallback): Promise<void> {
    return await workflow.execute(callback);
  }

  private getTool(toolName: string) {
    let tool: Tool<any, any>;
    if (this.toolRegistry.hasTools([toolName])) {
      tool = this.toolRegistry.getTool(toolName);
    } else {
      let _tool = Lyvo.tools.get(toolName);
      if (!_tool) {
        throw new Error(`Tool with name ${toolName} not found`);
      }
      tool = _tool;
    }
    return tool;
  }

  public async callTool(toolName: string, input: object): Promise<any> {
    let tool = this.getTool(toolName);
    let context = {
      llmProvider: this.llmProvider,
      variables: new Map<string, unknown>(),
      tools: new Map<string, Tool<any, any>>(),
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

export namespace Lyvo {
  export const fellou = fellouUtils;
  export const tools = new Map<string, Tool<any, any>>();
}

export default Lyvo;
