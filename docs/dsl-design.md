# Lyvo JSON Workflow DSL

## Overview
A JSON-based Domain Specific Language for defining AI agent workflows, optimized for LLM generation and programmatic manipulation.

## Design Goals
1. Schema-compliant JSON structure
2. Direct mapping to runtime types
3. Easy for LLMs to generate and modify
4. Validation through JSON Schema
5. Bidirectional conversion with runtime objects

## JSON Structure

### Basic Structure
```json
{
  "version": "1.0",
  "id": "string",
  "name": "string",
  "description": "string",
  "nodes": [Node],
  "variables": {
    "key": "value"
  }
}
```

### Node Structure
```json
{
  "id": "string",
  "type": "action | condition | loop",
  "dependencies": ["nodeId1", "nodeId2"],
  "input": {
    "type": "string",
    "schema": {}
  },
  "output": {
    "type": "string",
    "schema": {}
  },
  "action": {
    "type": "prompt | script | hybrid",
    "name": "string",
    "params": {},
    "tools": ["toolId1", "toolId2"]
  }
}
```

## Variable Resolution
- Use JSON Pointer syntax for referencing
- Example: "/nodes/0/output/value" refers to first node's output value
- Variables in params use ${variableName} syntax

## Type System
- Use JSON Schema for type definitions
- Runtime type validation through schema
- Support for primitives and complex objects
- Schema stored with type definitions

## Validation Rules
1. All node IDs must be unique
2. Dependencies must reference existing nodes
3. No circular dependencies
4. Type compatibility between connected nodes
5. All required parameters must be provided
6. All tools must be registered and available

## Error Types
1. Schema Validation Errors: Invalid JSON structure
2. Reference Errors: Invalid node references
3. Type Errors: Incompatible types between nodes
4. Tool Errors: Unavailable or invalid tools

## Example Workflow
```json
{
  "version": "1.0",
  "id": "search-workflow",
  "name": "Web Search Workflow",
  "nodes": [
    {
      "id": "search",
      "type": "action",
      "action": {
        "type": "script",
        "name": "webSearch",
        "params": {
          "query": "${searchQuery}",
          "maxResults": 10
        }
      },
      "output": {
        "type": "array",
        "schema": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": {"type": "string"},
              "url": {"type": "string"}
            }
          }
        }
      }
    }
  ],
  "variables": {
    "searchQuery": "Lyvo framework github"
  }
}
```
