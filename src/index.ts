import { LyvoConfig, LyvoInvokeParam, Tool, Workflow } from './types';

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
}
