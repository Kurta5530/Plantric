
export async function pub(tabId: number, event: string, params: any): Promise<any> {
    return await chrome.tabs.sendMessage(tabId as number, {
      type: 'lyvo:message',
      event,
      params,
    });
  }
  
  export async function getLLMConfig(name: string = 'llmConfig'): Promise<any> {
    let result = await chrome.storage.local.get([name]);
    return result[name];
  }
  