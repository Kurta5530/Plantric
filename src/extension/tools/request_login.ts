import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
import { getTabId, doesTabExists } from '../utils';

export class RequestLogin implements Tool<any, any> {
  name: string;
  description: string;
  input_schema: InputSchema;

  constructor() {
    this.name = 'request_login';
    this.description = 'Login to this website, assist with identity verification when manual intervention is needed, guide users through the login process, and wait for their confirmation of successful login.';
    this.input_schema = {
      type: 'object',
      properties: {},
    };
  }

  async execute(context: ExecutionContext, params: any): Promise<any> {
    let tabId = await getTabId(context);
    let task_id = 'login_required_' + tabId;
    const request_user_help = async () => {
      await chrome.tabs.sendMessage(tabId, {
        type: 'request_user_help',
        task_id,
        failure_type: 'login_required',
        failure_message: 'Access page require user authentication.',
      });
    };
    const login_interval = setInterval(async () => {
      try {
        request_user_help();
      } catch (e) {
        clearInterval(login_interval);
      }
    }, 2000);
    try {
      let result = await this.awaitLogin(tabId, task_id);
      return { result };
    } finally {
      clearInterval(login_interval);
    }
  }

  async awaitLogin(tabId: number, task_id: string): Promise<boolean> {
    return new Promise((resolve) => {
      const checkTabClosedInterval = setInterval(async () => {
        const tabExists = await doesTabExists(tabId);
        if (!tabExists) {
          clearInterval(checkTabClosedInterval);
          resolve(false);
          chrome.runtime.onMessage.removeListener(listener);
        }
      }, 1000);
      const listener = (message: any) => {
        if (message.type === 'issue_resolved' && message.task_id === task_id) {
          resolve(true);
          clearInterval(checkTabClosedInterval);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
    });
  }
}
