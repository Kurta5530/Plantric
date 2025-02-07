export interface Tool {
  name: string;
  description: string;
  input_schema: InputSchema;
  execute: (params: unknown) => Promise<unknown>;
}

export interface InputSchema {
  type: 'object';
  properties?: Properties;
  required?: Array<string>;
}

export interface Properties {
  [key: string]: Propertie;
}

export interface Propertie {
  type: 'string' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  items?: InputSchema;
  enum?: Array<string | number>;
  properties?: Properties;
}

export interface ExecutionContext {
  variables: Map<string, unknown>;
  tools: Map<string, Tool>;
}

export interface Action {
  type: 'prompt' | 'script' | 'hybrid';
  name: string;
  execute: (input: unknown, context: ExecutionContext) => Promise<unknown>;
  tools: Tool[];
}
