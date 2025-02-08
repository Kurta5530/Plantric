import { ExecutionContext } from '../types/action.types';

export async function getWindowId(context: ExecutionContext): Promise<number> {
  let windowId = context.variables.get('windowId') as any;
  if (!windowId) {
    const window = await chrome.windows.getCurrent();
    windowId = window.id;
  }
  return windowId as number;
}

export async function getTabId(context: ExecutionContext): Promise<number> {
  let tabId = context.variables.get('tabId') as any;
  if (!tabId) {
    tabId = await getCurrentTabId();
  }
  return tabId as number;
}

export function getCurrentTabId(): Promise<number | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        resolve(tabs[0].id);
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, function (_tabs) {
          if (_tabs.length > 0) {
            resolve(_tabs[0].id);
            return;
          } else {
            chrome.tabs.query({ status: 'complete', currentWindow: true }, function (__tabs) {
              resolve(__tabs.length ? __tabs[__tabs.length - 1].id : undefined);
            });
          }
        });
      }
    });
  });
}

export async function executeScript(tabId: number, func: any, args: any): Promise<any> {
  let frameResults = await chrome.scripting.executeScript({
    target: { tabId: tabId as number },
    func: func,
    args: args,
  });
  return frameResults[0].result
}

export async function waitForTabComplete(tabId: number, timeout: number = 30_000): Promise<any> {
  return new Promise(async (resolve, reject) => {
    let tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') {
      resolve(tab);
      return;
    }
    const time = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject()
    }, timeout);
    const listener = async (updatedTabId: any, changeInfo: any, tab: any) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(time);
        resolve(tab);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
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
