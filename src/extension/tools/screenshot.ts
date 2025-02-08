import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { screenshot } from './computer';
import { getWindowId } from '../utils';

/**
 * Current Page Screenshot
 */
export class Screenshot implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'screenshot';
    this.description = 'Screenshot the current webpage window';
    this.input_schema = {
      type: 'object',
      properties: {},
    };
  }

  /**
   * Current Page Screenshot
   *
   * @param {*} params {}
   * @returns > { image: { type: 'base64', media_type: 'image/png', data } }
   */
  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    let windowId = await getWindowId(context);
    return await screenshot(windowId);
  }
}
