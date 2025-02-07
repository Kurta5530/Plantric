// test/integration/workflow.generator.test.ts

import { ClaudeProvider } from '../../src/services/llm/claude-provider';
import { WorkflowGenerator } from '../../src/services/workflow/generator';
import { ToolRegistry } from '../../src/core/tool-registry';
import { Tool, InputSchema } from '../../src/types/action.types';
import { ValidationResult } from '../../src/types/parser.types';
import { WorkflowParser } from '../../src/services/parser/workflow-parser';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Mock browser tool base class to avoid duplicate code
class BrowserTool implements Tool {
  constructor(
    public name: string,
    public description: string,
    public input_schema: InputSchema
  ) {}

  async execute(params: unknown): Promise<unknown> {
    throw new Error('Not implemented');
  }
}

// Create mock browser tools
function createBrowserTools(): Tool[] {
  return [
    new BrowserTool(
      'open_url',
      'Opens a specified URL in the current browser tab',
      {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to open'
          }
        },
        required: ['url']
      }
    ),
    new BrowserTool(
      'find_dom_object',
      'Finds a DOM element using CSS selector, returns multiple elements if found',
      {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector to find elements'
          },
          waitForElement: {
            type: 'boolean',
            description: 'Whether to wait for elements to appear'
          },
          timeout: {
            type: 'integer',
            description: 'Maximum time to wait in milliseconds'
          }
        },
        required: ['selector']
      }
    ),
    new BrowserTool(
      'click_dom_object',
      'Clicks on a DOM element found by CSS selector',
      {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of element to click'
          }
        },
        required: ['selector']
      }
    ),
    new BrowserTool(
      'input_text',
      'Types text into a form field',
      {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of input element'
          },
          text: {
            type: 'string',
            description: 'Text to type'
          },
          clear: {
            type: 'boolean',
            description: 'Whether to clear existing text first'
          }
        },
        required: ['selector', 'text']
      }
    ),
    new BrowserTool(
      'copy_dom_object_text',
      'Extracts text content from DOM elements matching a selector',
      {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of elements to copy text from'
          }
        },
        required: ['selector']
      }
    ),
    new BrowserTool(
      'save_file',
      'Saves content to a file',
      {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Content to save'
          },
          filename: {
            type: 'string',
            description: 'Name of the file'
          },
          type: {
            type: 'string',
            description: 'File type',
            enum: ['text/plain', 'text/csv', 'text/html', 'application/json']
          }
        },
        required: ['content', 'filename']
      }
    )
  ];
}

const ENABLE_INTEGRATION_TESTS = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeIntegration = ENABLE_INTEGRATION_TESTS ? describe : describe.skip;

describeIntegration('WorkflowGenerator Integration', () => {
  let toolRegistry: ToolRegistry;
  let generator: WorkflowGenerator;

  // Helper function to save workflow DSL to file
  async function saveWorkflowToFile(dsl: string, filename: string) {
    const testOutputDir = path.join(__dirname, '../fixtures/generated');
    await fs.mkdir(testOutputDir, { recursive: true });
    await fs.writeFile(path.join(testOutputDir, filename), dsl, 'utf-8');
  }

  beforeAll(() => {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for integration tests');
    }

    // Set up registry with browser tools
    toolRegistry = new ToolRegistry();
    createBrowserTools().forEach(tool => toolRegistry.registerTool(tool));

    // Create generator with Claude provider
    const llmProvider = new ClaudeProvider(ANTHROPIC_API_KEY);
    generator = new WorkflowGenerator(llmProvider, toolRegistry);
  });

  it('should generate workflow for finding Chromium developers', async () => {
    const prompt = "Find Chromium developers from Github, collect the profiles, and summarize the results to CSV";

    // Generate workflow
    const workflow = await generator.generateWorkflow(prompt);

    // Convert to DSL for validation and inspection
    const dsl = WorkflowParser.serialize(workflow);

    // Save DSL for human inspection
    await saveWorkflowToFile(dsl, 'github_chromium_workflow.json');

    // Validate the generated workflow
    const validationResult: ValidationResult = WorkflowParser.validate(JSON.parse(dsl));

    // Log validation errors if any (helpful for debugging)
    if (!validationResult.valid) {
      console.error('Validation errors:', JSON.stringify(validationResult.errors, null, 2));
    }

    // Assert validation
    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);

    // Basic structure checks
    expect(workflow.id).toBeDefined();
    expect(workflow.name).toBeDefined();
    expect(workflow.nodes).toBeDefined();
    expect(workflow.nodes.length).toBeGreaterThan(0);

    // Log workflow structure for inspection
    console.log('\nGenerated Workflow Structure:');
    console.log('ID:', workflow.id);
    console.log('Name:', workflow.name);
    console.log('Number of nodes:', workflow.nodes.length);
    console.log('Nodes:', workflow.nodes.map(n => ({
      id: n.id,
      name: n.name,
      dependencies: n.dependencies,
      action: {
        type: n.action.type,
        tools: n.action.tools.map(t => t.name)
      }
    })));

    // Verify tool usage
    const usedTools = new Set<string>();
    workflow.nodes.forEach(node => {
      node.action.tools.forEach(tool => {
        usedTools.add(tool.name);
      });
    });

    console.log('\nTools used:', Array.from(usedTools));

    // Expected tools for this workflow
    const expected_tools = new Set([
      'open_url',         // For navigating to Github
      'input_text',       // For entering search terms
      'click_dom_object', // For interaction
      'find_dom_object',  // For finding profile elements
      'copy_dom_object_text', // For extracting profile data
      'save_file'         // For saving the CSV
    ]);

    // Verify reasonable tool usage
    expect(usedTools.size).toBeGreaterThanOrEqual(3);
    usedTools.forEach(tool => {
      expect(expected_tools).toContain(tool);
    });

    // Verify workflow has proper node dependencies
    expect(workflow.validateDAG()).toBe(true);

    // The last node should use save_file tool to create CSV
    const lastNode = workflow.nodes[workflow.nodes.length - 1];
    expect(lastNode.action.tools.some(t => t.name === 'save_file')).toBe(true);

    // First node should have no dependencies
    const firstNode = workflow.nodes[0];
    expect(firstNode.dependencies.length).toBe(0);

    // Other nodes should have dependencies
    workflow.nodes.slice(1).forEach(node => {
      expect(node.dependencies.length).toBeGreaterThan(0);
    });
  }, 30000); // Increased timeout for LLM
});
