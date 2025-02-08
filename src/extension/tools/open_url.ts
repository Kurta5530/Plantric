import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { getWindowId, waitForTabComplete } from '../utils';

/**
 * Open Url
 */
export class OpenUrl implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'open_url';
    this.description = 'Open the specified URL link in browser window';
    this.input_schema = {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL link address',
        },
        newWindow: {
          type: 'boolean',
          description: 'true: Open in a new window; false: Open in the current window.',
        },
      },
      required: ['url'],
    };
  }

  /**
   * Open Url
   *
   * @param {*} params { url: 'https://google.com', newWindow: true }
   * @returns > { tabId, windowId, title, success: true }
   */
  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    if (typeof params !== 'object' || params === null || !('url' in params)) {
      throw new Error('Invalid parameters. Expected an object with a "url" property.');
    }
    let { url, newWindow } = params as any;
    let windowId: number;
    let tabId: number;
    if (newWindow) {
      let window = await chrome.windows.create({
        type: 'normal',
        state: 'maximized',
        url: url,
      } as any as chrome.windows.CreateData);
      windowId = window.id as number;
      let tabs = window.tabs || [
        await chrome.tabs.create({
          url: url,
          windowId: windowId,
        }),
      ];
      tabId = tabs[0].id as number;
    } else {
      windowId = await getWindowId(context);
      let tab = await chrome.tabs.create({
        url: url,
        windowId: windowId,
      });
      tabId = tab.id as number;
    }
    let tab = await waitForTabComplete(tabId);
    context.variables.set('windowId', windowId);
    context.variables.set('tabId', tabId);
    let windowIds = context.variables.get('windowIds') as Array<number>;
    if (windowIds) {
      windowIds.push(windowId);
    } else {
      context.variables.set('windowIds', [windowId] as Array<number>);
    }
    return {
      tabId,
      windowId,
      title: tab.title,
      success: true,
    };
  }
}
