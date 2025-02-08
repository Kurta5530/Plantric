import { LyvoConfig, LyvoInvokeParam, Tool, Workflow } from '../types';

/**
 * Lyvo core
 */
export default class Lyvo {
  constructor(config: LyvoConfig) {
    // TODO ...
  }

  public async invoke(str: string, param?: LyvoInvokeParam): Promise<Workflow> {
    throw Error('Not implemented');
  }

  public registerTool(tool: Tool): void {
    throw Error('Not implemented');
  }

}