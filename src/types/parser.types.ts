import { Workflow, WorkflowNode } from './workflow.types';

export interface ValidationError {
    type: 'schema' | 'reference' | 'type' | 'tool';
    message: string;
    path?: string;  // JSON pointer to error location
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
