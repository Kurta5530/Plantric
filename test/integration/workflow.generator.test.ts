import { ClaudeProvider } from '../../src/services/llm/claude-provider';
import { WorkflowGenerator } from '../../src/services/workflow/generator';
import { WorkflowParser } from '../../src/services/parser/workflow-parser';
import { ValidationResult } from '../../src/types/parser.types';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required for integration tests');
}

// Only run these tests if explicitly enabled
const ENABLE_INTEGRATION_TESTS = process.env.ENABLE_INTEGRATION_TESTS === 'true';
const describeIntegration = ENABLE_INTEGRATION_TESTS ? describe : describe.skip;

describeIntegration('WorkflowGenerator Integration', () => {
  let generator: WorkflowGenerator;
  let parser: WorkflowParser;

  beforeAll(() => {
    const llmProvider = new ClaudeProvider(ANTHROPIC_API_KEY);
    generator = new WorkflowGenerator(llmProvider);
    parser = new WorkflowParser();
  });

  // Helper function to save workflow DSL to file
  async function saveWorkflowToFile(dsl: string, filename: string) {
    const testOutputDir = path.join(__dirname, '../fixtures/generated');
    await fs.mkdir(testOutputDir, { recursive: true });
    await fs.writeFile(path.join(testOutputDir, filename), dsl, 'utf-8');
  }

  describe('generateWorkflow', () => {
    const testCases = [
      {
        name: 'simple_github_search',
        prompt: 'Search for Chromium developers on GitHub, collect their profiles, and summarize the results to a CSV file',
        outputFile: 'github_search_workflow.json',
      },
      // Add more test cases as needed
    ];

    testCases.forEach(({ name, prompt, outputFile }) => {
      it(`should generate valid workflow for ${name}`, async () => {
        // Generate workflow
        const workflow = await generator.generateWorkflow(prompt);

        // Convert to DSL for validation and inspection
        const dsl = JSON.stringify(workflow, null, 2);

        // Save DSL for human inspection
        await saveWorkflowToFile(dsl, outputFile);

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
        expect(Array.isArray(workflow.nodes)).toBe(true);
        expect(workflow.nodes.length).toBeGreaterThan(0);

        // Log workflow structure for inspection
        console.log(`\nGenerated workflow for "${name}":`);
        console.log('Number of nodes:', workflow.nodes.length);
        console.log(
          'Nodes:',
          workflow.nodes.map((n) => ({
            name: n.name,
            action: n.action.type, // 'prompt' | 'script' | 'hybrid'
            tools: n.action.tools,
          }))
        );
        console.log('Tools used:', workflow.nodes.map((n) => n.action.tools).flat());
      }, 30000); // Increased timeout for LLM calls
    });
  });

  describe.skip('modifyWorkflow', () => {
    it('should modify workflow while maintaining validity', async () => {
      // First generate a base workflow
      const baseWorkflow = await generator.generateWorkflow(
        'Search for Chromium developers on Github'
      );

      // Save original for comparison
      const originalDsl = JSON.stringify(baseWorkflow, null, 2);
      await saveWorkflowToFile(originalDsl, 'original_workflow.json');

      // Modify the workflow
      const modifiedWorkflow = await generator.modifyWorkflow(
        baseWorkflow,
        'Also include their GitHub contributions'
      );

      // Save modified version
      const modifiedDsl = JSON.stringify(modifiedWorkflow, null, 2);
      await saveWorkflowToFile(modifiedDsl, 'modified_workflow.json');

      // Validate modified workflow
      const validationResult = WorkflowParser.validate(modifiedDsl);

      if (!validationResult.valid) {
        console.error('Validation errors:', JSON.stringify(validationResult.errors, null, 2));
      }

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify that modification added new functionality
      const hasGithubNode = modifiedWorkflow.nodes.some(
        (node) =>
          node.action.tools?.some((tool) => tool.name === 'github-api') ||
          JSON.stringify(node).toLowerCase().includes('github')
      );
      expect(hasGithubNode).toBe(true);

      // Compare structures
      console.log('\nWorkflow comparison:');
      console.log('Original nodes:', baseWorkflow.nodes.length);
      console.log('Modified nodes:', modifiedWorkflow.nodes.length);
      console.log(
        'New tools:',
        modifiedWorkflow.nodes
          .map((n) => n.action.tools)
          .flat()
          .filter(
            (tool) =>
              !baseWorkflow.nodes
                .map((n) => n.action.tools)
                .flat()
                .includes(tool)
          )
      );
    }, 60000); // Increased timeout for multiple LLM calls
  });
});
