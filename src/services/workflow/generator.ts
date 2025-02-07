import { LLMProvider, LLMParameters, Message } from '../../types/llm.types';
import { Workflow, WorkflowNode } from '../../types/workflow.types';
import { WorkflowImpl } from '../../models/workflow';
import { WORKFLOW_GENERATION_TOOL } from '../../schemas/workflow-tool.schema';
import { WORKFLOW_GENERATION_PROMPTS } from './prompts';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowGenerator {
  constructor(
    private llmProvider: LLMProvider,
    private defaultModel: string = 'claude-3-5-sonnet-20241022'
  ) {}

  async generateWorkflow(prompt: string): Promise<Workflow> {
    const messages: Message[] = [
      {
        role: 'user',
        content: WORKFLOW_GENERATION_PROMPTS.SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: WORKFLOW_GENERATION_PROMPTS.formatUserPrompt(prompt)
      }
    ];

    const params: LLMParameters = {
      model: this.defaultModel,
      temperature: 0.7,
      maxTokens: 4000,
      tools: [WORKFLOW_GENERATION_TOOL],
      toolChoice: { type: 'tool', name: 'generate_workflow' }
    };

    const response = await this.llmProvider.generateText(messages, params);

    if (!response.toolCalls.length || !response.toolCalls[0].input.workflow) {
      throw new Error('Failed to generate workflow: Invalid response from LLM');
    }

    const workflowData = response.toolCalls[0].input.workflow as any;

    // Generate a new UUID if not provided
    if (!workflowData.id) {
      workflowData.id = uuidv4();
    }

    // Convert to runtime workflow object
    return this.createWorkflowFromData(workflowData);
  }

  private createWorkflowFromData(data: any): Workflow {
    // Convert plain object to WorkflowImpl instance
    const workflow = new WorkflowImpl(
      data.id,
      data.name,
      undefined,
      [],
      new Map(Object.entries(data.variables || {}))
    );

    // Add nodes to workflow
    if (Array.isArray(data.nodes)) {
      data.nodes.forEach((nodeData: any) => {
        const node: WorkflowNode = {
          id: nodeData.id,
          name: nodeData.name || nodeData.id,
          input: nodeData.input || { type: 'any', schema: {}, value: undefined },
          output: nodeData.output || { type: 'any', schema: {}, value: undefined },
          action: nodeData.action,
          dependencies: nodeData.dependencies || []
        };
        workflow.addNode(node);
      });
    }

    return workflow;
  }

  async modifyWorkflow(workflow: Workflow, prompt: string): Promise<Workflow> {
    const messages: Message[] = [
      {
        role: 'user',
        content: WORKFLOW_GENERATION_PROMPTS.MODIFICATION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: WORKFLOW_GENERATION_PROMPTS.formatModificationPrompt(
          JSON.stringify(workflow, null, 2),
          prompt
        )
      }
    ];

    const params: LLMParameters = {
      model: this.defaultModel,
      temperature: 0.7,
      maxTokens: 30000,
      tools: [WORKFLOW_GENERATION_TOOL],
      toolChoice: { type: 'tool', name: 'generate_workflow' }
    };

    const response = await this.llmProvider.generateText(messages, params);

    if (!response.toolCalls.length || !response.toolCalls[0].input.workflow) {
      throw new Error('Failed to modify workflow: Invalid response from LLM');
    }

    const modifiedWorkflowData = response.toolCalls[0].input.workflow;
    return this.createWorkflowFromData(modifiedWorkflowData);
  }
}
