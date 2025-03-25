import { LLMProvider, LLMParameters, Message } from '../../types/llm.types';
import { Workflow } from '../../types/workflow.types';
import { WorkflowImpl } from '../../models/workflow';
import { ActionImpl } from '../../models/action';
import { ToolRegistry } from '../../core/tool-registry';
import { createWorkflowPrompts, createWorkflowGenerationTool } from './templates';
import { v4 as uuidv4 } from 'uuid';
import { LyvoConfig } from '@/types';

export class WorkflowGenerator {
  message_history: Message[] = [];

  constructor(
    private llmProvider: LLMProvider,
    private toolRegistry: ToolRegistry
  ) {}

  async generateWorkflow(prompt: string, lyvoConfig: LyvoConfig): Promise<Workflow> {
    return this.doGenerateWorkflow(prompt, false, lyvoConfig);
  }

  async generateWorkflowFromJson(json: any, lyvoConfig: LyvoConfig): Promise<Workflow> {
    return this.createWorkflowFromData(json, lyvoConfig);
  }

  async modifyWorkflow(prompt: string, lyvoConfig: LyvoConfig): Promise<Workflow> {
    return this.doGenerateWorkflow(prompt, true, lyvoConfig);
  }

  private async doGenerateWorkflow(prompt: string, modify: boolean, lyvoConfig: LyvoConfig): Promise<Workflow> {
    // Create prompts with current set of tools
    const prompts = createWorkflowPrompts(this.toolRegistry.getToolDefinitions());

    let messages: Message[] = [];
    if (modify) {
      messages = this.message_history;
      messages.push({
        role: 'user',
        content: prompts.modifyUserPrompt(prompt),
      });
    } else {
      messages = this.message_history = [
        {
          role: 'system',
          content: prompts.formatSystemPrompt(),
        },
        {
          role: 'user',
          content: prompts.formatUserPrompt(prompt),
        },
      ];
    }

    const params: LLMParameters = {
      temperature: 0.7,
      maxTokens: 8192,
      tools: [createWorkflowGenerationTool(this.toolRegistry)],
      toolChoice: { type: 'tool', name: 'generate_workflow' },
    };

    const response = await this.llmProvider.generateText(messages, params);

    if (!response.toolCalls.length || !response.toolCalls[0].input.workflow) {
      messages.pop();
      throw new Error('Failed to generate workflow: Invalid response from LLM');
    }

    messages.push(
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: response.toolCalls[0].id,
            name: response.toolCalls[0].name,
            input: response.toolCalls[0].input,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: response.toolCalls[0].id,
            content: 'ok',
          },
        ],
      }
    );

    const workflowData = response.toolCalls[0].input.workflow as any;

    // debug
    console.log("Debug the workflow...")
    console.log({ ...workflowData});

    // Add workflow summary subtask
    (workflowData.nodes as any[]).push({
      "id": "final",
      "type": "action",
      "dependencies": workflowData.nodes.map((node: { id: any; }) => node.id),
      "action": {
        "type": "prompt",
        "name": "Summarize the workflow.",
        "description": "Summarize briefly what this workflow has accomplished. Your summary should be based on user\'s original query.",
        "tools": [
          "summary_workflow"
        ]
      },
    })
    console.log("Debug the workflow...Done")    
    
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

    return this.createWorkflowFromData(workflowData, lyvoConfig);
  }

  private createWorkflowFromData(data: any, lyvoConfig: LyvoConfig): Workflow {
    const workflow = new WorkflowImpl(
      data.id,
      data.name,
      lyvoConfig,
      data.description || '',
      [],
      new Map(Object.entries(data.variables || {})),
      this.llmProvider,
      {
        logLevel: 'info',
        includeTimestamp: true,
      }
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
          { maxTokens: 8192 }
        );

        const node = {
          id: nodeData.id,
          name: nodeData.name || nodeData.id,
          input: nodeData.input || { type: 'any', schema: {}, value: undefined },
          output: nodeData.output || { type: 'any', schema: {}, value: undefined },
          action: action,
          dependencies: nodeData.dependencies || [],
        };
        workflow.addNode(node);
      });
    }

    return workflow;
  }
}
