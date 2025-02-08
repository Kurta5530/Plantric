import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { getTabId, getWindowId, sleep } from '../utils';

/**
 * Browser tab management
 */
export class TabManagement implements Tool {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'tab_management';
    this.description = 'Browser tab management, view and operate tabs';
    this.input_schema = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: `The action to perform. The available actions are:
* \`tab_all\`: View all tabs and return the tabId and title.
* \`current_tab\`: Get current tab information (tabId, url, title).
* \`close_tab\`: Close the current tab.
* \`switch_tab [tabId]\`: Switch to the specified tab using tabId, eg: switch_tab 1000`,
        },
      },
      required: ['action'],
    };
  }

  /**
   * Tab management
   *
   * @param {*} params { action: 'tab_all' | 'current_tab' | 'close_tab' | 'switch_tab [tabId]' }
   * @returns > { result, success: true }
   */
  async execute(context: ExecutionContext, params: unknown): Promise<unknown> {
    if (typeof params !== 'object' || params === null || !('action' in params)) {
      throw new Error('Invalid parameters. Expected an object with a "action" property.');
    }
    let action = (params as any).action as string;
    let windowId = await getWindowId(context);
    let result: any = null;
    if (action == 'tab_all') {
      result = [];
      let tabs = await chrome.tabs.query({ windowId: windowId });
      for (let i = 0; i < tabs.length; i++) {
        let tab = tabs[i];
        let tabInfo: any = {
          tabId: tab.id,
          windowId: tab.windowId,
          title: tab.title,
          url: tab.url,
        };
        if (tab.active) {
          tabInfo.active = true;
        }
        result.push(tabInfo);
      }
    } else if (action == 'current_tab') {
      let tabId = await getTabId(context);
      let tab = await chrome.tabs.get(tabId);
      result = { tabId, windowId: tab.windowId, title: tab.title, url: tab.url };
    } else if (action == 'close_tab') {
      let closedTabId = await getTabId(context);
      await chrome.tabs.remove(closedTabId);
      await sleep(100);
      let currentTabId = null;
      let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length == 0) {
        tabs = await chrome.tabs.query({ status: 'complete', currentWindow: true });
      }
      let tab = tabs[tabs.length - 1];
      if (!tab.active) {
        await chrome.tabs.update(tab.id as number, { active: true });
      }
      currentTabId = tab.id;
      context.variables.set('tabId', tab.id);
      context.variables.set('windowId', tab.windowId);
      result = { closedTabId, currentTabId, currentTabTitle: tab.title };
    } else if (action.startsWith('switch_tab')) {
      let tabId = parseInt(action.replace('switch_tab', '').replace('[', '').replace(']', ''));
      let tab = await chrome.tabs.update(tabId, { active: true });
      context.variables.set('tabId', tab.id);
      context.variables.set('windowId', tab.windowId);
      result = { tabId, windowId: tab.windowId, title: tab.title, url: tab.url };
    }
    return {
      result,
      success: true,
    };
  }
}
