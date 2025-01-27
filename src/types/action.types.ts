export interface Tool {
  name: string;
  description: string;
  execute: (params: unknown) => Promise<unknown>;
}

export interface ExecutionContext {
  variables: Map<string, unknown>;
  tools: Map<string, Tool>;
}

export interface Action {
  type: "prompt" | "script" | "hybrid";
  name: string;
  execute: (input: unknown, context: ExecutionContext) => Promise<unknown>;
  tools: Tool[];
}
