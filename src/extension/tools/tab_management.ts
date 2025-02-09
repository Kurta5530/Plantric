import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { getTabId, getWindowId, open_new_tab, sleep } from '../utils';

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
* \`switch_tab [tabId]\`: Switch to the specified tab using tabId, eg: switch_tab 1000.
* \`new_tab [url]\`: Open a new tab window and open the URL, eg: new_tab https://www.google.com`,
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
    } else if (action.startsWith('new_tab')) {
      let url = action.replace('new_tab', '').replace('[', '').replace(']', '').replace(/"/g, '');
      // First mandatory opening of a new window
      let newWindow = !context.variables.get('windowId') && !context.variables.get('tabId');
      let tab: chrome.tabs.Tab;
      if (newWindow) {
        tab = await open_new_tab(url, true);
      } else {
        let windowId = await getWindowId(context);
        tab = await open_new_tab(url, false, windowId);
      }
      let windowId = tab.windowId as number;
      let tabId = tab.id as number;
      context.variables.set('windowId', windowId);
      context.variables.set('tabId', tabId);
      if (newWindow) {
        let windowIds = context.variables.get('windowIds') as Array<number>;
        if (windowIds) {
          windowIds.push(windowId);
        } else {
          context.variables.set('windowIds', [windowId] as Array<number>);
        }
      }
      result = { tabId: tab.id, windowId: tab.windowId, title: tab.title, url: tab.url };
    }
    return {
      result,
      success: true,
    };
  }
}
