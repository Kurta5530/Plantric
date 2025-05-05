import { LLMProvider, Message } from '../../types/llm.types';
import { Workflow } from '../../types/workflow.types';
import { ToolRegistry } from '../../core/tool-registry';
import { LyvoConfig } from '@/types';
export declare class WorkflowGenerator {
    private llmProvider;
    private toolRegistry;
    message_history: Message[];
    constructor(llmProvider: LLMProvider, toolRegistry: ToolRegistry);
    generateWorkflow(prompt: string, lyvoConfig: LyvoConfig): Promise<Workflow>;
    generateWorkflowFromJson(json: any, lyvoConfig: LyvoConfig): Promise<Workflow>;
    modifyWorkflow(prompt: string, lyvoConfig: LyvoConfig): Promise<Workflow>;
    private doGenerateWorkflow;
    private createWorkflowFromData;
    private createFastWorkflowFromData;
}
