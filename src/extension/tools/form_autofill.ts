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
    this.description = 'Automatically fill in form data on web pages';
    this.input_schema = {
      type: 'object',
      properties: {}
    };
  }

  async execute(context: ExecutionContext, params: any): Promise<any> {
    // form -> input, textarea, select ...
    throw new Error('Not implemented');
  }

}
