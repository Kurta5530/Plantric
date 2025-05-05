import { LLMConfig, LyvoConfig, LyvoInvokeParam, Tool, Workflow, WorkflowCallback, WorkflowResult } from '../types';
import { ILogObj, Logger } from 'tslog';
/**
 * Lyvo core
 */
export declare class Lyvo {
    static tools: Map<string, Tool<any, any>>;
    private llmProvider;
    private lyvoConfig;
    private toolRegistry;
    private workflowGeneratorMap;
    prompt: string;
    tabs: chrome.tabs.Tab[];
    workflow?: Workflow;
    constructor(llmConfig: LLMConfig, lyvoConfig?: LyvoConfig);
    static getLogger(): Logger<ILogObj>;
    getLoggerInstaceUUID(): string;
    private buildLyvoConfig;
    private registerTools;
    generate(prompt: string, tabs?: chrome.tabs.Tab[], param?: LyvoInvokeParam): Promise<Workflow>;
    execute(workflow: Workflow): Promise<WorkflowResult>;
    cancel(): Promise<void>;
    modify(workflow: Workflow, prompt: string): Promise<Workflow>;
    private getTool;
    callTool(toolName: string, input: object, callback?: WorkflowCallback): Promise<any>;
    callTool(tool: Tool<any, any>, input: object, callback?: WorkflowCallback): Promise<any>;
    registerTool(tool: Tool<any, any>): void;
    unregisterTool(toolName: string): void;
}
export default Lyvo;
