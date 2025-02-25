import { WorkflowParser } from '../../src/services/parser/workflow-parser';
import { ValidationResult } from '../../src/types/parser.types';
import { Workflow } from '../../src/types/workflow.types';

describe('WorkflowParser', () => {
  const validWorkflowJson = {
    version: "1.0",
    id: "test-workflow",
    name: "Test Workflow",
    description: "A test workflow",
    nodes: [
      {
        id: "node1",
        name: "First Node",
        action: {
          type: "script",
          name: "testAction",
          tools: ["tool1", "tool2"]
        },
        output: {
          name: "output1",
          description: "Intermediate result"
        }
      },
      {
        id: "node2",
        name: "Second Node",
        dependencies: ["node1"],
        action: {
          type: "prompt",
          name: "promptAction"
        },
        output: {
          name: "output2",
          description: "Final result"
        }
      }
    ],
    variables: {
      testVar: "value"
    }
  };

  describe('parse', () => {
    it('should successfully parse valid workflow JSON', () => {
      const json = JSON.stringify(validWorkflowJson);
      const workflow = WorkflowParser.parse(json);

      expect(workflow.id).toBe("test-workflow");
      expect(workflow.name).toBe("Test Workflow");
      expect(workflow.description).toBe("A test workflow");
      expect(workflow.nodes).toHaveLength(2);
      expect(workflow.variables.get("testVar")).toBe("value");
    });

    it('should throw on invalid JSON', () => {
      const invalidJson = '{ invalid json';
      expect(() => WorkflowParser.parse(invalidJson)).toThrow('Invalid JSON');
    });

    it('should throw on validation errors', () => {
      const invalidWorkflow = {
        ...validWorkflowJson,
        nodes: [
          {
            id: "node1",
            name: "Invalid Node"
            // Missing required action
          }
        ]
      };
      expect(() => WorkflowParser.parse(JSON.stringify(invalidWorkflow)))
        .toThrow('Invalid workflow');
    });
  });

  describe('serialize', () => {
    it('should serialize workflow back to JSON', () => {
      const json = JSON.stringify(validWorkflowJson);
      const workflow = WorkflowParser.parse(json);
      const serialized = WorkflowParser.serialize(workflow);
      const parsed = JSON.parse(serialized);

      expect(parsed.id).toBe(validWorkflowJson.id);
      expect(parsed.name).toBe(validWorkflowJson.name);
      expect(parsed.nodes).toHaveLength(validWorkflowJson.nodes.length);
    });
  });

  describe('validate', () => {
    it('should validate correct workflow structure', () => {
      const result = WorkflowParser.validate(validWorkflowJson);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidWorkflow = {
        id: "test-workflow",
        // Missing name and nodes
      };
      const result = WorkflowParser.validate(invalidWorkflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required field'))).toBe(true);
    });

    it('should catch invalid node references', () => {
      const workflowWithBadRef = {
        ...validWorkflowJson,
        nodes: [
          {
            id: "node1",
            name: "Node",
            action: { type: "script", name: "test" },
            dependencies: ["non-existent-node"]
          }
        ]
      };
      const result = WorkflowParser.validate(workflowWithBadRef);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'reference')).toBe(true);
    });

    it('should catch duplicate node ids', () => {
      const workflowWithDuplicates = {
        ...validWorkflowJson,
        nodes: [
          {
            id: "node1",
            name: "Node 1",
            action: { type: "script", name: "test" }
          },
          {
            id: "node1", // Duplicate ID
            name: "Node 2",
            action: { type: "script", name: "test" }
          }
        ]
      };
      const result = WorkflowParser.validate(workflowWithDuplicates);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate node id'))).toBe(true);
    });

    it('should validate action types', () => {
      const workflowWithInvalidAction = {
        ...validWorkflowJson,
        nodes: [
          {
            id: "node1",
            name: "Node",
            action: { type: "invalid-type", name: "test" }
          }
        ]
      };
      const result = WorkflowParser.validate(workflowWithInvalidAction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Invalid action type'))).toBe(true);
    });
  });

  describe('runtime conversion', () => {
    it('should preserve node dependencies', () => {
      const json = JSON.stringify(validWorkflowJson);
      const workflow = WorkflowParser.parse(json);
      const node2 = workflow.getNode('node2');
      expect(node2.dependencies).toContain('node1');
    });

    it('should set default values for optional fields', () => {
      const minimalNode = {
        version: "1.0",
        id: "test",
        name: "Test",
        nodes: [{
          id: "node1",
          action: { type: "script", name: "test" }
        }]
      };
      const workflow = WorkflowParser.parse(JSON.stringify(minimalNode));
      const node = workflow.getNode('node1');
      expect(node.dependencies).toEqual([]);
      expect(node.input).toBeDefined();
      expect(node.output).toBeDefined();
    });

    it('should preserve output specifications', () => {
      const workflow = WorkflowParser.parse(JSON.stringify(validWorkflowJson));
      const node = workflow.getNode('node1');
      expect(node.output.name).toEqual(validWorkflowJson.nodes[0].output.name);
      expect(node.output.description).toEqual(validWorkflowJson.nodes[0].output.description);
    });
  });
});
