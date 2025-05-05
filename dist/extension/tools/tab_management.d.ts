import { TabManagementParam, TabManagementResult } from '../../types/tools.types';
import { Tool, InputSchema, ExecutionContext } from '../../types/action.types';
/**
 * Browser tab management
 */
export declare class TabManagement implements Tool<TabManagementParam, TabManagementResult> {
    name: string;
    description: string;
    input_schema: InputSchema;
    constructor();
    execute(context: ExecutionContext, params: TabManagementParam): Promise<TabManagementResult>;
    destroy(context: ExecutionContext): void;
}
