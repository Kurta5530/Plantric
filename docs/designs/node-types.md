# Advanced Node Types Design Document

## Overview
This document describes the design for conditional and loop node types in the Lyvo workflow system. While the current implementation only supports action nodes, this design can be referenced when adding support for more complex control flow patterns.

## Node Types

### 1. Condition Nodes

Condition nodes enable branching logic in workflows by evaluating expressions and directing flow accordingly.

```typescript
interface ConditionNode extends BaseNode {
  type: 'condition';
  condition: {
    expression: string;      // Boolean expression to evaluate
    truePathNodeId?: string; // Next node if true
    falsePathNodeId?: string;// Next node if false
  };
}
```

Key Features:
- Expression evaluation using workflow context
- Optional true/false paths (for optional branches)
- Access to previous nodes' outputs in condition
- Type-safe expression evaluation

Example:
```json
{
  "id": "check-status",
  "type": "condition",
  "name": "Check API Response",
  "condition": {
    "expression": "input.status === 200",
    "truePathNodeId": "process-data",
    "falsePathNodeId": "handle-error"
  }
}
```

### 2. Loop Nodes

Loop nodes enable iteration patterns with two main variants: foreach and while loops.

#### Foreach Loop
```typescript
interface ForeachLoopNode extends BaseLoopNode {
  loopType: 'foreach';
  foreach: {
    collection: string;     // Expression returning array
    itemVariable: string;   // Current item variable name
    indexVariable?: string; // Optional index variable
  };
}
```

#### While Loop
```typescript
interface WhileLoopNode extends BaseLoopNode {
  loopType: 'while';
  while: {
    condition: string;      // Boolean expression
    checkBefore: boolean;   // while vs do-while behavior
  };
}
```

Common Loop Features:
```typescript
interface BaseLoopNode extends BaseNode {
  type: 'loop';
  loopType: LoopType;
  maxIterations?: number;  // Safety limit
  bodyNodeIds: string[];   // Nodes to execute in loop
}
```

## Control Flow Mechanisms

### Loop Control
1. Break Conditions:
   - Maximum iterations reached
   - Explicit break signal (`__break` variable)
   - Timeout exceeded
   - While condition false
   - Exception in body execution

2. Continue Support:
   - Skip remaining body nodes
   - Continue to next iteration
   - Controlled via `__continue` variable

### Context Management
1. Loop Variables:
   - Current item reference
   - Index tracking
   - Accumulator support

2. Scope Isolation:
   - Loop-local variables
   - Parent context access
   - Result aggregation

## Example Patterns

### 1. Retry Pattern
```json
{
  "id": "retry-loop",
  "type": "loop",
  "loopType": "while",
  "while": {
    "condition": "context.variables.get('needsRetry')",
    "checkBefore": true
  },
  "bodyNodeIds": ["api-call", "check-response"],
  "maxIterations": 3
}
```

### 2. Batch Processing
```json
{
  "id": "process-batch",
  "type": "loop",
  "loopType": "foreach",
  "foreach": {
    "collection": "input.items",
    "itemVariable": "item",
    "indexVariable": "index"
  },
  "bodyNodeIds": ["validate", "transform", "save"],
  "maxIterations": 1000
}
```

## Implementation Considerations

### 1. Type Safety
- Runtime type checking for expressions
- Compile-time node type validation
- Context variable type preservation

### 2. Performance
- Parallel execution of independent iterations
- Resource cleanup between iterations
- Memory management for large collections

### 3. Error Handling
- Loop-specific error types
- Partial execution results
- Recovery mechanisms

### 4. Debugging
- Iteration tracking
- Expression evaluation tracing
- Loop state inspection

## Future Extensions

1. **Parallel Loops**
   - Concurrent iteration execution
   - Batch size control
   - Resource pooling

2. **Advanced Break Conditions**
   - Time-based limits
   - Resource consumption limits
   - External signal handling

3. **State Management**
   - Persistent loop state
   - Checkpoint/resume capability
   - Progress tracking

## Migration Path

To implement these advanced nodes:

1. Update schema validation
2. Extend node executor
3. Add type definitions
4. Implement context extensions
5. Add execution engine support

## Conclusion

This design provides a foundation for adding complex control flow to workflows while maintaining type safety and execution control. Implementation should be phased, starting with basic conditionals, then foreach loops, and finally while loops.
