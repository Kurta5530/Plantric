import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';

/**
 * Find Element Coordinate Position
 */
export class FindElementPosition implements Tool<any, any> {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'find_element_position';
    this.description = 'Find Element Coordinate Position';
    this.input_schema = {
      type: 'object',
      properties: {
        task_prompt: {
          type: 'string',
          description: 'Task prompt',
        },
      },
      required: ['task_prompt'],
    };
  }

  async execute(context: ExecutionContext, params: any): Promise<any> {
    if (typeof params !== 'object' || params === null || !params.task_prompt) {
      throw new Error('Invalid parameters. Expected an object with a "task_prompt" property.');
    }
    // form -> input, textarea, select ...
    throw new Error('Not implemented');
  }
}
