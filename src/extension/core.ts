import * as tools from './tools';
import { Tool } from '../types';

export async function pub(tabId: number, event: string, params: any): Promise<any> {
  return await chrome.tabs.sendMessage(tabId as number, {
    type: 'lyvo:message',
    event,
    params,
  });
}

export async function getLLMConfig(name: string = 'llmConfig'): Promise<{
  llm?: string;
  apiKey?: string;
  modelName?: string;
  options?: {[key:string]:any};
} | undefined> {
  let result = await chrome.storage.sync.get([name]);
  return result[name];
}

export function getAllTools(): Map<string, Tool<any, any>> {
  let toolsMap = new Map<string, Tool<any, any>>();
  for (const key in tools) {
    let tool = (tools as any)[key];
    if (typeof tool === 'function' && tool.prototype && 'execute' in tool.prototype) {
      try {
        let instance = new tool();
        toolsMap.set(instance.name || key, instance);
      } catch (e) {
        console.error(`Failed to instantiate ${key}:`, e);
      }
    }
  }
  return toolsMap;
}
