import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';

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

  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    let windowId = context.variables.get('windowId') as any;
    return await screenshot(windowId);
  }
}

export async function screenshot(windowId?: number): Promise<{
  image: {
    type: 'base64';
    media_type: 'image/png' | 'image/jpeg';
    data: string;
  };
}> {
  if (!windowId) {
    const window = await chrome.windows.getCurrent();
    windowId = window.id;
  }
  let dataUrl = await chrome.tabs.captureVisibleTab(windowId as number, {
    format: 'jpeg', // jpeg / png
    quality: 80, // 0-100
  });
  let data = dataUrl.substring(dataUrl.indexOf('base64,') + 7);
  return {
    image: {
      type: 'base64',
      media_type: dataUrl.indexOf('png') > -1 ? 'image/png' : 'image/jpeg',
      data: data,
    },
  };
}
