import { ToolDefinition } from '../types/llm.types';
import { workflowSchema } from '../schemas/workflow.schema';

export const WORKFLOW_GENERATION_TOOL: ToolDefinition = {
  name: 'generate_workflow',
  description: `Generate a workflow following the Lyvo framework DSL schema. The workflow should:
    - Have a clear, descriptive name and ID
    - Include properly structured nodes with actions
    - Define appropriate dependencies between nodes
    - Specify input/output schemas for data flow
    - Include relevant tools based on the task description
    Each node should have a clear purpose contributing to the overall workflow goal.`,
  input_schema: {
    type: 'object',
    properties: {
      workflow: workflowSchema
    },
    required: ['workflow']
  }
};
