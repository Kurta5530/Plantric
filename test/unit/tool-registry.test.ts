import { ToolRegistry } from '../../src/core/tool-registry';
import { Tool, InputSchema } from '../../src/types/action.types';

class MockTool implements Tool<any, any> {
  constructor(
    public name: string,
    public description: string = 'Mock tool description',
    public input_schema: InputSchema = {
      type: 'object',
      properties: {
        param: { type: 'string' }
      }
    }
  ) {}

  async execute(params: unknown): Promise<unknown> {
    return { executed: true };
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockTool: Tool<any, any>;

  beforeEach(() => {
    registry = new ToolRegistry();
    mockTool = new MockTool('mock_tool');
  });

  describe('tool management', () => {
    test('should register a tool successfully', () => {
      registry.registerTool(mockTool);
      expect(registry.getTool('mock_tool')).toBe(mockTool);
    });

    test('should throw when registering duplicate tool', () => {
      registry.registerTool(mockTool);
      expect(() => registry.registerTool(mockTool)).toThrow();
    });

    test('should unregister a tool successfully', () => {
      registry.registerTool(mockTool);
      registry.unregisterTool('mock_tool');
      expect(() => registry.getTool('mock_tool')).toThrow();
    });

    test('should throw when unregistering non-existent tool', () => {
      expect(() => registry.unregisterTool('non_existent')).toThrow();
    });

    test('should check for tool existence correctly', () => {
      registry.registerTool(mockTool);
      expect(registry.hasTools(['mock_tool'])).toBe(true);
      expect(registry.hasTools(['non_existent'])).toBe(false);
      expect(registry.hasTools(['mock_tool', 'non_existent'])).toBe(false);
    });
  });

  describe('tool enumeration', () => {
    beforeEach(() => {
      registry.registerTool(new MockTool('tool1'));
      registry.registerTool(new MockTool('tool2'));
    });

    test('should get all tools', () => {
      const tools = registry.getAllTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toEqual(['tool1', 'tool2']);
    });

    test('should get tool definitions', () => {
      const definitions = registry.getToolDefinitions();
      expect(definitions).toHaveLength(2);
      expect(definitions[0]).toHaveProperty('name', 'tool1');
      expect(definitions[0]).toHaveProperty('description');
      expect(definitions[0]).toHaveProperty('input_schema');
    });

    test('should get tool enum', () => {
      const enumValues = registry.getToolEnum();
      expect(enumValues).toEqual(['tool1', 'tool2']);
    });
  });

  describe('workflow schema generation', () => {
    beforeEach(() => {
      registry.registerTool(new MockTool('tool1'));
      registry.registerTool(new MockTool('tool2'));
    });

    test('should generate valid workflow schema', () => {
      const schema = registry.getWorkflowSchema() as any;

      // Basic schema structure
      expect(schema).toHaveProperty('type', 'object');
      expect(schema.properties).toHaveProperty('nodes');

      // Tool enum in action schema
      const actionTools = schema.properties.nodes.items.properties.action.properties.tools;
      expect(actionTools.items.enum).toEqual(['tool1', 'tool2']);
    });

    test('should update schema when tools change', () => {
      let schema = registry.getWorkflowSchema() as any;
      expect(schema.properties.nodes.items.properties.action.properties.tools.items.enum)
        .toEqual(['tool1', 'tool2']);

      registry.registerTool(new MockTool('tool3'));
      schema = registry.getWorkflowSchema() as any;
      expect(schema.properties.nodes.items.properties.action.properties.tools.items.enum)
        .toEqual(['tool1', 'tool2', 'tool3']);

      registry.unregisterTool('tool2');
      schema = registry.getWorkflowSchema() as any;
      expect(schema.properties.nodes.items.properties.action.properties.tools.items.enum)
        .toEqual(['tool1', 'tool3']);
    });
  });
});
