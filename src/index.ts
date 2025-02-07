import { WebSearch } from './extension/tools/web_search';
import { LyvoConfig, LyvoInvokeParam, Tool, Workflow, ExecutionContext } from './types';

/**
 * Lyvo core
 */
export class Lyvo {
  constructor(config: LyvoConfig) {
    // TODO ...
  }

  public async invoke(str: string, param?: LyvoInvokeParam): Promise<Workflow> {
    throw Error('Not implemented');
  }

  public registerTool(tool: Tool): void {
    throw Error('Not implemented');
  }

  public async pub(event: string): Promise<any> {
    throw Error('Not implemented');
  }

  public async testWebSearch(query: string, maxResults: number = 5): Promise<any> {
    let webSearch = new WebSearch();
    let context = {
      variables: {},
      tools: {},
    } as ExecutionContext;
    return await webSearch.execute(context, { query, maxResults });
  }
}
