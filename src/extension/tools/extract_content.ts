import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { executeScript, getCurrentTabId, injectScript, sleep } from '../utils';

/**
 * Extract Page Content
 */
export class ExtractContent implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'extract_content';
    this.description = 'Extract the text content of the current webpage';
    this.input_schema = {
      type: 'object',
      properties: {},
    };
  }

  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    let tabId = await this.getTabId(context);
    let tab = await chrome.tabs.get(tabId);
    await injectScript(tabId);
    await sleep(500);
    let content = await executeScript(tabId, getContent, []);
    return {
      tabId,
      result: {
        title: tab.title,
        url: tab.url,
        content: content,
      },
      success: true,
    };
  }

  async getTabId(context: ExecutionContext): Promise<number> {
    let tabId = context.variables.get('tabId') as any;
    if (!tabId) {
      tabId = await getCurrentTabId();
    }
    return tabId as number;
  }
}

function getContent() {
  return lyvo.extractHtmlContent();
}
