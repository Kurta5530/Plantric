import { Workflow, WorkflowNode } from '../types';

export class WorkflowImpl implements Workflow {
    constructor(
        public id: string,
        public name: string,
        public nodes: WorkflowNode[] = [],
        public variables: Map<string, unknown> = new Map()
    ) {}

    async execute(): Promise<void> {
        throw new Error('Not implemented');
    }

    addNode(node: WorkflowNode): void {
        throw new Error('Not implemented');
    }

    removeNode(nodeId: string): void {
        throw new Error('Not implemented');
    }

    getNode(nodeId: string): WorkflowNode {
        throw new Error('Not implemented');
    }

    validateDAG(): boolean {
        throw new Error('Not implemented');
    }
}
