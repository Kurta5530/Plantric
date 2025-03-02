import { BrowserTab, ExecutionContext } from '../types/action.types';
import { LLMParameters, Message } from '../types/llm.types';
import { extractHtmlContent } from '../web/tools/browser';

export async function getWindowId(context: ExecutionContext): Promise<number> {
  let windowId = context.variables.get('windowId') as any;
  if (windowId) {
    try {
      await chrome.windows.get(windowId);
    } catch (e) {
      windowId = null;
      context.variables.delete('windowId');
      let tabId = context.variables.get('tabId') as any;
      if (tabId) {
        try {
          let tab = await chrome.tabs.get(tabId);
          windowId = tab.windowId;
        } catch (e) {
          context.variables.delete('tabId');
        }
      }
    }
  }
  if (!windowId) {
    const window = await chrome.windows.getCurrent();
    windowId = window.id;
  }
  return windowId as number;
}

export async function getTabId(context: ExecutionContext): Promise<number> {
  let tabId = context.variables.get('tabId') as any;
  if (tabId) {
    try {
      await chrome.tabs.get(tabId);
    } catch (e) {
      tabId = null;
      context.variables.delete('tabId');
    }
  }
  if (!tabId) {
    let windowId = context.variables.get('windowId') as any;
    if (windowId) {
      try {
        tabId = await getCurrentTabId(windowId);
      } catch (e) {
        tabId = await getCurrentTabId();
        context.variables.delete('windowId');
      }
    } else {
      tabId = await getCurrentTabId();
    }
  }
  return tabId as number;
}

export async function getAllTabs(context: ExecutionContext): Promise<BrowserTab[]> {
  const currentWindow = await chrome.windows.getCurrent();
  const windowId = currentWindow.id;
  const tabs = await chrome.tabs.query({ windowId });
  const tabsInfo: BrowserTab[] = [];

  for (const tab of tabs) {
    if (tab.id === undefined) {
      console.warn(`Tab ID is undefined for tab with URL: ${tab.url}`);
      continue;
    }

    await injectScript(tab.id);
    await sleep(500);
    let content = await executeScript(tab.id, () => {
      return extractHtmlContent();
    }, []);

    // let LLM summaries the description
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are an AI assistant specialized in analyzing HTML content. Your task is to receive an HTML document from the user, summarize its key elements and content, and then provide a concise and informative description of the HTML document. The description should include the main purpose of the document, its structure, and any notable features or content elements. Ensure that the summary is clear, accurate, and captures the essence of the HTML document without including unnecessary details.`,
      },
      {
        role: 'user',
        content: content,
      }
    ]
    const params: LLMParameters = {
      temperature: 0.7,
      maxTokens: 8192,
    };
    const response = await context.llmProvider.generateText(messages, params);

    // get last response as description
    let description = "No description available.";
    if (typeof response.content == "string") {
      description = response.content;
    } else {
      const textBlocks = response.content.filter(
        (block: any): block is { type: 'text'; text: string } =>
          block.type === 'text'
      );
      if (textBlocks.length > 0) {
        description = textBlocks[textBlocks.length - 1].text;
      }
    }
    
    const tabInfo: BrowserTab = {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      content: content,
      description: description,
    };

    console.log("url: " + tab.url);
    console.log("title: " + tab.title);
    console.log("description: " + description);
    tabsInfo.push(tabInfo);
  }

  return tabsInfo;
}

export function getCurrentTabId(windowId?: number | undefined): Promise<number | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ windowId, active: true, lastFocusedWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        resolve(tabs[0].id);
      } else {
        chrome.tabs.query({ windowId, active: true, currentWindow: true }, function (_tabs) {
          if (_tabs.length > 0) {
            resolve(_tabs[0].id);
            return;
          } else {
            chrome.tabs.query({ windowId, status: 'complete', currentWindow: true }, function (__tabs) {
              resolve(__tabs.length ? __tabs[__tabs.length - 1].id : undefined);
            });
          }
        });
      }
    });
  });
}

export async function open_new_tab(
  url: string,
  newWindow: boolean,
  windowId?: number
): Promise<chrome.tabs.Tab> {
  let tabId;
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
    if (!windowId) {
      const window = await chrome.windows.getCurrent();
      windowId = window.id;
    }
    let tab = await chrome.tabs.create({
      url: url,
      windowId: windowId,
    });
    tabId = tab.id as number;
  }
  let tab = await waitForTabComplete(tabId);
  await sleep(200);
  return tab;
}

export async function executeScript(tabId: number, func: any, args: any[]): Promise<any> {
  let frameResults = await chrome.scripting.executeScript({
    target: { tabId: tabId as number },
    func: func,
    args: args,
  });
  return frameResults[0].result;
}

export async function waitForTabComplete(
  tabId: number,
  timeout: number = 15_000
): Promise<chrome.tabs.Tab> {
  return new Promise(async (resolve, reject) => {
    let tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      resolve(tab);
      return;
    }
    const time = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject();
    }, timeout);
    const listener = async (updatedTabId: number, changeInfo: any, tab: chrome.tabs.Tab) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(time);
        resolve(tab);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

export async function doesTabExists(tabId: number) {
  const tabExists = await new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
  return tabExists;
}

export async function getPageSize(tabId?: number): Promise<[number, number]> {
  if (!tabId) {
    tabId = await getCurrentTabId();
  }
  let injectionResult = await chrome.scripting.executeScript({
    target: { tabId: tabId as number },
    func: () => [
      window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
    ],
  });
  return [injectionResult[0].result[0] as number, injectionResult[0].result[1] as number];
}

export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), time));
}

export async function injectScript(tabId: number, filename?: string) {
  let files = ['lyvo/script/common.js'];
  if (filename) {
    files.push('lyvo/script/' + filename);
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: files,
  });
}

export class MsgEvent {
  eventMap: { [key: string]: Function };

  constructor() {
    this.eventMap = {};
  }

  addListener(callback: Function, id: string) {
    if (!id) {
      id = new Date().getTime() + '' + Math.floor(Math.random() * 10000);
    }
    this.eventMap[id] = callback;
    return id;
  }

  removeListener(id: string) {
    delete this.eventMap[id];
  }

  async publish(msg: any) {
    let values = Object.values(this.eventMap);
    for (let i = 0; i < values.length; i++) {
      try {
        let result = values[i](msg);
        if (isPromise(result)) {
          await result;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
}

/**
 * Counter (Function: Wait for all asynchronous tasks to complete)
 */
export class CountDownLatch {
  resolve?: Function;
  currentCount: number;

  constructor(count: number) {
    this.resolve = undefined;
    this.currentCount = count;
  }

  countDown() {
    this.currentCount = this.currentCount - 1;
    if (this.currentCount <= 0) {
      this.resolve && this.resolve();
    }
  }

  await(timeout: number): Promise<void> {
    const $this = this;
    return new Promise<void>((_resolve, reject) => {
      let resolve = _resolve;
      if (timeout > 0) {
        let timeId = setTimeout(reject, timeout);
        resolve = () => {
          clearTimeout(timeId);
          _resolve();
        };
      }
      $this.resolve = resolve;
      if ($this.currentCount <= 0) {
        resolve();
      }
    });
  }
}

export function isPromise(obj: any) {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}
