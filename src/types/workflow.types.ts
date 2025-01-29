import { Action } from "./action.types";

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

  execute(): Promise<void>;
  addNode(node: WorkflowNode): void;
  removeNode(nodeId: string): void;
  getNode(nodeId: string): WorkflowNode;
  validateDAG(): boolean;
}
