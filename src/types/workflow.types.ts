import { Action, Tool } from "./action.types";
import { LLMProvider } from "./llm.types";

export interface WorkflowNode {
  id: string;
  name: string;
  description?: string;
  input: NodeIO;
  output: NodeIO;
  action: Action;
  dependencies: string[];
}

export interface NodeIO {
  type: string;
  schema: object;
  value: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  variables: Map<string, any>;
  llmProvider?: LLMProvider;

  execute(callback?: WorkflowCallback): Promise<void>;
  addNode(node: WorkflowNode): void;
  removeNode(nodeId: string): void;
  getNode(nodeId: string): WorkflowNode;
  validateDAG(): boolean;
}

export type WorkflowCallback = (node: CallbackNode, event: CallbackEvent) => Promise<any>;

export interface CallbackNode {
  task?: WorkflowNode;
  toolCall?: {
    name: string;
    tool: Tool<any, any>;
    input?: any;
    output?: any;
  };
  isTask(): boolean;
  isToolCall(): boolean;
}

export type CallbackEvent = 'task_start' | 'task_end' | 'tool_start' | 'tool_end';
