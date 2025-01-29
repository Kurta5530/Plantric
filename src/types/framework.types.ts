import { LLMConfig } from './llm.types';
import { WorkflowNode, Workflow } from './workflow.types';
import { ExecutionContext } from './action.types';

export interface LyvoFramework {
  // Workflow management with specific modification types
  generateWorkflow(prompt: string, llmConfig: LLMConfig): Promise<Workflow>;

  // Node-specific modifications instead of generic object
  addNode(workflow: Workflow, node: WorkflowNode): Workflow;
  removeNode(workflow: Workflow, nodeId: string): Workflow;
  updateNode(workflow: Workflow, nodeId: string, updates: Partial<WorkflowNode>): Workflow;

  // Using specific LLMConfig for each call
  modifyWorkflowWithPrompt(
    workflow: Workflow,
    prompt: string,
    llmConfig: LLMConfig
  ): Promise<Workflow>;

  // Execution
  executeWorkflow(
    workflow: Workflow,
    context?: ExecutionContext,
    llmConfig?: LLMConfig
  ): Promise<void>;
}
