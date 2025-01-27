import { Workflow, WorkflowNode } from '../../src/types';
import { WorkflowImpl } from '../../src/models/workflow';

describe('Workflow', () => {
    it('should create a workflow with an empty node list', () => {
        const workflow = new WorkflowImpl('test-id', 'Test Workflow');
        expect(workflow.id).toBe('test-id');
        expect(workflow.name).toBe('Test Workflow');
        expect(workflow.nodes).toHaveLength(0);
    });
});
