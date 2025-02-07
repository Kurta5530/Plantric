export const WORKFLOW_GENERATION_PROMPTS = {
    SYSTEM_PROMPT: `You are a workflow generation assistant that creates Lyvo framework workflows.
      Generate a complete, well-structured workflow based on the user's requirements.
      The workflow should follow these principles:
      1. Break down complex tasks into logical steps
      2. Use appropriate action types (prompt/script/hybrid) for each node
      3. Ensure proper data flow between nodes through input/output schemas
      4. Include relevant tools based on the task requirements
      5. Define clear dependencies between nodes
      Please think through the workflow structure carefully before generating.`,

    MODIFICATION_SYSTEM_PROMPT: `You are a workflow modification assistant.
      Update the existing workflow based on the user's requirements while maintaining its structure and validity.
      Ensure all modifications:
      1. Preserve existing node IDs where possible
      2. Maintain valid dependencies
      3. Update schemas appropriately
      4. Keep the workflow consistent with the DSL specification`,

    formatUserPrompt: (requirement: string) =>
      `Create a workflow for the following requirement: ${requirement}`,

    formatModificationPrompt: (currentWorkflow: string, requirement: string) => [
      {
        type: 'text',
        text: 'Here is the existing workflow:'
      },
      {
        type: 'text',
        text: currentWorkflow
      },
      {
        type: 'text',
        text: `Please modify the workflow according to this requirement: ${requirement}`
      }
    ]
  } as const;
