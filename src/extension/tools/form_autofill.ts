import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';

/**
 * Form Autofill
 */
export class FormAutofill implements Tool<any, any> {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'form_autofill';
    this.description = 'Form autofill';
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
