import { LLMProvider, LLMParameters, Message } from '../../types/llm.types';
import { Workflow } from '../../types/workflow.types';
import { WorkflowImpl } from '../../models/workflow';
import {ActionImpl} from '../../models/action';
import { ToolRegistry } from '../../core/tool-registry';
import { createWorkflowPrompts, createWorkflowGenerationTool } from './templates';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowGenerator {
  constructor(
    private llmProvider: LLMProvider,
    private toolRegistry: ToolRegistry
  ) {}

  async generateWorkflow(prompt: string): Promise<Workflow> {
    // Create prompts with current set of tools
    const prompts = createWorkflowPrompts(this.toolRegistry.getToolDefinitions());

    const messages: Message[] = [
      {
        role: 'system',
        content: prompts.formatSystemPrompt()
      },
      {
        role: 'user',
        content: prompts.formatUserPrompt(prompt)
      }
    ];

    const params: LLMParameters = {
      temperature: 0.7,
      maxTokens: 8192,
      tools: [createWorkflowGenerationTool(this.toolRegistry)],
      toolChoice: { type: 'tool', name: 'generate_workflow' }
    };

    const response = await this.llmProvider.generateText(messages, params);

    if (!response.toolCalls.length || !response.toolCalls[0].input.workflow) {
      throw new Error('Failed to generate workflow: Invalid response from LLM');
    }

    const workflowData = response.toolCalls[0].input.workflow as any;

    // Validate all tools exist
    for (const node of workflowData.nodes) {
      if (!this.toolRegistry.hasTools(node.action.tools)) {
        throw new Error(`Workflow contains undefined tools: ${node.action.tools}`);
      }
    }

    // Generate a new UUID if not provided
    if (!workflowData.id) {
      workflowData.id = uuidv4();
    }

    return this.createWorkflowFromData(workflowData);
  }

  private createWorkflowFromData(data: any): Workflow {
    const workflow = new WorkflowImpl(
      data.id,
      data.name,
      data.description || '',
      [],
      new Map(Object.entries(data.variables || {})),
      this.llmProvider,
    );

    // Add nodes to workflow
    if (Array.isArray(data.nodes)) {
      data.nodes.forEach((nodeData: any) => {
        const tools = nodeData.action.tools.map((toolName: string) =>
          this.toolRegistry.getTool(toolName)
        );

        const action = ActionImpl.createPromptAction(
          nodeData.action.name,
          nodeData.action.description,
          tools,
          this.llmProvider,
          { maxTokens: 1000 }
        );

        const node = {
          id: nodeData.id,
          name: nodeData.name || nodeData.id,
          input: nodeData.input || { type: 'any', schema: {}, value: undefined },
          output: nodeData.output || { type: 'any', schema: {}, value: undefined },
          action: action,
          dependencies: nodeData.dependencies || []
        };
        workflow.addNode(node);
      });
    }

    return workflow;
  }

  async modifyWorkflow(workflow: Workflow, prompt: string): Promise<Workflow> {
    throw new Error('Not implemented');
  }
}
